import type { Question, AnswerEvent } from '../types';
import type { LiveTutorCallbacks } from '../live/protocol';

/** Isolated test transport. Selected only by an opt-in non-production server response. */
export class MockTutor {
  private question?: Question;
  private timer?: ReturnType<typeof setTimeout>;
  private paused = false;
  constructor(private callbacks: LiveTutorCallbacks) {}
  async connect() {
    window.addEventListener('tutor:test-answer', this.answer);
  }
  present(question: Question) {
    this.question = question;
    this.paused = false;
    this.repeat();
  }
  repeat() {
    clearTimeout(this.timer);
    this.callbacks.onStatus('speaking');
    this.timer = setTimeout(() => {
      if (!this.paused) this.callbacks.onQuestionFinished();
    }, 80);
  }
  hint() {
    this.repeat();
  }
  pause() {
    this.paused = true;
    clearTimeout(this.timer);
  }
  resume() {
    this.paused = false;
    this.repeat();
  }
  close() {
    this.pause();
    window.removeEventListener('tutor:test-answer', this.answer);
  }
  private answer = async (event: Event) => {
    if (!this.question || this.paused) return;
    const data = (event as CustomEvent<Partial<AnswerEvent>>).detail;
    this.callbacks.onSpeechStart();
    this.callbacks.onStatus('thinking');
    await this.callbacks.onAnswer(
      {
        questionId: this.question.id,
        answerText: data.answerText ?? this.question.expectedAnswer,
        verdict: data.verdict ?? 'correct',
        confidence: data.confidence ?? 0.95,
        feedbackReason: 'Terima kasih sudah mencoba.'
      },
      crypto.randomUUID()
    );
    this.timer = setTimeout(() => this.callbacks.onQuestionFinished(), 50);
  };
}
