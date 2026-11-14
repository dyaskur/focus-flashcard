import { error, redirect } from '@sveltejs/kit';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { children, learningSessions, answerAttempts } from '$lib/server/schema';
import { calculateMetrics } from '$lib/analytics';
export const load = async ({ locals, url }) => {
  if (!locals.user) redirect(303, '/masuk');
  const filters = url.searchParams;
  const validated = z
    .object({
      child: z.union([z.uuid(), z.literal('')]).optional(),
      category: z.enum(['', 'mendengar', 'logika']).optional(),
      level: z.enum(['', '1', '2', '3', '4', '5']).optional(),
      from: z.union([z.iso.date(), z.literal('')]).optional(),
      to: z.union([z.iso.date(), z.literal('')]).optional()
    })
    .safeParse(Object.fromEntries(filters));
  if (!validated.success) error(400, 'Filter laporan tidak valid. Periksa profil dan tanggal.');
  const all = await db
    .select({ session: learningSessions, child: children })
    .from(learningSessions)
    .innerJoin(children, eq(children.id, learningSessions.childId))
    .where(
      and(
        eq(children.userId, locals.user.id),
        filters.get('child') ? eq(children.id, filters.get('child')!) : undefined,
        ['mendengar', 'logika'].includes(filters.get('category')!)
          ? eq(learningSessions.category, filters.get('category')!)
          : undefined,
        /^[1-5]$/.test(filters.get('level') ?? '')
          ? eq(learningSessions.level, Number(filters.get('level')))
          : undefined,
        /^\d{4}-\d{2}-\d{2}$/.test(filters.get('from') ?? '')
          ? gte(learningSessions.startedAt, new Date(`${filters.get('from')}T00:00:00+07:00`))
          : undefined,
        /^\d{4}-\d{2}-\d{2}$/.test(filters.get('to') ?? '')
          ? lte(learningSessions.startedAt, new Date(`${filters.get('to')}T23:59:59+07:00`))
          : undefined
      )
    )
    .orderBy(desc(learningSessions.startedAt));
  const attempts = await db
    .select({ attempt: answerAttempts, session: learningSessions })
    .from(answerAttempts)
    .innerJoin(learningSessions, eq(learningSessions.id, answerAttempts.sessionId))
    .innerJoin(children, eq(children.id, learningSessions.childId))
    .where(eq(children.userId, locals.user.id));
  const sessionIds = new Set(all.map((r) => r.session.id));
  const rows = attempts
    .filter((r) => sessionIds.has(r.session.id))
    .map(({ attempt, session }) => ({
      ...attempt,
      category: session.category,
      level: session.level,
      date: session.startedAt.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })
    }));
  return {
    metrics: calculateMetrics(rows, all.filter((r) => r.session.status === 'completed').length),
    history: all,
    attempts: attempts.filter((r) => sessionIds.has(r.session.id)).map((r) => r.attempt)
  };
};
