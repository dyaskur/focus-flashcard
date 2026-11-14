import { redirect } from '@sveltejs/kit';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { pilotCards, practiceSessions } from '$lib/server/schema';
export const load = async ({ parent }) => {
  const data = await parent();
  if (!data.user) redirect(303, '/masuk');
  if (!data.children.length) redirect(303, '/profil?baru=1');
  const child = data.children.find((c) => c.id === data.activeChildId) ?? data.children[0];
  return {
    cards: (await db.select().from(pilotCards)).map((r) => r.content),
    sessions: (
      await db
        .select()
        .from(practiceSessions)
        .where(
          and(
            eq(practiceSessions.childId, child.id),
            sql`${practiceSessions.state}->>'status' in ('active', 'paused')`
          )
        )
        .orderBy(desc(practiceSessions.startedAt))
        .limit(20)
    ).map((session) => ({ id: session.id, childId: child.id, ...session.state }))
  };
};
