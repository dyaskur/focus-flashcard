import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveTutor } from './tutor';
import type { AcceptedAnswer, LiveCredentials } from './protocol';
import type { Question } from '../types';

// Test-only device/transport doubles. The production path uses native browser APIs.
class FakeNode {
  connect = vi.fn();
  disconnect = vi.fn();
}
class FakeSource extends FakeNode {
  buffer?: { duration: number };
  onended: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  end(): void {
    this.onended?.();
  }
}
class FakeContext {
  static instances: FakeContext[] = [];
  state = 'running';
  currentTime = 1;
  destination = {};
  onstatechange?: () => void;
  sources: FakeSource[] = [];
  gain = { ...new FakeNode(), gain: { setValueAtTime: vi.fn() } };
  input = new FakeNode();
  audioWorklet = { addModule: vi.fn(async () => {}) };
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  close = vi.fn(async () => {
    this.state = 'closed';
  });
  constructor() {
    FakeContext.instances.push(this);
  }
  createGain() {
    return this.gain;
  }
  createMediaStreamSource() {
    return this.input;
  }
  createBuffer(_channels: number, length: number, rate: number) {
    return { duration: length / rate, copyToChannel: vi.fn() };
  }
  createBufferSource() {
    const source = new FakeSource();
    this.sources.push(source);
    return source;
  }
}
class FakeWorklet extends FakeNode {
  static instances: FakeWorklet[] = [];
  port = {
    onmessage: null as ((event: MessageEvent) => void) | null,
    postMessage: vi.fn(),
    close: vi.fn()
  };
  onprocessorerror?: () => void;
  constructor() {
    super();
    FakeWorklet.instances.push(this);
  }
  capture(rms: number): void {
    this.port.onmessage?.({ data: { pcm: new ArrayBuffer(640), rms } } as MessageEvent);
  }
}
class FakeSocket {
  static OPEN = 1;
  static instances: FakeSocket[] = [];
  readyState = 0;
  bufferedAmount = 0;
  binaryType = '';
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  sent: unknown[] = [];
  constructor(readonly url: string) {
    FakeSocket.instances.push(this);
  }
  open(): void {
    this.readyState = 1;
    this.onopen?.();
  }
  message(data: unknown): void {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent);
  }
  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }
  close = vi.fn(() => {
    this.readyState = 3;
  });
  disconnect(): void {
    this.readyState = 3;
    this.onclose?.();
  }
}

const credentials: LiveCredentials = {
  token: 'auth_tokens/test',
  model: 'gemini-3.8-live',
  config: { sessionResumption: {} }
};
const question: Question = {
  id: 'q1',
  category: 'mendengar',
  level: 1,
  story: 'Dua burung hinggap.',
  prompt: 'Ada berapa burung?',
  expectedAnswer: 'dua',
  alternatives: ['2'],
  hint: { emoji: '🐦', title: 'Hitung', description: 'Satu lalu satu lagi.' }
};
const audio = { inlineData: { data: btoa('\0\0\0\0'), mimeType: 'audio/pcm;rate=24000' } };
const tool = {
  id: 'call-1',
  name: 'report_answer',
  args: {
    questionId: 'q1',
    answerText: 'dua',
    verdict: 'correct',
    confidence: 0.9,
    feedbackReason: 'Usulan AI'
  }
};
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};

let tutor: LiveTutor;
let track: { enabled: boolean; stop: ReturnType<typeof vi.fn>; onended?: (() => void) | null };
let getUserMedia: ReturnType<typeof vi.fn>;
const callbacks = () => ({
  onStatus: vi.fn(),
  onSpeechStart: vi.fn(),
  onQuestionFinished: vi.fn(),
  onError: vi.fn(),
  onAnswer: vi.fn(async (): Promise<AcceptedAnswer> => ({
    verdict: 'incorrect',
    feedbackReason: 'Keputusan server'
  }))
});
let events: ReturnType<typeof callbacks>;

beforeEach(() => {
  vi.useFakeTimers();
  FakeContext.instances = [];
  FakeWorklet.instances = [];
  FakeSocket.instances = [];
  track = { enabled: true, stop: vi.fn() };
  getUserMedia = vi.fn(async () => ({ getTracks: () => [track], getAudioTracks: () => [track] }));
  vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal('AudioContext', FakeContext);
  vi.stubGlobal('AudioWorkletNode', FakeWorklet);
  vi.stubGlobal('WebSocket', FakeSocket);
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  events = callbacks();
  tutor = new LiveTutor(events);
});
afterEach(() => {
  tutor.close();
  expect(vi.getTimerCount()).toBe(0);
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function connected(): Promise<FakeSocket> {
  const promise = tutor.connect(credentials);
  await flush();
  const socket = FakeSocket.instances.at(-1)!;
  socket.open();
  socket.message({ setupComplete: {} });
  await promise;
  tutor.present(question);
  return socket;
}

describe('native Live session lifecycle and audio events', () => {
  it('connects to v1beta with an ephemeral token, requests echo cancellation, and reuses ONE session for controls/questions', async () => {
    const socket = await connected();
    expect(socket.url).toContain(
      'v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=auth_tokens%2Ftest'
    );
    expect(socket.sent[0]).toEqual({
      setup: {
        model: 'models/gemini-3.8-live',
        generationConfig: { responseModalities: ['AUDIO'] },
        sessionResumption: {}
      }
    });
    expect(getUserMedia).toHaveBeenCalledWith({
      audio: {
        channelCount: { ideal: 1 },
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    expect(FakeContext.instances[0].audioWorklet.addModule).toHaveBeenCalledWith(
      '/audio-worklet.js'
    );
    tutor.repeat();
    tutor.hint();
    tutor.present({ ...question, id: 'q2' });
    expect(FakeSocket.instances).toHaveLength(1);
    expect(JSON.stringify(socket.sent)).not.toContain('expectedAnswer');
    expect(socket.sent.at(-1)).toMatchObject({
      clientContent: {
        turnComplete: true,
        turns: [{ parts: [{ text: expect.stringContaining('q2') }] }]
      }
    });
  });

  it('handles all audio parts in a mixed event and waits for the LAST source to end AND turnComplete', async () => {
    const socket = await connected();
    socket.message({
      serverContent: {
        modelTurn: { parts: [audio, { text: 'ignored text' }, audio] },
        outputTranscription: { text: 'ephemeral only' },
        turnComplete: true
      }
    });
    const [first, second] = FakeContext.instances[0].sources;
    expect(first.start).toHaveBeenCalledWith(1.12);
    expect(second.start).toHaveBeenCalledWith(1.12 + 2 / 24000);
    expect(events.onQuestionFinished).not.toHaveBeenCalled();
    first.end();
    expect(events.onQuestionFinished).not.toHaveBeenCalled();
    second.end();
    expect(events.onQuestionFinished).toHaveBeenCalledTimes(1);
    socket.message({ serverContent: { turnComplete: true } });
    expect(events.onQuestionFinished).toHaveBeenCalledTimes(1);
    tutor.repeat();
    socket.message({ serverContent: { modelTurn: { parts: [audio] } } });
    FakeContext.instances[0].sources.at(-1)!.end();
    expect(events.onQuestionFinished).toHaveBeenCalledTimes(1);
    socket.message({ serverContent: { turnComplete: true } });
    expect(events.onQuestionFinished).toHaveBeenCalledTimes(2);
  });

  it('keeps reading through brief mic noise but clears playback on a server-confirmed interruption', async () => {
    const socket = await connected();
    socket.message({ serverContent: { modelTurn: { parts: [audio] } } });
    const source = FakeContext.instances[0].sources[0];
    FakeWorklet.instances[0].capture(0.02);
    FakeWorklet.instances[0].capture(0.02);
    expect(events.onSpeechStart).toHaveBeenCalledTimes(1);
    expect(source.stop).not.toHaveBeenCalled();
    socket.message({ serverContent: { modelTurn: { parts: [audio] } } });
    expect(FakeContext.instances[0].sources).toHaveLength(2);
    expect(socket.sent.at(-1)).toMatchObject({
      realtimeInput: { audio: { mimeType: 'audio/pcm;rate=16000' } }
    });
    socket.message({ serverContent: { interrupted: true, turnComplete: true } });
    expect(source.stop).toHaveBeenCalledTimes(1);
    expect(source.onended).toBeNull();
    expect(events.onQuestionFinished).not.toHaveBeenCalled();
    for (let i = 0; i < 30; i++) FakeWorklet.instances[0].capture(0);
    socket.message({ serverContent: { modelTurn: { parts: [audio] }, turnComplete: true } });
    FakeContext.instances[0].sources.at(-1)!.end();
    expect(events.onQuestionFinished).toHaveBeenCalledTimes(1);
  });

  it('absorbs uneven audio delivery without inserting gaps between spoken chunks', async () => {
    const socket = await connected();
    const context = FakeContext.instances[0];
    const chunk = {
      inlineData: { data: btoa('\0'.repeat(4800)), mimeType: 'audio/pcm;rate=24000' }
    }; // 100 ms of PCM per chunk.
    for (const arrival of [1, 1.08, 1.224]) {
      context.currentTime = arrival;
      socket.message({ serverContent: { modelTurn: { parts: [chunk] } } });
    }
    const starts = context.sources.map((source) => source.start.mock.calls[0][0] as number);
    expect(starts[0]).toBeGreaterThanOrEqual(1);
    expect(starts[0]).toBeLessThanOrEqual(1.25);
    expect(starts[1] - starts[0]).toBeCloseTo(0.1, 5);
    expect(starts[2] - starts[1]).toBeCloseTo(0.1, 5);
  });

  it('does not discard an answer response after normal, non-interrupting child speech', async () => {
    const socket = await connected();
    FakeWorklet.instances[0].capture(0.1);
    FakeWorklet.instances[0].capture(0.1);
    for (let i = 0; i < 30; i++) FakeWorklet.instances[0].capture(0);
    socket.message({ serverContent: { modelTurn: { parts: [audio] }, turnComplete: true } });
    expect(FakeContext.instances[0].sources).toHaveLength(1);
    FakeContext.instances[0].sources[0].end();
    expect(events.onQuestionFinished).toHaveBeenCalledTimes(1);
  });

  it('pause mutes capture/output, drops late messages, clears the queue, and resume repeats the question on the SAME session', async () => {
    const socket = await connected();
    socket.message({ serverContent: { modelTurn: { parts: [audio] } } });
    tutor.pause();
    const sentBefore = socket.sent.length;
    expect(track.enabled).toBe(false);
    expect(FakeContext.instances[0].gain.gain.setValueAtTime).toHaveBeenLastCalledWith(0, 1);
    FakeWorklet.instances[0].capture(0.1);
    expect(socket.sent).toHaveLength(sentBefore);
    socket.message({
      serverContent: { modelTurn: { parts: [audio] }, turnComplete: true },
      toolCall: { functionCalls: [tool] }
    });
    await flush();
    expect(events.onAnswer).not.toHaveBeenCalled();
    expect(events.onQuestionFinished).not.toHaveBeenCalled();
    expect(FakeContext.instances[0].sources).toHaveLength(1);
    await tutor.resume();
    expect(track.enabled).toBe(true);
    expect(FakeSocket.instances).toHaveLength(1);
    expect(socket.sent.at(-1)).toMatchObject({
      clientContent: { turns: [{ parts: [{ text: expect.stringContaining('APP_PRESENT') }] }] }
    });
  });

  it('pause → present(nextQuestion) → resume sends the new question exactly once, never the old question', async () => {
    const socket = await connected();
    tutor.pause();
    const sentBefore = socket.sent.length;
    tutor.present({ ...question, id: 'q2', story: 'Cerita berikutnya.' });
    expect(socket.sent).toHaveLength(sentBefore);
    await tutor.resume();
    expect(socket.sent).toHaveLength(sentBefore + 1);
    expect(JSON.stringify(socket.sent.at(-1))).toContain('q2');
    expect(JSON.stringify(socket.sent.at(-1))).not.toContain('q1');
    expect(FakeSocket.instances).toHaveLength(1);
  });

  it('does not treat empty PCM, transcript-only messages, or generationComplete as a finished spoken question', async () => {
    const socket = await connected();
    socket.message({
      serverContent: {
        modelTurn: { parts: [{ inlineData: { data: ' ', mimeType: 'audio/pcm;rate=24000' } }] },
        turnComplete: true
      }
    });
    expect(FakeContext.instances[0].sources).toHaveLength(0);
    expect(events.onQuestionFinished).not.toHaveBeenCalled();
    socket.message({ serverContent: { modelTurn: { parts: [audio] }, generationComplete: true } });
    FakeContext.instances[0].sources[0].end();
    expect(events.onQuestionFinished).not.toHaveBeenCalled();
    socket.message({ serverContent: { turnComplete: true } });
    expect(events.onQuestionFinished).toHaveBeenCalledTimes(1);
  });

  it('sends only the async SERVER verdict to the function call and never parses transcripts as answers', async () => {
    const socket = await connected();
    let accept!: (answer: AcceptedAnswer) => void;
    events.onAnswer.mockImplementation(
      () =>
        new Promise((resolve) => {
          accept = resolve;
        })
    );
    socket.message({ serverContent: { inputTranscription: { text: JSON.stringify(tool.args) } } });
    expect(events.onAnswer).not.toHaveBeenCalled();
    socket.message({ toolCall: { functionCalls: [tool] } });
    await flush();
    expect(events.onAnswer).toHaveBeenCalledTimes(1);
    expect(socket.sent.some((message) => JSON.stringify(message).includes('toolResponse'))).toBe(
      false
    );
    accept({ verdict: 'incorrect', feedbackReason: 'Keputusan server' });
    await flush();
    expect(socket.sent.at(-1)).toEqual({
      toolResponse: {
        functionResponses: [
          {
            id: 'call-1',
            name: 'report_answer',
            response: {
              accepted: true,
              questionId: 'q1',
              verdict: 'incorrect',
              feedbackReason: 'Keputusan server'
            }
          }
        ]
      }
    });
  });

  it('honors tool cancellation before callback dispatch and rejects the wrong question', async () => {
    const socket = await connected();
    socket.message({ toolCall: { functionCalls: [tool] } });
    socket.message({ toolCallCancellation: { ids: ['call-1'] } });
    await flush();
    expect(events.onAnswer).not.toHaveBeenCalled();
    socket.message({
      toolCall: {
        functionCalls: [{ ...tool, id: 'call-2', args: { ...tool.args, questionId: 'other' } }]
      }
    });
    await flush();
    expect(events.onAnswer).not.toHaveBeenCalled();
    expect(socket.sent.at(-1)).toMatchObject({
      toolResponse: { functionResponses: [{ response: { accepted: false } }] }
    });
  });

  it('does not dispatch an obsolete answer if the app changes the question before the async callback starts', async () => {
    const socket = await connected();
    socket.message({ toolCall: { functionCalls: [tool] } });
    tutor.present({ ...question, id: 'q2' });
    await flush();
    expect(events.onAnswer).not.toHaveBeenCalled();
    expect(events.onError).not.toHaveBeenCalled();
  });

  it('uses the resumption handle with the SAME one-use token, without recreating audio devices', async () => {
    const socket = await connected();
    socket.message({ sessionResumptionUpdate: { resumable: true, newHandle: 'resume-handle' } });
    socket.disconnect();
    expect(track.enabled).toBe(false);
    expect(events.onStatus).toHaveBeenLastCalledWith('reconnecting');
    await vi.advanceTimersByTimeAsync(500);
    const next = FakeSocket.instances[1];
    expect(next.url).toBe(socket.url);
    next.open();
    next.message({ setupComplete: {} });
    await flush();
    expect(next.sent[0]).toMatchObject({
      setup: { sessionResumption: { handle: 'resume-handle' } }
    });
    expect(track.enabled).toBe(true);
    expect(FakeContext.instances).toHaveLength(1);
    expect(next.sent.at(-1)).toMatchObject({
      clientContent: { turns: [{ parts: [{ text: expect.stringContaining('APP_PRESENT') }] }] }
    });
  });

  it('pause cancels reconnect timers; resume reconnects only when requested', async () => {
    const socket = await connected();
    socket.message({ sessionResumptionUpdate: { resumable: true, newHandle: 'resume-handle' } });
    socket.disconnect();
    tutor.pause();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(FakeSocket.instances).toHaveLength(1);
    await tutor.resume();
    await vi.advanceTimersByTimeAsync(1000);
    expect(FakeSocket.instances).toHaveLength(2);
  });

  it('cleans up ALL resources and reports an explicit disconnect when resumption is unavailable', async () => {
    const socket = await connected();
    socket.disconnect();
    expect(events.onError).toHaveBeenCalledTimes(1);
    expect(events.onStatus).toHaveBeenLastCalledWith('disconnected');
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(FakeContext.instances[0].close).toHaveBeenCalledTimes(1);
    expect(FakeWorklet.instances[0].port.close).toHaveBeenCalledTimes(1);
    expect(socket.onmessage).toBeNull();
  });

  it('reports a removed/revoked microphone and releases the rest of the session', async () => {
    const socket = await connected();
    track.onended?.();
    expect(events.onError).toHaveBeenLastCalledWith(expect.stringContaining('Mikrofon terputus'));
    expect(socket.close).toHaveBeenCalledTimes(1);
    expect(track.onended).toBeNull();
  });

  it('times out failed setup, closes its socket, and releases microphone/context/worklet', async () => {
    const outcome = tutor.connect(credentials).catch((error: Error) => error);
    await flush();
    const socket = FakeSocket.instances[0];
    socket.open();
    await vi.advanceTimersByTimeAsync(15_000);
    expect(await outcome).toBeInstanceOf(Error);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(FakeContext.instances[0].close).toHaveBeenCalledTimes(1);
    expect(FakeWorklet.instances[0].port.close).toHaveBeenCalledTimes(1);
    expect(socket.close).toHaveBeenCalledTimes(1);
  });

  it('stops a permission request that resolves AFTER close instead of leaking a live microphone', async () => {
    let allow!: (stream: unknown) => void;
    getUserMedia.mockImplementation(
      () =>
        new Promise((resolve) => {
          allow = resolve;
        })
    );
    const pending = tutor.connect(credentials);
    await flush();
    tutor.close();
    allow({ getTracks: () => [track], getAudioTracks: () => [track] });
    await pending;
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(FakeSocket.instances).toHaveLength(0);
    expect(FakeContext.instances[0].close).toHaveBeenCalledTimes(1);
  });

  it.each(['resolve', 'reject'])(
    'ignores stale resume %s after connect replaces the session',
    async (outcome) => {
      await connected();
      tutor.pause();
      let resolve!: () => void;
      let reject!: (error: Error) => void;
      FakeContext.instances[0].resume.mockImplementationOnce(
        () =>
          new Promise<void>((yes, no) => {
            resolve = yes;
            reject = no;
          })
      );
      const resuming = tutor.resume();
      const socket = await connected();
      tutor.pause();
      const sent = socket.sent.length;
      if (outcome === 'resolve') resolve();
      else reject(new Error('obsolete context'));
      await resuming;
      expect(socket.sent).toHaveLength(sent);
      expect(track.enabled).toBe(false);
      expect(socket.close).not.toHaveBeenCalled();
      expect(events.onStatus).toHaveBeenLastCalledWith('paused');
      expect(events.onError).not.toHaveBeenCalled();
    }
  );
});

describe('pilot Live contract', () => {
  it.each(['repeat', 'hint', 'pause', 'request_skip', 'confirm_skip'])(
    'dispatches %s only to the app, never answer persistence',
    async (action) => {
      const onControl = vi.fn(async () => {});
      tutor = new LiveTutor({ ...events, onControl });
      const socket = await connected();
      socket.message({
        toolCall: { functionCalls: [{ id: 'control', name: 'control_session', args: { action } }] }
      });
      await flush();
      expect(onControl).toHaveBeenCalledExactlyOnceWith(action);
      expect(events.onAnswer).not.toHaveBeenCalled();
      expect(JSON.stringify(socket.sent.at(-1))).toContain('"accepted":true');
    }
  );

  it('does not unlock answers when a hint interrupts an unfinished question', async () => {
    tutor = new LiveTutor(events, { pilot: true });
    const socket = await connected();
    tutor.hint();
    socket.message({ serverContent: { modelTurn: { parts: [audio] }, turnComplete: true } });
    FakeContext.instances[0].sources.at(-1)!.end();
    expect(events.onQuestionFinished).not.toHaveBeenCalled();
    expect(JSON.stringify(socket.sent.at(-1))).toContain('APP_CONTINUE');
    socket.message({ toolCall: { functionCalls: [tool] } });
    await flush();
    expect(events.onAnswer).not.toHaveBeenCalled();
    socket.message({ serverContent: { modelTurn: { parts: [audio] }, turnComplete: true } });
    FakeContext.instances[0].sources.at(-1)!.end();
    expect(events.onQuestionFinished).toHaveBeenCalledTimes(1);
    tutor.pause();
    await tutor.resume();
    expect(JSON.stringify(socket.sent.at(-1))).not.toContain('story');
  });

  it('gates answers until real playback drains, but accepts strict controls while reading', async () => {
    const onControl = vi.fn(async () => {});
    tutor = new LiveTutor({ ...events, onControl });
    const socket = await connected();
    socket.message({ toolCall: { functionCalls: [tool] } });
    await flush();
    expect(events.onAnswer).not.toHaveBeenCalled();
    expect(JSON.stringify(socket.sent.at(-1))).toContain('question_not_finished');
    socket.message({
      toolCall: {
        functionCalls: [
          { id: 'c1', name: 'control_session', args: { action: 'hint', extra: true } },
          { id: 'c2', name: 'control_session', args: { action: 'hint' } }
        ]
      }
    });
    await flush();
    expect(onControl).toHaveBeenCalledExactlyOnceWith('hint');
    socket.message({ serverContent: { modelTurn: { parts: [audio, audio] }, turnComplete: true } });
    socket.message({ toolCall: { functionCalls: [{ ...tool, id: 'early' }] } });
    FakeContext.instances[0].sources[0].end();
    await flush();
    expect(events.onAnswer).not.toHaveBeenCalled();
    FakeContext.instances[0].sources[1].end();
    expect(events.onQuestionFinished).toHaveBeenCalledTimes(1);
    socket.message({
      toolCall: {
        functionCalls: [{ ...tool, id: 'late', args: { ...tool.args, answerLanguage: 'en' } }]
      }
    });
    await flush();
    expect(events.onAnswer).toHaveBeenCalledWith(
      { ...tool.args, answerLanguage: 'en' },
      expect.any(String)
    );
  });

  it('serializes persisted answers before controls, deduplicates controls, and survives control errors', async () => {
    let saved!: (answer: AcceptedAnswer) => void;
    events.onAnswer.mockImplementation(
      () =>
        new Promise((resolve) => {
          saved = resolve;
        })
    );
    const onControl = vi.fn(async () => {});
    tutor = new LiveTutor({ ...events, onControl });
    const socket = await connected();
    socket.message({ serverContent: { modelTurn: { parts: [audio] }, turnComplete: true } });
    FakeContext.instances[0].sources[0].end();
    const control = { id: 'skip', name: 'control_session', args: { action: 'request_skip' } };
    socket.message({ toolCall: { functionCalls: [tool, control, control] } });
    await flush();
    expect(events.onAnswer).toHaveBeenCalledTimes(1);
    expect(onControl).not.toHaveBeenCalled();
    saved({ verdict: 'correct', feedbackReason: 'Persisted' });
    await flush();
    await flush();
    expect(onControl).toHaveBeenCalledExactlyOnceWith('request_skip');
    onControl.mockRejectedValueOnce(new Error('uncertain'));
    const failed = { ...control, id: 'failed' };
    socket.message({ toolCall: { functionCalls: [failed, failed, { ...control, id: 'new' }] } });
    await flush();
    await flush();
    expect(onControl).toHaveBeenCalledTimes(3);
    expect(JSON.stringify(socket.sent)).toContain('control_not_applied');
    expect(events.onAnswer).toHaveBeenCalledTimes(1);
  });

  it('waits for feedback playback before accepting another genuine answer attempt', async () => {
    tutor = new LiveTutor(events, { pilot: true });
    const socket = await connected();
    socket.message({ serverContent: { modelTurn: { parts: [audio] }, turnComplete: true } });
    FakeContext.instances[0].sources.at(-1)!.end();
    socket.message({ toolCall: { functionCalls: [tool] } });
    await flush();
    expect(events.onAnswer).toHaveBeenCalledTimes(1);
    socket.message({ serverContent: { modelTurn: { parts: [audio] }, turnComplete: true } });
    socket.message({
      toolCall: {
        functionCalls: [{ ...tool, id: 'echo', args: { ...tool.args, answerText: 'speaker echo' } }]
      }
    });
    await flush();
    expect(events.onAnswer).toHaveBeenCalledTimes(1);
    FakeContext.instances[0].sources.at(-1)!.end();
    socket.message({
      toolCall: {
        functionCalls: [
          {
            ...tool,
            id: 'next-attempt',
            args: { ...tool.args, answerText: 'another genuine attempt' }
          }
        ]
      }
    });
    await flush();
    expect(events.onAnswer).toHaveBeenCalledTimes(2);
    expect(events.onQuestionFinished).toHaveBeenCalledTimes(1);
  });

  it('continues an interrupted story with mic active, rejects invented answers, and does not count review/nudges as questions', async () => {
    tutor = new LiveTutor(events, { pilot: true });
    const socket = await connected();
    socket.message({ serverContent: { modelTurn: { parts: [audio] } } });
    socket.message({
      serverContent: { interrupted: true, turnComplete: true },
      toolCall: { functionCalls: [tool] }
    });
    await flush();
    expect(track.enabled).toBe(true);
    expect(JSON.stringify(socket.sent.at(-1))).toContain('APP_CONTINUE');
    expect(events.onAnswer).not.toHaveBeenCalled();
    expect(events.onQuestionFinished).not.toHaveBeenCalled();
    FakeWorklet.instances[0].capture(0.02);
    expect(socket.sent.at(-1)).toHaveProperty('realtimeInput');
    socket.message({ serverContent: { modelTurn: { parts: [audio] }, turnComplete: true } });
    FakeContext.instances[0].sources.at(-1)!.end();
    tutor.present({ ...question, id: 'q2' }, { readStory: false });
    const text = JSON.stringify(socket.sent.at(-1));
    expect(text).not.toContain('story');
    expect(text).not.toContain('expectedAnswer');
    expect(text).toContain(question.prompt);
    tutor.nudge(1);
    tutor.nudge(2);
    tutor.nudge(3);
    tutor.review('App-authorized explanation.');
    socket.message({ serverContent: { modelTurn: { parts: [audio] }, turnComplete: true } });
    FakeContext.instances[0].sources.at(-1)!.end();
    expect(events.onQuestionFinished).toHaveBeenCalledTimes(1);
    expect(FakeSocket.instances).toHaveLength(1);
  });
});
