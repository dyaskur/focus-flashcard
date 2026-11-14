export type LearningState =
  | 'idle'
  | 'connecting'
  | 'presenting'
  | 'awaiting_answer'
  | 'evaluating'
  | 'feedback'
  | 'next_question'
  | 'completed'
  | 'paused'
  | 'reconnecting'
  | 'error';
const transitions: Record<LearningState, LearningState[]> = {
  idle: ['connecting', 'completed'],
  connecting: ['presenting', 'error', 'paused'],
  presenting: [
    'awaiting_answer',
    'evaluating',
    'paused',
    'error',
    'reconnecting',
    'feedback',
    'next_question'
  ],
  awaiting_answer: [
    'presenting',
    'evaluating',
    'paused',
    'error',
    'reconnecting',
    'next_question',
    'feedback'
  ],
  evaluating: ['feedback', 'presenting', 'awaiting_answer', 'paused', 'error', 'reconnecting'],
  feedback: [
    'evaluating',
    'next_question',
    'awaiting_answer',
    'presenting',
    'paused',
    'error',
    'reconnecting'
  ],
  next_question: ['presenting', 'completed', 'error'],
  completed: [],
  paused: ['presenting', 'connecting', 'error', 'completed'],
  reconnecting: ['presenting', 'error', 'paused'],
  error: ['connecting', 'reconnecting', 'feedback', 'completed', 'paused']
};
export function transition(from: LearningState, to: LearningState): LearningState {
  if (from === to) return from;
  if (!transitions[from].includes(to))
    throw new Error(`Invalid learning transition: ${from} → ${to}`);
  return to;
}
export class SilenceTimer {
  private timer: ReturnType<typeof setTimeout> | undefined;
  constructor(private onHint: () => void) {}
  start() {
    this.cancel();
    this.timer = setTimeout(this.onHint, 7000);
  }
  cancel() {
    clearTimeout(this.timer);
    this.timer = undefined;
  }
}
