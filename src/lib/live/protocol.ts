import type { FunctionCall, LiveConnectConfig } from '@google/genai';
import { z } from 'zod';
import type { AnswerEvent } from '../types';

export interface LiveCredentials {
  token: string;
  model: string;
  config: LiveConnectConfig;
}

/** Return the persisted server verdict, not the model's proposed verdict. */
export type AcceptedAnswer = Pick<AnswerEvent, 'verdict' | 'feedbackReason'>;

export type LiveAnswerEvent = AnswerEvent & { answerLanguage?: 'id' | 'en' | 'mixed' };
export type SessionControl = 'repeat' | 'hint' | 'pause' | 'request_skip' | 'confirm_skip';

export interface LiveTutorCallbacks {
  onStatus(status: string): void;
  onAnswer(event: LiveAnswerEvent, eventId: string): Promise<AcceptedAnswer>;
  /** Presence enables pilot playback gating. The app owns every control side effect. */
  onControl?(action: SessionControl): Promise<void>;
  onSpeechStart(): void;
  onSpeechEnd?(): void;
  onQuestionFinished(): void;
  onError(message: string): void;
}

const verdict = z.enum(['correct', 'incorrect', 'unclear']);
export const answerEventSchema = z
  .object({
    questionId: z.string().min(1).max(100),
    answerText: z.string().trim().min(1).max(2000),
    verdict,
    confidence: z.number().finite().min(0).max(1),
    feedbackReason: z.string().trim().min(1).max(1000),
    answerLanguage: z.enum(['id', 'en', 'mixed']).optional()
  })
  .strict();

export const controlEventSchema = z
  .object({ action: z.enum(['repeat', 'hint', 'pause', 'request_skip', 'confirm_skip']) })
  .strict();

const acceptedAnswerSchema = z.object({
  verdict,
  feedbackReason: z.string().trim().min(1).max(1000)
});

type ToolResult = Record<string, unknown>;
interface AnswerRecord {
  eventId: string;
  pending?: Promise<ToolResult>;
  result?: ToolResult;
}

/** Session-memory only. Retries after an uncertain HTTP failure reuse the same event ID. */
export class AnswerReporter {
  private callKeys = new Map<string, { answerKey: string; recordKey: string }>();
  private answers = new Map<string, AnswerRecord>();

  async report(
    call: FunctionCall,
    activeQuestionId: string | undefined,
    save: LiveTutorCallbacks['onAnswer'],
    speechTurn = 0
  ): Promise<ToolResult> {
    if (call.name !== 'report_answer' || !call.id || call.id.length > 128) {
      return { accepted: false, error: 'invalid_tool_call' };
    }
    const parsed = answerEventSchema.safeParse(call.args);
    if (!parsed.success || parsed.data.questionId !== activeQuestionId) {
      return { accepted: false, error: 'invalid_answer_or_inactive_question' };
    }
    const event = parsed.data;
    // Model retries can have a different tool-call ID, confidence, or proposed verdict.
    const answerKey = JSON.stringify([
      event.questionId,
      event.answerText.normalize('NFKC').toLocaleLowerCase('id-ID')
    ]);
    const previous = this.callKeys.get(call.id);
    if (previous && previous.answerKey !== answerKey) {
      return { accepted: false, error: 'tool_call_id_reused' };
    }
    // A new actual speech turn is a new attempt, even if the child repeats a wrong answer.
    const key = previous?.recordKey ?? JSON.stringify([speechTurn, answerKey]);
    this.callKeys.set(call.id, { answerKey, recordKey: key });
    let record = this.answers.get(key);
    if (!record) {
      record = { eventId: crypto.randomUUID() };
      this.answers.set(key, record);
    }
    if (record.result) return record.result;
    if (record.pending) return record.pending;
    const target = record;
    target.pending = Promise.resolve().then(async () => {
      try {
        const accepted = acceptedAnswerSchema.parse(await save(event, target.eventId));
        target.result = { accepted: true, questionId: event.questionId, ...accepted };
        return target.result;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return { accepted: false, error: 'answer_cancelled' };
        }
        // Do not pretend the proposed AI verdict was accepted when persistence failed.
        return { accepted: false, error: 'answer_not_saved' };
      } finally {
        target.pending = undefined;
      }
    });
    return target.pending;
  }

  clear(): void {
    this.callKeys.clear();
    this.answers.clear();
  }
}
