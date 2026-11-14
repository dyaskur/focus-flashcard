import { describe, expect, it, vi } from 'vitest';
import { AnswerReporter, type LiveTutorCallbacks } from './protocol';
import type { AnswerEvent } from '../types';

const answer: AnswerEvent = {
  questionId: 'q1',
  answerText: 'dua',
  verdict: 'correct',
  confidence: 0.9,
  feedbackReason: 'Bagus!'
};
const call = (args: unknown = answer, id = 'call-1') => ({
  name: 'report_answer',
  id,
  args: args as Record<string, unknown>
});

describe('structured answer protocol', () => {
  it('awaits the persisted verdict and uses it instead of the model verdict', async () => {
    const reporter = new AnswerReporter();
    const save = vi.fn(async () => ({
      verdict: 'incorrect' as const,
      feedbackReason: 'Mari hitung lagi.'
    }));
    expect(await reporter.report(call(), 'q1', save)).toEqual({
      accepted: true,
      questionId: 'q1',
      verdict: 'incorrect',
      feedbackReason: 'Mari hitung lagi.'
    });
    expect(save).toHaveBeenCalledWith(answer, expect.stringMatching(/^[0-9a-f-]{36}$/));
  });

  it.each([
    null,
    'dua',
    { ...answer, confidence: 2 },
    { ...answer, confidence: -0.1 },
    { ...answer, confidence: NaN },
    { ...answer, confidence: '0.9' },
    { ...answer, answerText: ' ' },
    { ...answer, answerText: 'a'.repeat(2001) },
    { ...answer, verdict: 'skipped' },
    { ...answer, questionId: 'other' },
    { ...answer, feedbackReason: '' },
    { ...answer, feedbackReason: 'a'.repeat(1001) },
    { ...answer, extra: true }
  ])('rejects invalid arguments without calling persistence: %j', async (args) => {
    const save = vi.fn();
    expect(await new AnswerReporter().report(call(args), 'q1', save)).toMatchObject({
      accepted: false
    });
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects unknown tools, missing tool IDs, and no active question', async () => {
    const save = vi.fn();
    const reporter = new AnswerReporter();
    for (const candidate of [
      { ...call(), name: 'other' },
      { ...call(), id: undefined }
    ]) {
      expect(await reporter.report(candidate, 'q1', save)).toMatchObject({ accepted: false });
    }
    expect(await reporter.report(call(), undefined, save)).toMatchObject({ accepted: false });
    expect(save).not.toHaveBeenCalled();
  });

  it('deduplicates simultaneous/replayed calls even when Gemini changes its proposed verdict', async () => {
    const reporter = new AnswerReporter();
    const save = vi.fn(async () => ({ verdict: 'correct' as const, feedbackReason: 'Ya, dua.' }));
    const results = await Promise.all([
      reporter.report(call(), 'q1', save),
      reporter.report(
        call({ ...answer, answerText: ' DUA ', confidence: 0.6, verdict: 'unclear' }, 'call-2'),
        'q1',
        save
      )
    ]);
    expect(results[0]).toEqual(results[1]);
    expect(await reporter.report(call(), 'q1', save)).toEqual(results[0]);
    expect(save).toHaveBeenCalledTimes(1);
    expect(
      await reporter.report(call({ ...answer, answerText: 'tiga' }), 'q1', save)
    ).toMatchObject({ error: 'tool_call_id_reused' });
  });

  it('records a genuinely new spoken attempt even when the child repeats the same answer', async () => {
    const reporter = new AnswerReporter();
    const save = vi.fn<LiveTutorCallbacks['onAnswer']>(async () => ({
      verdict: 'incorrect',
      feedbackReason: 'Coba lagi.'
    }));
    await reporter.report(call(), 'q1', save, 1);
    await reporter.report(call(answer, 'call-2'), 'q1', save, 2);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[0][1]).not.toBe(save.mock.calls[1][1]);
    await reporter.report(call(), 'q1', save, 2); // A replay of the original call remains idempotent.
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('retries uncertain persistence failures with the SAME event ID, never an AI fallback verdict', async () => {
    const reporter = new AnswerReporter();
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error('connection lost after commit'))
      .mockResolvedValueOnce({ verdict: 'incorrect', feedbackReason: 'Coba sekali lagi.' });
    expect(await reporter.report(call(), 'q1', save)).toEqual({
      accepted: false,
      error: 'answer_not_saved'
    });
    expect(await reporter.report(call(answer, 'new-call'), 'q1', save)).toMatchObject({
      accepted: true,
      verdict: 'incorrect'
    });
    expect(save.mock.calls[0][1]).toBe(save.mock.calls[1][1]);
  });

  it('rejects a callback that does not return an actual persisted verdict', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    expect(await new AnswerReporter().report(call(), 'q1', save)).toEqual({
      accepted: false,
      error: 'answer_not_saved'
    });
  });
});
