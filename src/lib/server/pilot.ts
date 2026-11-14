import { error } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { db } from './db';
import { children, pilotCards, practiceSessions } from './schema';
import { ownChild } from './learning';
import { renderTemplate } from '../personalize';
import { evaluateAnswer } from '../evaluation';
import type { Category, ChildProfile, Verdict } from '../types';
import type { Language, PilotCard, PracticeMode, PracticeSession } from '../pilot/types';
import { questionDone } from '../pilot/types';
import { attemptsFor, currentCard, currentQuestion, finishedCard } from '../pilot/session';

export interface Selection {
  childId: string;
  category: Category;
  level: number;
  language: Language;
  mode: PracticeMode;
  count: number;
  selection: 'new' | 'random';
  replayCardId?: string;
}
export async function history(userId: string, childId?: string) {
  return db
    .select({ session: practiceSessions, child: children })
    .from(practiceSessions)
    .innerJoin(children, eq(children.id, practiceSessions.childId))
    .where(and(eq(children.userId, userId), childId ? eq(children.id, childId) : undefined))
    .orderBy(desc(practiceSessions.startedAt));
}
export async function practiceDetails(userId: string, id: string): Promise<PracticeSession> {
  const [row] = await db
    .select({ session: practiceSessions })
    .from(practiceSessions)
    .innerJoin(children, eq(children.id, practiceSessions.childId))
    .where(and(eq(practiceSessions.id, id), eq(children.userId, userId)));
  if (!row) error(404, 'Sesi tidak ditemukan / Session not found.');
  return { id: row.session.id, childId: row.session.childId, ...row.session.state };
}
export function selectCards(
  cards: PilotCard[],
  sessions: PracticeSession[],
  input: Selection,
  random = Math.random
) {
  const shuffled = cards
    .filter(
      (c) =>
        c.category === input.category &&
        c.level === input.level &&
        (!input.replayCardId || c.id === input.replayCardId)
    )
    .map((card) => ({ card, random: random() }))
    .sort((a, b) => a.random - b.random)
    .map((r) => r.card);
  if (input.count > shuffled.length)
    error(400, 'Jumlah melebihi kartu tersedia / Not enough cards.');
  const last = new Map<string, string>();
  for (const session of sessions.filter((s) => s.language === input.language)) {
    for (const card of session.cards)
      if (finishedCard(session, card.id)) {
        const date =
          session.attempts.filter((a) => a.cardId === card.id).at(-1)?.createdAt ??
          session.startedAt;
        if (!last.has(card.id) || date > last.get(card.id)!) last.set(card.id, date);
      }
  }
  const selected =
    input.selection === 'random'
      ? shuffled.slice(0, input.count)
      : [
          ...shuffled.filter((c) => !last.has(c.id)),
          ...shuffled
            .filter((c) => last.has(c.id))
            .sort((a, b) => last.get(a.id)!.localeCompare(last.get(b.id)!))
        ].slice(0, input.count);
  return { selected, oldCount: selected.filter((c) => last.has(c.id)).length };
}
export async function preview(userId: string, input: Selection) {
  const child = await ownChild(userId, input.childId);
  const rows = await db.select().from(pilotCards);
  const previous = (await history(userId, child.id)).map(({ session }) => ({
    id: session.id,
    childId: child.id,
    ...session.state
  }));
  const { selected, oldCount } = selectCards(
    rows.map((r) => r.content),
    previous,
    input
  );
  return {
    selected,
    oldCount,
    questionCount: selected.reduce(
      (sum, c) => sum + c.versions[input.language].questions.length,
      0
    ),
    child
  };
}
function personalizeCard(card: PilotCard, language: Language, profile: ChildProfile) {
  const render = (s: string) => renderTemplate(s, profile);
  const version = card.versions[language];
  return {
    id: card.id,
    category: card.category,
    level: card.level,
    language,
    title: render(version.title),
    story: render(version.story),
    questions: version.questions.map((q) => ({
      ...q,
      prompt: render(q.prompt),
      expectedAnswer: render(q.expectedAnswer),
      alternatives: q.alternatives.map(render),
      secondHint: render(q.secondHint),
      explanation: render(q.explanation),
      hint: { ...q.hint, title: render(q.hint.title), description: render(q.hint.description) }
    }))
  };
}
export async function createPractice(userId: string, input: Selection, confirmed: boolean) {
  const { selected, oldCount, child } = await preview(userId, input);
  if (input.selection === 'new' && oldCount && !confirmed)
    error(409, 'Konfirmasi kartu lama / Confirm previously practiced cards.');
  const [row] = await db
    .insert(practiceSessions)
    .values({
      childId: child.id,
      state: {
        language: input.language,
        mode: input.mode,
        category: input.category,
        level: input.level,
        cards: selected.map((c) => personalizeCard(c, input.language, child)),
        cardIndex: 0,
        questionIndex: 0,
        attempts: [],
        events: [],
        status: 'active',
        startedAt: new Date().toISOString(),
        finishedAt: null
      }
    })
    .returning();
  return { id: row.id, childId: row.childId, ...row.state };
}
export type PracticeCommand = {
  action:
    | 'answer'
    | 'next'
    | 'hint'
    | 'visual'
    | 'caregiver'
    | 'repeat'
    | 'pause'
    | 'resume'
    | 'stop'
    | 'mode'
    | 'correct'
    | 'skip';
  eventId: string;
  cardId: string;
  questionId: string;
  mode?: PracticeMode;
  verdict?: Verdict;
  answerText?: string;
  confidence?: number;
  responseTimeMs?: number | null;
  answerLanguage?: Language | 'mixed' | null;
  attemptId?: string;
  enabled?: boolean;
};
export async function updatePractice(userId: string, id: string, input: PracticeCommand) {
  await practiceDetails(userId, id);
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(practiceSessions)
      .where(eq(practiceSessions.id, id))
      .for('update');
    if (!row) error(404);
    const session: PracticeSession = { id: row.id, childId: row.childId, ...row.state };
    if (
      session.commandIds?.includes(input.eventId) ||
      session.attempts.some((a) => a.eventId === input.eventId) ||
      session.events.some((e) => e.id === input.eventId)
    )
      return session;
    const card = currentCard(session);
    const question = currentQuestion(session);
    const targeted = session.cards
      .find((c) => c.id === input.cardId)
      ?.questions.find((q) => q.id === input.questionId);
    if (!targeted) error(400, 'Pertanyaan tidak valid / Invalid question.');
    const retrospective = ['correct', 'caregiver', 'visual'].includes(input.action);
    if (!retrospective && (card?.id !== input.cardId || question?.id !== input.questionId))
      error(409, 'Pertanyaan sudah berganti / Question changed.');
    if (['completed', 'stopped'].includes(session.status) && !retrospective)
      error(409, 'Sesi tidak aktif / Session inactive.');
    const now = new Date().toISOString();
    const event = (type: (typeof session.events)[number]['type']) =>
      session.events.push({
        id: input.eventId,
        type,
        cardId: input.cardId,
        questionId: input.questionId,
        createdAt: now
      });
    const attempts = attemptsFor(session, input.cardId, input.questionId);
    if (input.action === 'answer' || input.action === 'skip') {
      if (session.status !== 'active' || questionDone(attempts) || input.mode !== session.mode)
        error(409, 'Giliran tidak aktif / Turn inactive.');
      if (input.action === 'answer' && !input.verdict) error(400);
      const verdict =
        input.action === 'skip'
          ? 'skipped'
          : session.mode === 'manual'
            ? input.verdict!
            : evaluateAnswer(
                { ...question, story: card.story, category: card.category, level: card.level },
                {
                  questionId: question.id,
                  answerText: input.answerText ?? '',
                  verdict: input.verdict as 'correct' | 'incorrect' | 'unclear',
                  confidence: input.confidence ?? 0,
                  feedbackReason: ''
                }
              );
      session.attempts.push({
        id: crypto.randomUUID(),
        eventId: input.eventId,
        cardId: card.id,
        questionId: question.id,
        mode: session.mode,
        verdict,
        originalVerdict: null,
        responseTimeMs: session.mode === 'ai' ? (input.responseTimeMs ?? null) : null,
        answerLanguage:
          session.mode === 'ai' && (input.confidence ?? 0) >= 0.65
            ? (input.answerLanguage ?? null)
            : null,
        createdAt: now
      });
      if (verdict === 'incorrect' && attempts.filter((a) => a.verdict === 'incorrect').length < 2)
        event('hint');
      const updated = [...attempts, session.attempts.at(-1)!];
      if (
        verdict === 'unclear' &&
        updated.slice(-2).length === 2 &&
        updated.slice(-2).every((a) => a.verdict === 'unclear')
      ) {
        session.status = 'paused';
        event('pause');
      }
    } else if (input.action === 'next') {
      if (session.status !== 'active' || !questionDone(attempts))
        error(409, 'Selesaikan pertanyaan dulu / Finish the question first.');
      (session.resolvedQuestionIds ??= []).push(question.id);
      if (++session.questionIndex === card.questions.length) {
        session.cardIndex++;
        session.questionIndex = 0;
      }
      if (session.cardIndex === session.cards.length) {
        session.status = 'completed';
        session.finishedAt = now;
      }
    } else if (input.action === 'correct') {
      const attempt = attempts.find((a) => a.id === input.attemptId);
      if (!attempt || !input.verdict || input.verdict === 'skipped') error(400);
      (attempt.corrections ??= []).push({
        from: attempt.verdict,
        to: input.verdict,
        createdAt: now
      });
      attempt.originalVerdict ??= attempt.verdict;
      attempt.verdict = input.verdict;
      attempt.correctedAt = now;
    } else if (input.action === 'stop') {
      session.status = 'stopped';
      session.finishedAt = now;
    } else if (input.action === 'pause') {
      session.status = 'paused';
      event('pause');
    } else if (input.action === 'resume') {
      session.status = 'active';
      event('resume');
    } else if (input.action === 'mode') {
      if (!input.mode) error(400);
      session.mode = input.mode;
      event('mode');
    } else {
      if (['hint', 'repeat'].includes(input.action) && session.status !== 'active')
        error(409, 'Sesi dijeda / Session paused.');
      if (input.enabled === false)
        session.events = session.events.filter(
          (e) =>
            !(
              e.type === input.action &&
              e.cardId === input.cardId &&
              e.questionId === input.questionId
            )
        );
      else event(input.action as 'hint' | 'visual' | 'caregiver' | 'repeat');
    }
    (session.commandIds ??= []).push(input.eventId);
    const { id: _id, childId: _childId, ...state } = session;
    void _id;
    void _childId;
    await tx.update(practiceSessions).set({ state }).where(eq(practiceSessions.id, id));
    return session;
  });
}
