import type { FunctionCall, LiveServerMessage } from '@google/genai';
import type { Question } from '../types';
import {
  AnswerReporter,
  controlEventSchema,
  type LiveCredentials,
  type LiveTutorCallbacks
} from './protocol';
import { MicActivity, PcmPlayer, PlaybackBoundary, pcm16ToBase64 } from './audio';

const LIVE_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained';

/** A single real Gemini Live session, with short-lived credentials and no transcript storage. */
export class LiveTutor {
  private socket?: WebSocket;
  private credentials?: LiveCredentials;
  private context?: AudioContext;
  private stream?: MediaStream;
  private microphone?: MediaStreamAudioSourceNode;
  private worklet?: AudioWorkletNode;
  private player?: PcmPlayer;
  private question?: Question;
  private reporter = new AnswerReporter();
  private boundary = new PlaybackBoundary();
  private activity = new MicActivity();
  private cancelledCalls = new Set<string>();
  private resumptionHandle?: string;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private cancelOpening?: () => void;
  private reconnectAttempts = 0;
  private ready = false;
  private closed = true;
  private paused = false;
  private epoch = 0;
  private speechTurn = 0;
  private status = '';
  private readStory = true;
  private questionPending = false;
  private hintPlaying = false;
  private answersReady = false;
  private restoreAnswers = false;
  private commandVersion = 0;
  private toolQueue: Promise<void> = Promise.resolve();
  private controls = new Map<string, { action: string; result: Record<string, unknown> }>();

  /** onControl enables pilot mode by default; explicit pilot supports answer-only clients. */
  constructor(
    private callbacks: LiveTutorCallbacks,
    private options: { pilot?: boolean } = {}
  ) {}

  private get pilot(): boolean {
    return this.options.pilot ?? !!this.callbacks.onControl;
  }

  async connect(credentials: LiveCredentials): Promise<void> {
    this.dispose();
    this.closed = false;
    this.paused = false;
    const epoch = this.epoch;
    this.credentials = credentials;
    this.setStatus('connecting');
    try {
      if (!credentials.token.startsWith('auth_tokens/') || !credentials.model) {
        throw new Error('Token sesi suara tidak valid.');
      }
      if (
        !globalThis.isSecureContext ||
        !navigator.mediaDevices?.getUserMedia ||
        !globalThis.AudioWorkletNode
      ) {
        throw new Error('Suara memerlukan HTTPS, izin mikrofon, dan browser dengan AudioWorklet.');
      }
      const context = new AudioContext({ latencyHint: 'interactive' });
      this.context = context;
      // Called before the first await so a click can unlock audio in Safari/Chrome.
      await context.resume();
      await context.audioWorklet.addModule('/audio-worklet.js');
      if (this.closed || epoch !== this.epoch) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: { ideal: 1 },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      if (this.closed || epoch !== this.epoch) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      this.stream = stream;
      stream.getAudioTracks().forEach((track) => {
        track.onended = () => this.fail('Mikrofon terputus. Periksa izin dan sambungkan ulang.');
      });
      this.setMicrophone(false);
      this.player = new PcmPlayer(context, () => this.checkFinished());
      this.microphone = context.createMediaStreamSource(stream);
      this.worklet = new AudioWorkletNode(context, 'pcm16-microphone', {
        channelCount: 1,
        channelCountMode: 'explicit'
      });
      this.worklet.port.onmessage = ({ data }: MessageEvent<{ pcm: ArrayBuffer; rms: number }>) => {
        if (!this.ready || this.closed || this.paused || !this.question) return;
        try {
          const change = this.activity.update(data.rms, data.pcm.byteLength / 32);
          if (change === 'start') {
            this.speechTurn++;
            this.callbacks.onSpeechStart();
            // Energy also includes taps and speaker leakage. Only server VAD may cut playback.
            if (this.player?.empty) this.setStatus('thinking');
          } else if (change === 'end') {
            if (this.player?.empty) this.setStatus('thinking');
            this.checkFinished();
            this.callbacks.onSpeechEnd?.();
          }
          this.send({
            realtimeInput: {
              audio: { data: pcm16ToBase64(data.pcm), mimeType: 'audio/pcm;rate=16000' }
            }
          });
        } catch {
          this.fail('Audio mikrofon tidak dapat dikirim. Silakan sambungkan ulang.');
        }
      };
      this.worklet.onprocessorerror = () =>
        this.fail('Pemrosesan mikrofon terhenti. Silakan sambungkan ulang.');
      this.microphone.connect(this.worklet);
      // The processor outputs silence; this keeps capture running without mic monitoring.
      this.worklet.connect(context.destination);
      context.onstatechange = () => {
        if (context.state === 'suspended' && this.ready && !this.paused && !this.closed) {
          this.pause();
          this.callbacks.onError(
            'Audio dijeda oleh browser. Tekan lanjut untuk mengaktifkannya kembali.'
          );
        }
      };
      await this.openSocket();
      if (this.closed || epoch !== this.epoch) return;
      this.setMicrophone(!this.paused);
      this.setStatus(this.paused ? 'paused' : 'listening');
    } catch (error) {
      if (epoch !== this.epoch || this.closed) return;
      const message = error instanceof Error ? error.message : 'Sesi suara gagal tersambung.';
      this.fail(message);
      throw new Error(message, { cause: error });
    }
  }

  present(question: Question, options: { readStory?: boolean } = {}): void {
    this.question = question;
    this.readStory = options.readStory ?? true;
    this.answersReady = false;
    if (!this.paused) this.command('APP_PRESENT');
  }

  repeat(): void {
    if (this.question && !this.paused) this.command('APP_REPEAT');
  }

  hint(): void {
    if (this.question && !this.paused) this.command('APP_HINT');
  }

  review(text: string): void {
    if (!text.trim() || text.length > 4000) throw new Error('Penjelasan tidak valid.');
    this.speak('APP_REVIEW', { text });
    this.answersReady = false;
  }

  nudge(stage: 1 | 2 | 3, hint?: string): void {
    if (![1, 2, 3].includes(stage)) throw new Error('Tahap pengingat tidak valid.');
    this.speak('APP_NUDGE', { stage, ...(hint ? { hint } : {}) });
  }

  private speak(action: string, data: Record<string, unknown>): void {
    if (!this.ready || this.paused) return;
    this.restoreAnswers = action === 'APP_NUDGE' && this.answersReady;
    this.answersReady = false;
    this.commandVersion++;
    this.questionPending = false;
    this.hintPlaying = false;
    this.clearPlayback();
    this.setStatus('thinking');
    try {
      this.sendText(`${action}\n${JSON.stringify(data)}`);
    } catch {
      this.fail('Pesan tidak dapat dikirim. Silakan sambungkan ulang.');
    }
  }

  pause(): void {
    if (this.closed || this.paused) return;
    this.paused = true;
    this.setMicrophone(false);
    this.player?.mute(true);
    this.clearPlayback();
    this.activity.reset();
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    if (!this.ready && this.resumptionHandle) this.cancelOpening?.();
    // Flush server VAD, then interrupt its generation without closing the session.
    if (this.ready) {
      try {
        this.send({ realtimeInput: { audioStreamEnd: true } });
        this.sendText('APP_PAUSE');
      } catch {
        this.fail('Sesi suara terputus saat dijeda.');
        return;
      }
    }
    this.setStatus('paused');
  }

  async resume(): Promise<void> {
    if (this.closed || !this.paused) return;
    const epoch = this.epoch;
    try {
      await this.context?.resume();
      if (this.closed || epoch !== this.epoch) return;
      this.paused = false;
      this.player?.mute(false);
      this.setMicrophone(this.ready);
      if (this.ready && this.question) this.command('APP_PRESENT');
      else if (!this.ready && !this.socket)
        this.reconnect('Sesi suara perlu disambungkan kembali.');
      else this.setStatus(this.ready ? 'listening' : 'connecting');
    } catch {
      if (this.closed || epoch !== this.epoch) return;
      this.fail('Audio tidak dapat dilanjutkan. Silakan sambungkan ulang.');
    }
  }

  close(): void {
    this.dispose();
    this.setStatus('closed');
  }

  private command(action: 'APP_PRESENT' | 'APP_REPEAT' | 'APP_HINT'): void {
    if (!this.ready || !this.question) throw new Error('Sesi suara belum tersambung.');
    this.commandVersion++;
    this.hintPlaying = this.pilot && action === 'APP_HINT';
    this.restoreAnswers = this.hintPlaying && this.answersReady;
    if (this.pilot) this.answersReady = false;
    if (!this.hintPlaying) {
      this.questionPending = true;
      this.answersReady = false;
    }
    this.clearPlayback();
    this.activity.reset();
    this.setStatus('thinking');
    // Do not send an account/profile object or answer keys from the browser.
    const { id, story, prompt, hint } = this.question;
    try {
      // Question-only transitions never resend the story, even after resume/reconnect.
      this.sendText(
        `${action}\n${JSON.stringify(this.readStory ? { id, story, prompt, hint } : { id, prompt, hint })}`
      );
    } catch {
      this.fail('Soal tidak dapat dikirim. Silakan sambungkan ulang.');
    }
  }

  private sendText(text: string): void {
    this.send({
      clientContent: { turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true }
    });
  }

  private send(message: unknown): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN)
      throw new Error('Sesi suara terputus.');
    // Bound buffering on a stalled connection instead of accumulating a child's audio.
    if (this.socket.bufferedAmount > 256_000) throw new Error('Jaringan suara terlalu lambat.');
    this.socket.send(JSON.stringify(message));
  }

  private openSocket(handle?: string): Promise<void> {
    const credentials = this.credentials!;
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(
        `${LIVE_URL}?access_token=${encodeURIComponent(credentials.token)}`
      );
      socket.binaryType = 'arraybuffer';
      this.socket = socket;
      let settled = false;
      const timeout = setTimeout(
        () => stop(new Error('Gemini tidak merespons. Silakan coba lagi.')),
        15_000
      );
      const stop = (error: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        this.cancelOpening = undefined;
        socket.onclose = socket.onerror = socket.onmessage = socket.onopen = null;
        socket.close();
        if (this.socket === socket) this.socket = undefined;
        reject(error);
      };
      this.cancelOpening = () => stop(new Error('Sesi suara ditutup.'));
      socket.onopen = () => {
        if (this.closed || this.socket !== socket) {
          stop(new Error('Sesi suara ditutup.'));
          return;
        }
        try {
          const { responseModalities } = credentials.config;
          this.send({
            setup: {
              model: credentials.model.startsWith('models/')
                ? credentials.model
                : `models/${credentials.model}`,
              generationConfig: { responseModalities: responseModalities ?? ['AUDIO'] },
              sessionResumption: handle ? { handle } : {}
            }
          });
        } catch {
          stop(new Error('Konfigurasi Gemini tidak dapat dikirim.'));
        }
      };
      socket.onmessage = ({ data }: MessageEvent<string | ArrayBuffer>) => {
        if (this.closed || this.socket !== socket) return;
        try {
          const message = JSON.parse(
            typeof data === 'string' ? data : new TextDecoder().decode(data)
          ) as LiveServerMessage & { error?: unknown };
          if (message.error)
            throw new Error('Gemini menolak sesi suara. Periksa konfigurasi model dan token.');
          if (message.setupComplete && !settled) {
            settled = true;
            clearTimeout(timeout);
            this.cancelOpening = undefined;
            this.ready = true;
            resolve();
          }
          this.receive(message, socket);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Pesan Gemini tidak valid.';
          if (!settled) stop(new Error(message));
          else this.fail(message);
        }
      };
      socket.onerror = () => {
        if (!settled) stop(new Error('Tidak dapat tersambung ke Gemini Live.'));
        else this.reconnect('Koneksi Gemini Live mengalami gangguan.');
      };
      socket.onclose = () => {
        if (!settled) stop(new Error('Gemini menutup koneksi sebelum sesi siap.'));
        else if (this.socket === socket && !this.closed) this.reconnect('Sesi suara terputus.');
      };
    });
  }

  private receive(message: LiveServerMessage, socket: WebSocket): void {
    const update = message.sessionResumptionUpdate;
    if (update?.resumable && update.newHandle) this.resumptionHandle = update.newHandle;
    for (const id of message.toolCallCancellation?.ids ?? []) this.cancelledCalls.add(id);
    const content = message.serverContent;
    const continueQuestion = this.pilot && this.questionPending && !!content?.interrupted;
    const version = this.commandVersion;
    if (content?.interrupted) {
      this.clearPlayback();
      if (!this.paused) this.setStatus('thinking');
    }
    // Iterate ALL parts: 3.8 can send audio, text, transcriptions, and tools together.
    // Input/output transcriptions are deliberately neither accumulated nor persisted.
    for (const part of content?.modelTurn?.parts ?? []) {
      const audio = part.inlineData;
      if (!this.paused && !content?.interrupted && audio?.data) {
        if (!/^audio\/pcm(?:;|$)/i.test(audio.mimeType ?? '')) continue;
        const rate = /rate=(\d+)/i.exec(audio.mimeType ?? '');
        if (rate && Number(rate[1]) !== 24000)
          throw new Error('Format audio Gemini tidak didukung.');
        if (this.player!.enqueue(audio.data)) {
          this.boundary.audio();
          this.setStatus('speaking');
        }
      }
    }
    for (const call of message.toolCall?.functionCalls ?? []) {
      const answerAllowed = !this.pilot || this.answersReady;
      const turn = this.speechTurn;
      this.toolQueue = this.toolQueue
        .then(() => this.handleTool(call, socket, answerAllowed, turn))
        .catch(() => {
          if (!this.closed && this.socket === socket)
            this.fail('Perintah suara tidak dapat diproses. Silakan sambungkan ulang.');
        });
    }
    if (continueQuestion) {
      // Server VAD is not keyword-only. Keep capture active and guide interrupted reading
      // back to its unfinished sentence; do not turn incidental noise into an answer.
      this.toolQueue = this.toolQueue.then(() => {
        if (
          !this.closed &&
          !this.paused &&
          this.socket === socket &&
          this.questionPending &&
          version === this.commandVersion
        )
          this.continueQuestion();
      });
    }
    if (content?.turnComplete) {
      this.boundary.complete();
      this.checkFinished();
    }
    if (message.goAway && this.socket === socket)
      this.reconnect('Gemini memperbarui koneksi sesi suara.');
  }

  private async handleTool(
    call: FunctionCall,
    socket: WebSocket,
    answerAllowed: boolean,
    speechTurn: number
  ): Promise<void> {
    if (this.closed || this.socket !== socket) return;
    if (call.id && this.cancelledCalls.has(call.id)) return;
    this.setStatus(this.paused ? 'paused' : 'thinking');
    const result =
      call.name === 'control_session'
        ? await this.handleControl(call)
        : this.paused
          ? { accepted: false, error: 'session_paused' }
          : this.pilot && (!answerAllowed || !this.answersReady)
            ? { accepted: false, error: 'question_not_finished' }
            : await this.reporter.report(
                call,
                this.question?.id,
                async (event, eventId) => {
                  if (
                    this.closed ||
                    this.paused ||
                    this.socket !== socket ||
                    event.questionId !== this.question?.id ||
                    (call.id && this.cancelledCalls.has(call.id))
                  )
                    throw new DOMException('Soal tidak aktif.', 'AbortError');
                  return this.callbacks.onAnswer(event, eventId);
                },
                speechTurn
              );
    if (this.closed || this.socket !== socket || (call.id && this.cancelledCalls.has(call.id)))
      return;
    if (this.pilot && call.name === 'report_answer' && result.accepted === true) {
      this.restoreAnswers = true;
      this.answersReady = false;
    }
    try {
      this.send({
        toolResponse: { functionResponses: [{ id: call.id, name: call.name, response: result }] }
      });
      if (result.error === 'answer_not_saved')
        this.callbacks.onError('Jawaban belum dapat disimpan. Silakan coba lagi.');
    } catch {
      this.reconnect('Hasil jawaban belum terkirim ke Gemini.');
    }
  }

  private async handleControl(call: FunctionCall): Promise<Record<string, unknown>> {
    const parsed = controlEventSchema.safeParse(call.args);
    if (!call.id || call.id.length > 128 || !parsed.success || !this.callbacks.onControl)
      return { accepted: false, error: 'invalid_control' };
    const { action } = parsed.data;
    const previous = this.controls.get(call.id);
    if (previous)
      return previous.action === action
        ? previous.result
        : { accepted: false, error: 'tool_call_id_reused' };
    // Cache uncertain failures too: retrying a non-idempotent skip could skip two questions.
    const entry = {
      action,
      result: { accepted: false, error: 'control_not_applied' } as Record<string, unknown>
    };
    this.controls.set(call.id, entry);
    try {
      await this.callbacks.onControl(action);
      entry.result = { accepted: true, action };
    } catch {
      // The app owns error presentation and reconciliation of an uncertain control.
    }
    return entry.result;
  }

  private checkFinished(): void {
    if (this.closed || this.paused || !this.ready || this.activity.active || !this.question) return;
    if (this.boundary.takeFinished(this.player?.empty ?? true)) {
      this.setStatus('listening');
      if (this.pilot && this.hintPlaying) {
        this.hintPlaying = false;
        this.answersReady = this.restoreAnswers;
        this.restoreAnswers = false;
        if (this.questionPending) {
          this.boundary.reset();
          this.setStatus('thinking');
          this.continueQuestion();
        }
        return;
      }
      if (this.pilot && !this.questionPending) {
        this.answersReady = this.restoreAnswers;
        this.restoreAnswers = false;
        return;
      }
      this.questionPending = false;
      this.answersReady = true;
      if (this.pilot) this.readStory = false;
      this.callbacks.onQuestionFinished();
    }
  }

  private continueQuestion(): void {
    this.hintPlaying = false;
    try {
      this.sendText('APP_CONTINUE');
    } catch {
      this.reconnect('Cerita belum dapat dilanjutkan.');
    }
  }

  private reconnect(message: string): void {
    if (this.closed || this.reconnectTimer) return;
    this.ready = false;
    this.setMicrophone(false);
    this.clearPlayback();
    this.detachSocket();
    if (this.paused) {
      this.setStatus('paused');
      return;
    }
    if (!this.resumptionHandle || this.reconnectAttempts >= 3) {
      this.fail(`${message} Silakan sambungkan ulang.`);
      return;
    }
    this.setStatus('reconnecting');
    const epoch = this.epoch;
    const handle = this.resumptionHandle;
    const delay = 500 * 2 ** this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      if (this.closed || epoch !== this.epoch) return;
      void this.openSocket(handle)
        .then(() => {
          if (this.closed || epoch !== this.epoch) return;
          this.reconnectAttempts = 0;
          this.activity.reset();
          this.setMicrophone(!this.paused);
          // No replay/buffering of mic audio. Repeat the active question after recovery.
          if (!this.paused && this.question) this.command('APP_PRESENT');
          else this.setStatus(this.paused ? 'paused' : 'listening');
        })
        .catch(() => {
          if (!this.closed && epoch === this.epoch) this.reconnect(message);
        });
    }, delay);
  }

  private setMicrophone(enabled: boolean): void {
    this.stream?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
    this.worklet?.port.postMessage({ enabled });
  }

  private clearPlayback(): void {
    this.boundary.reset();
    this.player?.clear();
  }

  private detachSocket(): void {
    const socket = this.socket;
    this.socket = undefined;
    if (socket) {
      socket.onmessage = socket.onclose = socket.onerror = socket.onopen = null;
      socket.close();
    }
  }

  private dispose(): void {
    this.closed = true;
    this.ready = false;
    this.epoch++;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    this.cancelOpening?.();
    this.cancelOpening = undefined;
    this.detachSocket();
    if (this.worklet) {
      this.worklet.port.onmessage = null;
      this.worklet.port.close();
      this.worklet.onprocessorerror = null;
    }
    this.worklet?.disconnect();
    this.microphone?.disconnect();
    this.stream?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    this.player?.close();
    if (this.context) {
      this.context.onstatechange = null;
      void this.context.close().catch(() => {});
    }
    this.worklet = undefined;
    this.microphone = undefined;
    this.stream = undefined;
    this.player = undefined;
    this.context = undefined;
    this.question = undefined;
    this.credentials = undefined;
    this.resumptionHandle = undefined;
    this.reconnectAttempts = 0;
    this.speechTurn = 0;
    this.readStory = true;
    this.questionPending = false;
    this.hintPlaying = false;
    this.answersReady = false;
    this.restoreAnswers = false;
    this.commandVersion++;
    this.toolQueue = Promise.resolve();
    this.controls.clear();
    this.reporter.clear();
    this.cancelledCalls.clear();
    this.boundary.reset();
    this.activity.reset();
  }

  private fail(message: string): void {
    this.dispose();
    this.setStatus('disconnected');
    this.callbacks.onError(message);
  }

  private setStatus(status: string): void {
    if (this.status === status) return;
    this.status = status;
    this.callbacks.onStatus(status);
  }
}
