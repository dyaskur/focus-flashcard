import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { children, answerAttempts } from '$lib/server/schema';
import { requireUser, rateLimit } from '$lib/server/auth';
import {
  ownChild,
  ownSession,
  sessionDetails,
  startSession,
  recordAttempt,
  sessionAction
} from '$lib/server/learning';
import { createLiveToken } from '$lib/server/gemini';

const uuid = z.uuid();
async function parse<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let data;
  try {
    data = await request.json();
  } catch {
    error(400, 'Data permintaan tidak valid.');
  }
  const result = schema.safeParse(data);
  if (!result.success) error(400, 'Periksa data yang dikirim.');
  return result.data;
}
export const GET = async ({ params, locals }) => {
  const user = requireUser(locals);
  const [resource, id] = params.path.split('/');
  if (resource !== 'sessions' || !uuid.safeParse(id).success) error(404);
  return json(await sessionDetails(user.id, id));
};
export const POST = async ({ params, request, locals, cookies, url }) => {
  const user = requireUser(locals);
  const [resource, id, action] = params.path.split('/');
  if (resource === 'preferences') {
    const input = await parse(request, z.object({ uiLanguage: z.enum(['id', 'en']) }));
    cookies.set('uiLanguage', input.uiLanguage, {
      path: '/',
      httpOnly: true,
      secure: url.protocol === 'https:',
      sameSite: 'lax',
      maxAge: 365 * 86400
    });
    return json({ ok: true });
  }
  if (resource === 'children' && uuid.safeParse(id).success) {
    await ownChild(user.id, id);
    const input = await parse(
      request,
      z.object({ sensoryMode: z.boolean().optional(), select: z.boolean().optional() })
    );
    if (input.sensoryMode !== undefined)
      await db
        .update(children)
        .set({ sensoryMode: input.sensoryMode })
        .where(and(eq(children.id, id), eq(children.userId, user.id)));
    if (input.select)
      cookies.set('child', id, {
        path: '/',
        httpOnly: true,
        secure: url.protocol === 'https:',
        sameSite: 'lax',
        maxAge: 30 * 86400
      });
    return json({ ok: true });
  }
  if (resource !== 'sessions') error(404);
  if (!id) {
    await rateLimit(`session:${user.id}`, 30, 3600000);
    const data = await parse(
      request,
      z.object({
        childId: uuid,
        category: z.enum(['mendengar', 'logika']),
        level: z.number().int().min(1).max(5)
      })
    );
    return json(await startSession(user.id, data.childId, data.category, data.level), {
      status: 201
    });
  }
  if (!uuid.safeParse(id).success) error(404);
  if (action === 'token') {
    await rateLimit(`token:${user.id}`, 10, 60000);
    const details = await sessionDetails(user.id, id);
    if (details.session.status !== 'active') error(409, 'Sesi tidak aktif.');
    // This adapter is opt-in, server-side, and impossible in production.
    if (process.env.NODE_ENV !== 'production' && process.env.TEST_GEMINI_ADAPTER === '1')
      return json({ test: true });
    if (!process.env.GEMINI_API_KEY)
      error(503, 'Gemini belum dikonfigurasi. Minta pendamping mengisi GEMINI_API_KEY di server.');
    try {
      return json(await createLiveToken(details.questions));
    } catch {
      error(
        502,
        'Belum bisa terhubung ke Gemini. Periksa koneksi dan konfigurasi API, lalu coba lagi.'
      );
    }
  }
  if (action === 'attempts') {
    const data = await parse(
      request,
      z.object({
        eventId: uuid,
        questionId: z.string().min(1).max(100),
        answerText: z.string().max(2000),
        verdict: z.enum(['correct', 'incorrect', 'unclear', 'skipped']),
        confidence: z.number().min(0).max(1),
        feedbackReason: z.string().max(1000),
        responseTimeMs: z.number().int().min(0).max(600000).nullable()
      })
    );
    return json(await recordAttempt(user.id, id, data));
  }
  if (action === 'action') {
    const data = await parse(
      request,
      z.object({ action: z.enum(['next', 'pause', 'resume', 'stop', 'hint']) })
    );
    return json(await sessionAction(user.id, id, data.action));
  }
  if (action === 'correct') {
    await ownSession(user.id, id);
    const data = await parse(
      request,
      z.object({ attemptId: uuid, verdict: z.enum(['correct', 'incorrect', 'unclear']) })
    );
    const [attempt] = await db
      .select()
      .from(answerAttempts)
      .where(and(eq(answerAttempts.id, data.attemptId), eq(answerAttempts.sessionId, id)));
    if (!attempt) error(404);
    await db
      .update(answerAttempts)
      .set({
        originalVerdict: attempt.originalVerdict ?? attempt.verdict,
        verdict: data.verdict,
        corrected: true
      })
      .where(eq(answerAttempts.id, attempt.id));
    return json({ ok: true });
  }
  error(404);
};
