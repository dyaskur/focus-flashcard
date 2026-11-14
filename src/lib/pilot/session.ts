import type { PracticeSession, PracticeAttempt } from './types';
import { questionDone } from './types';

export function currentCard(session: PracticeSession) {
  return session.cards[session.cardIndex];
}
export function currentQuestion(session: PracticeSession) {
  return currentCard(session)?.questions[session.questionIndex];
}
export function attemptsFor(session: PracticeSession, cardId: string, questionId: string) {
  return session.attempts.filter((a) => a.cardId === cardId && a.questionId === questionId);
}
export function finishedCard(session: PracticeSession, cardId: string) {
  const card = session.cards.find((c) => c.id === cardId);
  return (
    !!card &&
    card.questions.every(
      (q) =>
        session.resolvedQuestionIds?.includes(q.id) ||
        questionDone(attemptsFor(session, cardId, q.id))
    )
  );
}
export function assistanceFor(session: PracticeSession, attempt: PracticeAttempt) {
  return session.events.filter(
    (event) =>
      event.cardId === attempt.cardId &&
      (event.type === 'repeat'
        ? event.createdAt <= attempt.createdAt
        : ['hint', 'visual', 'caregiver'].includes(event.type) &&
          event.questionId === attempt.questionId) &&
      (event.type !== 'hint' || event.createdAt < attempt.createdAt)
  );
}
export function results(session: PracticeSession) {
  return session.cards.flatMap((card) =>
    card.questions.map((question) => {
      const attempts = attemptsFor(session, card.id, question.id);
      const correct = attempts.find((a) => a.verdict === 'correct');
      const last = attempts.at(-1);
      const status = correct
        ? 'correct'
        : last?.verdict === 'skipped'
          ? 'skipped'
          : attempts.filter((a) => a.verdict === 'incorrect').length >= 3
            ? 'incorrect'
            : last?.verdict === 'unclear'
              ? 'unclear'
              : 'unfinished';
      return {
        card,
        question,
        attempts,
        status,
        assisted: correct ? assistanceFor(session, correct).length > 0 : false,
        modes: [...new Set(attempts.map((a) => a.mode))]
      };
    })
  );
}
