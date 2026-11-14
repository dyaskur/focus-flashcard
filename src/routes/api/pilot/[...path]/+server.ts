import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireUser, rateLimit } from '$lib/server/auth';
import { createPractice, preview, practiceDetails, updatePractice } from '$lib/server/pilot';
import { createLiveToken } from '$lib/server/gemini';

const selection = z.object({
  childId: z.uuid(),
  category: z.enum(['mendengar', 'logika']),
  level: z.number().int().min(1).max(2),
  language: z.enum(['id', 'en']),
  mode: z.enum(['ai', 'manual']),
  count: z.number().int().min(1).max(5),
  selection: z.enum(['new', 'random']),
  replayCardId: z.string().min(1).max(100).optional(),
  confirmed: z.boolean().default(false)
});
const command = z.object({
  action: z.enum([
    'answer',
    'next',
    'hint',
    'visual',
    'caregiver',
    'repeat',
    'pause',
    'resume',
    'stop',
    'mode',
    'correct',
    'skip'
  ]),
  eventId: z.uuid(),
  cardId: z.string().min(1).max(100),
  questionId: z.string().min(1).max(100),
  mode: z.enum(['ai', 'manual']).optional(),
  verdict: z.enum(['correct', 'incorrect', 'unclear']).optional(),
  answerText: z.string().max(2000).optional(),
  confidence: z.number().min(0).max(1).optional(),
  responseTimeMs: z.number().int().min(0).max(600000).nullable().optional(),
  answerLanguage: z.enum(['id', 'en', 'mixed']).nullable().optional(),
  attemptId: z.uuid().optional(),
  enabled: z.boolean().optional()
});
async function parse<T>(request: Request, schema: z.ZodType<T>) {
  const value = await request.json().catch(() => error(400, 'Invalid JSON.'));
  const parsed = schema.safeParse(value);
  if (!parsed.success) error(400, 'Periksa data / Check your input.');
  return parsed.data;
}
export const GET = async ({ params, locals }) => {
  const user = requireUser(locals);
  if (!z.uuid().safeParse(params.path).success) error(404);
  return json(await practiceDetails(user.id, params.path));
};
export const POST = async ({ params, request, locals }) => {
  const user = requireUser(locals);
  if (params.path === 'preview' || params.path === 'sessions') {
    const input = await parse(request, selection);
    if (params.path === 'preview') {
      const result = await preview(user.id, input);
      return json({
        oldCount: result.oldCount,
        questionCount: result.questionCount,
        count: result.selected.length
      });
    }
    await rateLimit(`session:${user.id}`, 30, 3600000);
    return json(await createPractice(user.id, input, input.confirmed), { status: 201 });
  }
  const [id, action] = params.path.split('/');
  if (!z.uuid().safeParse(id).success) error(404);
  if (action === 'action')
    return json(await updatePractice(user.id, id, await parse(request, command)));
  if (action !== 'token') error(404);
  await rateLimit(`token:${user.id}`, 10, 60000);
  const session = await practiceDetails(user.id, id);
  if (session.status !== 'active' || session.mode !== 'ai') error(409, 'Session inactive.');
  if (process.env.NODE_ENV !== 'production' && process.env.TEST_GEMINI_ADAPTER === '1')
    return json({ test: true });
  if (!process.env.GEMINI_API_KEY)
    error(503, 'Gemini belum dikonfigurasi / Gemini is not configured.');
  const questions = session.cards.flatMap((card) =>
    card.questions.map((question) => ({
      ...question,
      story: card.story,
      category: card.category,
      level: card.level
    }))
  );
  try {
    return json(await createLiveToken(questions, { language: session.language, pilot: true }));
  } catch {
    error(502, 'Tidak bisa terhubung ke Gemini / Cannot connect to Gemini.');
  }
};
