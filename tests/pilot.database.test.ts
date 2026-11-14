import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { db as Database } from '../src/lib/server/db';
import * as tables from '../src/lib/server/schema';
import { pilotCards } from '../src/lib/pilot/cards';
import { finishedCard, assistanceFor } from '../src/lib/pilot/session';
import type { PracticeSession } from '../src/lib/pilot/types';

describe.runIf(!!process.env.TEST_DATABASE_URL)('Pilot persistence contract', () => {
  let db: typeof Database;
  let close: () => Promise<void>;
  let pilot: typeof import('../src/lib/server/pilot');
  let userId: string, childId: string, otherUserId: string;
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    const database = await import('../src/lib/server/db');
    db = database.db;
    close = () => database.sqlClient.end();
    pilot = await import('../src/lib/server/pilot');
    const [user, other] = await db
      .insert(tables.users)
      .values(
        ['Parent', 'Other'].map((name) => ({
          name,
          email: `${randomUUID()}@example.test`,
          passwordHash: 'not-a-login-hash'
        }))
      )
      .returning();
    userId = user.id;
    otherUserId = other.id;
    const [child] = await db
      .insert(tables.children)
      .values({ userId, name: 'Ammar', parentName: 'Abi' })
      .returning();
    childId = child.id;
  });
  afterAll(async () => {
    if (!db) return;
    await db.delete(tables.users).where(eq(tables.users.id, userId));
    await db.delete(tables.users).where(eq(tables.users.id, otherUserId));
    await close();
  });
  it('keeps unclear separate, limits attempts, serializes retries, resumes and switches modes, preserves correction audit and old history', async () => {
    const selection = {
      childId,
      category: 'mendengar' as const,
      level: 1,
      language: 'en' as const,
      mode: 'manual' as const,
      count: 1,
      selection: 'new' as const
    };
    let session = await pilot.createPractice(userId, selection, false);
    expect(session.cards).toHaveLength(1);
    expect(session.cards[0].questions).toHaveLength(2);
    expect(JSON.stringify(session)).not.toMatch(/\[Nama/);
    await expect(pilot.practiceDetails(otherUserId, session.id)).rejects.toMatchObject({
      status: 404
    });
    await expect(
      pilot.updatePractice(otherUserId, session.id, {
        action: 'pause',
        eventId: randomUUID(),
        cardId: session.cards[0].id,
        questionId: session.cards[0].questions[0].id
      })
    ).rejects.toMatchObject({ status: 404 });
    const act = async (
      action: Parameters<typeof pilot.updatePractice>[2]['action'],
      extra = {}
    ) => {
      const card = session.cards[session.cardIndex];
      const question = card.questions[session.questionIndex];
      session = await pilot.updatePractice(userId, session.id, {
        action,
        eventId: randomUUID(),
        cardId: card.id,
        questionId: question.id,
        mode: session.mode,
        ...extra
      });
      return session;
    };
    await expect(act('next')).rejects.toMatchObject({ status: 409 });
    await act('answer', { verdict: 'unclear' });
    await act('answer', { verdict: 'unclear' });
    expect(session.status).toBe('paused');
    expect(session.events.filter((e) => e.type === 'hint')).toHaveLength(0);
    await expect(act('answer', { verdict: 'incorrect' })).rejects.toMatchObject({ status: 409 });
    await act('resume');
    for (let n = 0; n < 3; n++) await act('answer', { verdict: 'incorrect' });
    expect(session.attempts).toHaveLength(5);
    expect(session.events.filter((e) => e.type === 'hint')).toHaveLength(2);
    await expect(act('answer', { verdict: 'correct' })).rejects.toMatchObject({ status: 409 });
    const firstQuestionId = session.cards[0].questions[0].id;
    await act('next');
    expect(session.questionIndex).toBe(1);
    await expect(act('hint', { questionId: firstQuestionId })).rejects.toMatchObject({
      status: 409
    });
    await act('mode', { mode: 'ai' });
    await act('pause');
    const paused = await pilot.practiceDetails(userId, session.id);
    expect(paused.status).toBe('paused');
    expect(paused.attempts).toHaveLength(5);
    await act('resume');
    const card = session.cards[0],
      question = card.questions[1];
    const answer = {
      action: 'answer' as const,
      eventId: randomUUID(),
      cardId: card.id,
      questionId: question.id,
      mode: 'ai' as const,
      verdict: 'incorrect' as const,
      answerText: question.alternatives[0],
      confidence: 0.95,
      responseTimeMs: 1357,
      answerLanguage: 'id' as const
    };
    const [a, b] = await Promise.all([
      pilot.updatePractice(userId, session.id, answer),
      pilot.updatePractice(userId, session.id, answer)
    ]);
    expect(a.attempts.at(-1)?.id).toBe(b.attempts.at(-1)?.id);
    session = a;
    expect(session.attempts.at(-1)).toMatchObject({
      verdict: 'correct',
      mode: 'ai',
      responseTimeMs: 1357,
      answerLanguage: 'id'
    });
    expect(
      session.attempts.slice(0, 5).every((a) => a.mode === 'manual' && a.responseTimeMs === null)
    ).toBe(true);
    expect(finishedCard(session, card.id)).toBe(true);
    await act('next');
    expect(session.status).toBe('completed');
    expect(JSON.stringify(session)).not.toContain('answerText');
    const finalAttempt = session.attempts.at(-1)!;
    const correction = {
      action: 'correct' as const,
      eventId: randomUUID(),
      cardId: card.id,
      questionId: question.id,
      attemptId: finalAttempt.id,
      verdict: 'incorrect' as const
    };
    session = await pilot.updatePractice(userId, session.id, correction);
    session = await pilot.updatePractice(userId, session.id, correction);
    expect(session.attempts.at(-1)).toMatchObject({
      originalVerdict: 'correct',
      verdict: 'incorrect',
      corrections: [{ from: 'correct', to: 'incorrect', createdAt: expect.any(String) }]
    });
    expect(session.status).toBe('completed');
    expect(finishedCard(session, card.id)).toBe(true);
    session = await pilot.updatePractice(userId, session.id, {
      action: 'caregiver',
      eventId: randomUUID(),
      cardId: card.id,
      questionId: question.id
    });
    expect(assistanceFor(session, finalAttempt).some((e) => e.type === 'caregiver')).toBe(true);
    const replay = await pilot.createPractice(
      userId,
      { ...selection, selection: 'random', replayCardId: card.id },
      true
    );
    expect(replay.id).not.toBe(session.id);
    expect(replay.attempts).toEqual([]);
    expect((await pilot.practiceDetails(userId, session.id)).attempts).toHaveLength(6);
    expect(await db.select().from(tables.questions)).toHaveLength(200);
  });
  it('selects unseen per language, includes partial cards, fills oldest first, and leaves random independent of results', async () => {
    const cards = pilotCards.filter((c) => c.category === 'mendengar' && c.level === 1);
    const selection = {
      childId,
      category: 'mendengar' as const,
      level: 1,
      language: 'id' as const,
      mode: 'manual' as const,
      count: 3,
      selection: 'new' as const
    };
    function past(
      index: number,
      date: string,
      language: 'id' | 'en' = 'id',
      partial = false
    ): PracticeSession {
      const card = cards[index];
      return {
        id: randomUUID(),
        childId,
        category: card.category,
        level: 1,
        language,
        mode: 'manual',
        cards: [
          { ...card.versions[language], id: card.id, language, category: card.category, level: 1 }
        ],
        cardIndex: 0,
        questionIndex: 0,
        status: 'stopped',
        events: [],
        startedAt: date,
        finishedAt: date,
        attempts: card.versions[language].questions.slice(0, partial ? 1 : undefined).map((q) => ({
          id: randomUUID(),
          eventId: randomUUID(),
          cardId: card.id,
          questionId: q.id,
          mode: 'manual',
          verdict: 'skipped',
          originalVerdict: null,
          responseTimeMs: null,
          answerLanguage: null,
          createdAt: date
        }))
      };
    }
    const sessions = [
      past(0, '2026-11-01T00:00:00.000Z'),
      past(1, '2026-10-01T00:00:00.000Z'),
      past(2, '2026-09-01T00:00:00.000Z'),
      past(3, '2026-08-01T00:00:00.000Z', 'en'),
      past(4, '2026-07-01T00:00:00.000Z', 'id', true)
    ];
    const selected = pilot.selectCards(cards, sessions, selection, () => 0.5);
    expect(selected.selected.map((c) => c.id)).toEqual([cards[3].id, cards[4].id, cards[2].id]);
    expect(selected.oldCount).toBe(1);
    const random = pilot.selectCards(
      cards,
      sessions,
      { ...selection, selection: 'random' },
      () => 0.5
    );
    expect(random.selected.map((c) => c.id)).toEqual(cards.slice(0, 3).map((c) => c.id));
    expect(
      pilot.selectCards(cards, sessions, { ...selection, language: 'en' }, () => 0.5).oldCount
    ).toBe(0);
  });
});
