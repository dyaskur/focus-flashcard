import type { Category, Question, Verdict } from '../types';

export type Language = 'id' | 'en';
export type PracticeMode = 'ai' | 'manual';
export type Skill = 'who' | 'what' | 'where' | 'when' | 'sequence' | 'cause';
export interface CardQuestion {
  id: string;
  prompt: string;
  expectedAnswer: string;
  alternatives: string[];
  skill: Skill;
  hint: Question['hint'];
  secondHint: string;
  explanation: string;
}
export interface CardVersion {
  title: string;
  story: string;
  questions: CardQuestion[];
}
export interface PilotCard {
  id: string;
  category: Category;
  level: 1 | 2;
  versions: Record<Language, CardVersion>;
}
export interface PracticeCard extends CardVersion {
  id: string;
  category: Category;
  level: number;
  language: Language;
  completedAt?: string;
}
export interface PracticeAttempt {
  id: string;
  eventId: string;
  cardId: string;
  questionId: string;
  mode: PracticeMode;
  verdict: Verdict;
  originalVerdict: Verdict | null;
  responseTimeMs: number | null;
  answerLanguage: Language | 'mixed' | null;
  createdAt: string;
  correctedAt?: string;
  corrections?: { from: Verdict; to: Verdict; createdAt: string }[];
}
export interface PracticeEvent {
  id: string;
  type: 'repeat' | 'hint' | 'visual' | 'caregiver' | 'mode' | 'pause' | 'resume';
  cardId: string;
  questionId: string;
  createdAt: string;
}
export interface PracticeSession {
  id: string;
  childId: string;
  language: Language;
  mode: PracticeMode;
  category: Category;
  level: number;
  cards: PracticeCard[];
  cardIndex: number;
  questionIndex: number;
  status: 'active' | 'paused' | 'stopped' | 'completed';
  attempts: PracticeAttempt[];
  events: PracticeEvent[];
  startedAt: string;
  finishedAt: string | null;
  resolvedQuestionIds?: string[];
  commandIds?: string[];
}

export function questionAttempts(session: PracticeSession) {
  const card = session.cards[session.cardIndex];
  const question = card?.questions[session.questionIndex];
  return session.attempts.filter((a) => a.cardId === card?.id && a.questionId === question?.id);
}
export function questionDone(attempts: PracticeAttempt[]) {
  return (
    attempts.some((a) => a.verdict === 'correct' || a.verdict === 'skipped') ||
    attempts.filter((a) => a.verdict === 'incorrect').length >= 3
  );
}
