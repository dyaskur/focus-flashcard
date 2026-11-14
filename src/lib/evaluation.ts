import type { AnswerEvent, Question } from './types';
export function normalizeAnswer(text: string) {
  return text
    .normalize('NFKC')
    .toLocaleLowerCase('id-ID')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
export function evaluateAnswer(question: Question, event: AnswerEvent): AnswerEvent['verdict'] {
  const answer = normalizeAnswer(event.answerText);
  if (!answer || event.confidence < 0.65) return 'unclear';
  if (
    [question.expectedAnswer, ...question.alternatives].some((a) => normalizeAnswer(a) === answer)
  )
    return 'correct';
  // An unmatched phrase is not automatically wrong: use the structured semantic verdict.
  return event.verdict;
}
