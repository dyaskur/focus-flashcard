import type { Category, Verdict } from './types';
export interface MetricAttempt {
  sessionId: string;
  questionId: string;
  attemptNumber: number;
  verdict: Verdict;
  hintUsed: boolean;
  responseTimeMs: number | null;
  level: number;
  category: string;
  date: string;
}
export function calculateMetrics(attempts: MetricAttempt[], completedSessions = 0) {
  const groups = new Map<string, MetricAttempt[]>();
  for (const a of attempts) {
    const key = `${a.sessionId}:${a.questionId}`;
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }
  const first = [...groups.values()].map(
    (g) => g.sort((a, b) => a.attemptNumber - b.attemptNumber)[0]
  );
  const valid = first.filter((a) => a.verdict === 'correct' || a.verdict === 'incorrect');
  const accuracy = (rows: MetricAttempt[]) =>
    rows.length
      ? Math.round((rows.filter((a) => a.verdict === 'correct').length / rows.length) * 100)
      : 0;
  const average = (rows: MetricAttempt[]) => {
    const timed = rows.filter((a) => a.responseTimeMs !== null && a.verdict !== 'skipped');
    return timed.length
      ? Math.round(timed.reduce((sum, a) => sum + a.responseTimeMs!, 0) / timed.length)
      : null;
  };
  const buckets = (rows: MetricAttempt[]) => ({
    accuracy: accuracy(rows.filter((a) => a.verdict === 'correct' || a.verdict === 'incorrect')),
    responseTimeMs: average(rows),
    count: rows.length
  });
  return {
    completedSessions,
    questions: first.length,
    correct: valid.filter((a) => a.verdict === 'correct').length,
    accuracy: accuracy(valid),
    responseTimeMs: average(first),
    hints: [...groups.values()].filter((g) => g.some((a) => a.hintUsed)).length,
    skipped: first.filter((a) => a.verdict === 'skipped').length,
    unclear: first.filter((a) => a.verdict === 'unclear').length,
    levels: [1, 2, 3, 4, 5].map((level) => ({
      level,
      ...buckets(first.filter((a) => a.level === level))
    })),
    categories: (['mendengar', 'logika'] as Category[]).map((category) => ({
      category,
      ...buckets(first.filter((a) => a.category === category))
    })),
    trend: [...new Set(first.map((a) => a.date))]
      .sort()
      .map((date) => ({ date, ...buckets(first.filter((a) => a.date === date)) })),
    mostUsedLevel: first.length
      ? [1, 2, 3, 4, 5].sort(
          (a, b) =>
            first.filter((r) => r.level === b).length - first.filter((r) => r.level === a).length
        )[0]
      : null
  };
}
