import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { db as Database } from '../src/lib/server/db';
import * as tables from '../src/lib/server/schema';

describe.runIf(!!process.env.TEST_DATABASE_URL)('PostgreSQL learning contract', () => {
  let db: typeof Database;
  let close: () => Promise<void>;
  let learning: typeof import('../src/lib/server/learning');
  let userId: string;
  let otherUserId: string;
  let childId: string;
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    const database = await import('../src/lib/server/db');
    db = database.db;
    close = () => database.sqlClient.end();
    learning = await import('../src/lib/server/learning');
    const [user] = await db
      .insert(tables.users)
      .values({
        name: 'Integration Parent',
        email: `${randomUUID()}@example.test`,
        passwordHash: 'not-used-in-this-test'
      })
      .returning();
    userId = user.id;
    const [other] = await db
      .insert(tables.users)
      .values({
        name: 'Other Parent',
        email: `${randomUUID()}@example.test`,
        passwordHash: 'not-used-in-this-test'
      })
      .returning();
    otherUserId = other.id;
    const [child] = await db.insert(tables.children).values({ userId, name: 'Ammar' }).returning();
    childId = child.id;
  });
  afterAll(async () => {
    if (db) {
      await db.delete(tables.users).where(eq(tables.users.id, userId));
      await db.delete(tables.users).where(eq(tables.users.id, otherUserId));
      await close();
    }
  });
  it('owns CRUD, serializes duplicate attempts, preserves retries, completes sessions, and cascades deletion', async () => {
    await expect(learning.ownChild(otherUserId, childId)).rejects.toMatchObject({ status: 404 });
    const session = await learning.startSession(userId, childId, 'mendengar', 1);
    await expect(learning.sessionDetails(otherUserId, session.id)).rejects.toMatchObject({
      status: 404
    });
    await expect(learning.sessionAction(userId, session.id, 'next')).rejects.toMatchObject({
      status: 409
    });
    const detail = await learning.sessionDetails(userId, session.id);
    expect(detail.questions).toHaveLength(5);
    const q = detail.questions[0];
    const input = {
      eventId: randomUUID(),
      questionId: q.id,
      answerText: q.expectedAnswer,
      verdict: 'incorrect' as const,
      confidence: 0.9,
      feedbackReason: 'testing',
      responseTimeMs: 2345
    };
    const [a, b] = await Promise.all([
      learning.recordAttempt(userId, session.id, input),
      learning.recordAttempt(userId, session.id, input)
    ]);
    expect(a.id).toBe(b.id);
    expect(a.verdict).toBe('correct');
    await learning.sessionAction(userId, session.id, 'next');
    const second = detail.questions[1];
    await learning.sessionAction(userId, session.id, 'pause');
    await expect(
      learning.recordAttempt(userId, session.id, {
        ...input,
        eventId: randomUUID(),
        questionId: second.id
      })
    ).rejects.toMatchObject({ status: 409 });
    await learning.sessionAction(userId, session.id, 'resume');
    await expect(
      learning.recordAttempt(userId, session.id, { ...input, eventId: randomUUID() })
    ).rejects.toMatchObject({ status: 409 });
    const unclear = await learning.recordAttempt(userId, session.id, {
      ...input,
      eventId: randomUUID(),
      questionId: second.id,
      answerText: 'hmm',
      confidence: 0.2
    });
    expect(unclear.verdict).toBe('unclear');
    await expect(learning.sessionAction(userId, session.id, 'hint', q.id)).rejects.toMatchObject({
      status: 409
    });
    expect(
      (await learning.sessionDetails(userId, session.id)).session.hintedQuestionIds
    ).not.toContain(second.id);
    await learning.sessionAction(userId, session.id, 'hint', second.id);
    const retry = await learning.recordAttempt(userId, session.id, {
      ...input,
      eventId: randomUUID(),
      questionId: second.id,
      answerText: second.expectedAnswer
    });
    expect(retry).toMatchObject({ attemptNumber: 2, verdict: 'correct', hintUsed: true });
    await learning.sessionAction(userId, session.id, 'next');
    for (const question of detail.questions.slice(2)) {
      await learning.recordAttempt(userId, session.id, {
        ...input,
        eventId: randomUUID(),
        questionId: question.id,
        answerText: '',
        verdict: 'skipped'
      });
      await learning.sessionAction(userId, session.id, 'next');
    }
    const done = await learning.sessionDetails(userId, session.id);
    expect(done.session).toMatchObject({ status: 'completed', cursor: 5 });
    expect(done.attempts).toHaveLength(6);
    await db.delete(tables.children).where(eq(tables.children.id, childId));
    expect(
      await db
        .select()
        .from(tables.answerAttempts)
        .where(eq(tables.answerAttempts.sessionId, session.id))
    ).toHaveLength(0);
    expect(
      await db
        .select()
        .from(tables.learningSessions)
        .where(eq(tables.learningSessions.id, session.id))
    ).toHaveLength(0);
  });
});
