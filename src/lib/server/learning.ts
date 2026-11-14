import { error } from '@sveltejs/kit';
import { and, eq, inArray, desc, sql } from 'drizzle-orm';
import { db } from './db';
import { children, learningSessions, questions, answerAttempts } from './schema';
import { personalize } from '../personalize';
import { evaluateAnswer } from '../evaluation';
import type { AnswerEvent, Category, Question } from '../types';

export async function ownChild(userId: string, childId: string) {
  const [child] = await db
    .select()
    .from(children)
    .where(and(eq(children.id, childId), eq(children.userId, userId)));
  if (!child) error(404, 'Profil tidak ditemukan.');
  return child;
}
export async function ownSession(userId: string, id: string) {
  const [result] = await db
    .select({ session: learningSessions, child: children })
    .from(learningSessions)
    .innerJoin(children, eq(children.id, learningSessions.childId))
    .where(and(eq(learningSessions.id, id), eq(children.userId, userId)));
  if (!result) error(404, 'Sesi tidak ditemukan.');
  return result;
}
export async function sessionDetails(userId: string, id: string) {
  const { session, child } = await ownSession(userId, id);
  const rows = await db.select().from(questions).where(inArray(questions.id, session.questionIds));
  return {
    session,
    child,
    questions: session.questionIds.map((id) =>
      personalize(rows.find((q) => q.id === id) as Question, child)
    ),
    attempts: await db
      .select()
      .from(answerAttempts)
      .where(eq(answerAttempts.sessionId, id))
      .orderBy(answerAttempts.createdAt)
  };
}
export async function startSession(
  userId: string,
  childId: string,
  category: Category,
  level: number
) {
  await ownChild(userId, childId);
  const selected = await db
    .select({ id: questions.id })
    .from(questions)
    .where(and(eq(questions.category, category), eq(questions.level, level)))
    .orderBy(sql`random()`)
    .limit(5);
  if (selected.length < 5)
    error(503, 'Soal belum tersedia. Jalankan seed database terlebih dahulu.');
  const [session] = await db
    .insert(learningSessions)
    .values({ childId, category, level, questionIds: selected.map((q) => q.id) })
    .returning();
  await db.update(children).set({ lastLevel: level }).where(eq(children.id, childId));
  return session;
}
export async function recordAttempt(
  userId: string,
  sessionId: string,
  input: {
    eventId: string;
    questionId: string;
    answerText: string;
    verdict: AnswerEvent['verdict'] | 'skipped';
    confidence: number;
    feedbackReason: string;
    responseTimeMs: number | null;
  }
) {
  await ownSession(userId, sessionId);
  return db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(learningSessions)
      .where(eq(learningSessions.id, sessionId))
      .for('update');
    const [duplicate] = await tx
      .select()
      .from(answerAttempts)
      .where(
        and(eq(answerAttempts.sessionId, sessionId), eq(answerAttempts.eventId, input.eventId))
      );
    if (duplicate) return duplicate;
    if (session.status !== 'active' || session.questionIds[session.cursor] !== input.questionId)
      error(409, 'Jawaban ini bukan untuk soal yang sedang aktif.');
    const previous = await tx
      .select()
      .from(answerAttempts)
      .where(
        and(
          eq(answerAttempts.sessionId, sessionId),
          eq(answerAttempts.questionId, input.questionId)
        )
      )
      .orderBy(desc(answerAttempts.attemptNumber));
    if (previous.some((a) => a.verdict === 'correct' || a.verdict === 'skipped'))
      error(409, 'Soal ini sudah selesai.');
    const [child] = await tx.select().from(children).where(eq(children.id, session.childId));
    const [row] = await tx.select().from(questions).where(eq(questions.id, input.questionId));
    const verdict =
      input.verdict === 'skipped'
        ? 'skipped'
        : evaluateAnswer(personalize(row as Question, child), input as AnswerEvent);
    const [attempt] = await tx
      .insert(answerAttempts)
      .values({
        sessionId,
        eventId: input.eventId,
        questionId: input.questionId,
        verdict,
        attemptNumber: previous.length + 1,
        responseTimeMs: input.responseTimeMs,
        hintUsed: verdict === 'incorrect' || session.hintedQuestionIds.includes(input.questionId)
      })
      .returning();
    if (verdict === 'incorrect' && !session.hintedQuestionIds.includes(input.questionId))
      await tx
        .update(learningSessions)
        .set({ hintedQuestionIds: [...session.hintedQuestionIds, input.questionId] })
        .where(eq(learningSessions.id, sessionId));
    return attempt;
  });
}
export async function sessionAction(
  userId: string,
  sessionId: string,
  action: 'next' | 'pause' | 'resume' | 'stop' | 'hint'
) {
  await ownSession(userId, sessionId);
  return db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(learningSessions)
      .where(eq(learningSessions.id, sessionId))
      .for('update');
    if (['completed', 'stopped'].includes(session.status)) return session;
    let update: Partial<typeof learningSessions.$inferInsert>;
    if (action === 'next') {
      if (session.status !== 'active') error(409, 'Sesi sedang dijeda.');
      const [done] = await tx
        .select()
        .from(answerAttempts)
        .where(
          and(
            eq(answerAttempts.sessionId, sessionId),
            eq(answerAttempts.questionId, session.questionIds[session.cursor]),
            inArray(answerAttempts.verdict, ['correct', 'skipped'])
          )
        )
        .limit(1);
      if (!done) error(409, 'Jawab atau lewati soal terlebih dahulu.');
      const cursor = session.cursor + 1;
      update = {
        cursor,
        ...(cursor === session.questionIds.length
          ? { status: 'completed', finishedAt: new Date() }
          : {})
      };
    } else if (action === 'hint')
      update = {
        hintedQuestionIds: [
          ...new Set([...session.hintedQuestionIds, session.questionIds[session.cursor]])
        ]
      };
    else if (action === 'stop') update = { status: 'stopped', finishedAt: new Date() };
    else update = { status: action === 'pause' ? 'paused' : 'active' };
    const [saved] = await tx
      .update(learningSessions)
      .set(update)
      .where(eq(learningSessions.id, sessionId))
      .returning();
    return saved;
  });
}
