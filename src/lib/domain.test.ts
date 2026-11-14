import { describe, it, expect, vi } from 'vitest';
import { get } from 'svelte/store';
import { renderTemplate, personalize } from './personalize';
import { evaluateAnswer, normalizeAnswer } from './evaluation';
import { calculateMetrics, type MetricAttempt } from './analytics';
import { createLearningStores } from './stores';
import { SilenceTimer, transition } from './session-state';
import type { Question, AnswerEvent } from './types';
const question: Question = {
  id: 'test',
  category: 'logika',
  level: 1,
  story: '[NamaAnak] pergi dengan [NamaOrtu] saat hujan.',
  prompt: 'Apa yang dibawa [NamaAnak]?',
  expectedAnswer: 'Payung',
  alternatives: ['Membawa payung', 'Jas hujan'],
  hint: { emoji: '🌧️', title: 'Hujan', description: 'Pikirkan cara agar tetap kering.' }
};
const event: AnswerEvent = {
  questionId: 'test',
  answerText: 'JAS HUJAN!',
  verdict: 'incorrect',
  confidence: 0.9,
  feedbackReason: 'Test'
};
describe('personalization and assessment contracts', () => {
  it('personalizes every field with literal replacement and natural fallbacks', () => {
    expect(
      renderTemplate('[NamaAnak] [NamaOrtu] [NamaTeman] [HewanPeliharaan]', {
        name: '$&',
        parentName: '  '
      })
    ).toBe('$& Bunda Lala Milo');
    expect(personalize(question, { name: 'Ammar' }).story).toBe(
      'Ammar pergi dengan Bunda saat hujan.'
    );
    const first = createLearningStores();
    const second = createLearningStores();
    first.question.set(question);
    first.profile.set({
      id: '1',
      name: 'Ammar',
      parentName: '',
      friendName: '',
      petName: '',
      age: null,
      lastLevel: 1,
      sensoryMode: false
    });
    expect(get(first.personalizedQuestion)?.prompt).toBe('Apa yang dibawa Ammar?');
    expect(get(second.profile)).toBeNull();
  });
  it('accepts known alternatives but never accepts a negated substring', () => {
    expect(normalizeAnswer('  JAS, hujan! ')).toBe('jas hujan');
    expect(evaluateAnswer(question, event)).toBe('correct');
    expect(
      evaluateAnswer(question, {
        ...event,
        answerText: 'Tidak membawa payung',
        verdict: 'incorrect'
      })
    ).toBe('incorrect');
    expect(evaluateAnswer(question, { ...event, confidence: 0.4 })).toBe('unclear');
    expect(
      evaluateAnswer(question, {
        ...event,
        answerText: 'Benda pelindung dari air',
        verdict: 'correct'
      })
    ).toBe('correct');
  });
});
it('counts first attempts per question, not retries, and separates unclear and skipped', () => {
  const base: MetricAttempt = {
    sessionId: 's1',
    questionId: 'q1',
    attemptNumber: 1,
    verdict: 'incorrect',
    hintUsed: true,
    responseTimeMs: 3000,
    level: 2,
    category: 'mendengar',
    date: '2026-11-14'
  };
  const metrics = calculateMetrics(
    [
      base,
      { ...base, attemptNumber: 2, verdict: 'correct', responseTimeMs: 1000 },
      { ...base, questionId: 'q2', verdict: 'correct', hintUsed: false, responseTimeMs: 5000 },
      { ...base, questionId: 'q3', verdict: 'unclear', responseTimeMs: null },
      { ...base, questionId: 'q4', verdict: 'skipped', responseTimeMs: null, hintUsed: false },
      {
        ...base,
        sessionId: 's2',
        questionId: 'q2',
        verdict: 'correct',
        responseTimeMs: 1000,
        level: 4
      }
    ],
    1
  );
  expect(metrics).toMatchObject({
    completedSessions: 1,
    questions: 5,
    correct: 2,
    accuracy: 67,
    responseTimeMs: 3000,
    hints: 3,
    skipped: 1,
    unclear: 1,
    mostUsedLevel: 2
  });
  expect(metrics.levels[3].accuracy).toBe(100);
});
it('only starts the 7-second hint countdown when playback finished and cancels on activity', () => {
  vi.useFakeTimers();
  const hint = vi.fn();
  const timer = new SilenceTimer(hint);
  vi.advanceTimersByTime(10000);
  expect(hint).not.toHaveBeenCalled();
  timer.start();
  vi.advanceTimersByTime(6999);
  expect(hint).not.toHaveBeenCalled();
  timer.cancel();
  vi.advanceTimersByTime(1);
  expect(hint).not.toHaveBeenCalled();
  timer.start();
  vi.advanceTimersByTime(7000);
  expect(hint).toHaveBeenCalledTimes(1);
  timer.cancel();
  vi.useRealTimers();
  expect(transition('presenting', 'awaiting_answer')).toBe('awaiting_answer');
  expect(transition('evaluating', 'feedback')).toBe('feedback');
  expect(transition('feedback', 'evaluating')).toBe('evaluating');
  expect(() => transition('completed', 'awaiting_answer')).toThrow();
});
