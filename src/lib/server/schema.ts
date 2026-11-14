import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  index,
  unique,
  check
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { Question } from '../types';
import type { PilotCard, PracticeSession } from '../pilot/types';

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  name: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull()
});
export const authSessions = pgTable(
  'auth_sessions',
  {
    tokenHash: text().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp({ withTimezone: true }).notNull()
  },
  (t) => [index('auth_user_idx').on(t.userId)]
);
export const children = pgTable(
  'child_profiles',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    parentName: text().notNull().default('Bunda'),
    friendName: text().notNull().default('Lala'),
    petName: text().notNull().default('Milo'),
    age: integer(),
    lastLevel: integer().notNull().default(1),
    sensoryMode: boolean().notNull().default(false)
  },
  (t) => [
    index('child_owner_idx').on(t.userId),
    check('child_level_range', sql`${t.lastLevel} between 1 and 5`),
    check('child_age_range', sql`${t.age} between 1 and 18`)
  ]
);
export const categories = pgTable('categories', {
  id: text().primaryKey(),
  name: text().notNull(),
  color: text().notNull()
});
export const questions = pgTable(
  'questions',
  {
    id: text().primaryKey(),
    category: text()
      .notNull()
      .references(() => categories.id),
    level: integer().notNull(),
    story: text().notNull(),
    prompt: text().notNull(),
    expectedAnswer: text().notNull(),
    alternatives: jsonb().$type<string[]>().notNull(),
    hint: jsonb().$type<Question['hint']>().notNull()
  },
  (t) => [
    index('question_category_level_idx').on(t.category, t.level),
    check('question_level_range', sql`${t.level} between 1 and 5`)
  ]
);
export const learningSessions = pgTable(
  'learning_sessions',
  {
    id: uuid().primaryKey().defaultRandom(),
    childId: uuid()
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    category: text()
      .notNull()
      .references(() => categories.id),
    level: integer().notNull(),
    status: text({ enum: ['active', 'paused', 'completed', 'stopped'] })
      .notNull()
      .default('active'),
    questionIds: jsonb().$type<string[]>().notNull(),
    cursor: integer().notNull().default(0),
    hintedQuestionIds: jsonb().$type<string[]>().notNull().default([]),
    startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp({ withTimezone: true })
  },
  (t) => [
    index('session_child_date_idx').on(t.childId, t.startedAt),
    check('session_level_range', sql`${t.level} between 1 and 5`)
  ]
);
export const answerAttempts = pgTable(
  'answer_attempts',
  {
    id: uuid().primaryKey().defaultRandom(),
    eventId: uuid().notNull(),
    sessionId: uuid()
      .notNull()
      .references(() => learningSessions.id, { onDelete: 'cascade' }),
    questionId: text()
      .notNull()
      .references(() => questions.id),
    attemptNumber: integer().notNull(),
    verdict: text({ enum: ['correct', 'incorrect', 'unclear', 'skipped'] }).notNull(),
    originalVerdict: text(),
    corrected: boolean().notNull().default(false),
    responseTimeMs: integer(),
    hintUsed: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    unique('attempt_event_unique').on(t.sessionId, t.eventId),
    unique('attempt_number_unique').on(t.sessionId, t.questionId, t.attemptNumber),
    index('attempt_session_idx').on(t.sessionId),
    check('response_time_nonnegative', sql`${t.responseTimeMs} >= 0`)
  ]
);
export const rateLimits = pgTable('rate_limits', {
  key: text().primaryKey(),
  count: integer().notNull(),
  resetAt: timestamp({ withTimezone: true }).notNull()
});

// Legacy questions/sessions remain intact; pilot sessions keep the card version used in practice.
// ponytail: one JSON snapshot under a row lock suits 1–5 pilot cards; normalize attempts if reporting volume grows.
export const pilotCards = pgTable('pilot_cards', {
  id: text().primaryKey(),
  content: jsonb().$type<PilotCard>().notNull()
});
export const practiceSessions = pgTable(
  'practice_sessions',
  {
    id: uuid().primaryKey().defaultRandom(),
    childId: uuid()
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    state: jsonb().$type<Omit<PracticeSession, 'id' | 'childId'>>().notNull(),
    startedAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('practice_child_date_idx').on(t.childId, t.startedAt)]
);
