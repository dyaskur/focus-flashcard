export function pcm16ToBase64(pcm: ArrayBuffer): string {
  const bytes = new Uint8Array(pcm);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
}

export function base64ToFloat32(data: string): Float32Array<ArrayBuffer> {
  const binary = atob(data);
  if (binary.length % 2 !== 0) throw new Error('Audio PCM16 tidak lengkap.');
  const samples = new Float32Array(binary.length / 2);
  for (let i = 0; i < samples.length; i++) {
    const value = binary.charCodeAt(i * 2) | (binary.charCodeAt(i * 2 + 1) << 8);
    samples[i] = (value >= 0x8000 ? value - 0x10000 : value) / 32768;
  }
  return samples;
}

/** The server's turnComplete is not the speaker's playback-complete event. */
export class PlaybackBoundary {
  private heardAudio = false;
  private turnComplete = false;
  private notified = false;

  reset(): void {
    this.heardAudio = false;
    this.turnComplete = false;
    this.notified = false;
  }

  audio(): void {
    if (this.turnComplete) this.reset();
    this.heardAudio = true;
  }

  complete(): void {
    this.turnComplete = true;
  }

  takeFinished(queueEmpty: boolean): boolean {
    if (!queueEmpty || !this.turnComplete || !this.heardAudio || this.notified) return false;
    this.notified = true;
    return true;
  }
}

/** Local onset detection only; Gemini's automatic VAD still segments the audio. */
export class MicActivity {
  active = false;
  private loudMs = 0;
  private quietMs = 0;

  update(rms: number, durationMs: number): 'start' | 'end' | undefined {
    if (!Number.isFinite(rms) || durationMs <= 0) return;
    if (rms >= 0.015) {
      this.quietMs = 0;
      this.loudMs += durationMs;
      if (!this.active && this.loudMs >= 40) {
        this.active = true;
        return 'start';
      }
    } else {
      this.loudMs = 0;
      this.quietMs += durationMs;
      if (this.active && this.quietMs >= 600) {
        this.active = false;
        return 'end';
      }
    }
  }

  reset(): void {
    this.active = false;
    this.loudMs = 0;
    this.quietMs = 0;
  }
}

export class PcmPlayer {
  private sources = new Set<AudioBufferSourceNode>();
  private nextTime = 0;
  private output: GainNode;

  constructor(
    private context: AudioContext,
    private onDrained: () => void
  ) {
    this.output = context.createGain();
    this.output.connect(context.destination);
  }

  get empty(): boolean {
    return this.sources.size === 0;
  }

  enqueue(data: string): boolean {
    const samples = base64ToFloat32(data);
    if (!samples.length) return false;
    // Web Audio resamples the native 24 kHz response to the actual output device rate.
    const buffer = this.context.createBuffer(1, samples.length, 24000);
    buffer.copyToChannel(samples, 0);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.output);
    source.onended = () => {
      source.disconnect();
      this.sources.delete(source);
      if (this.empty) this.onDrained();
    };
    this.sources.add(source);
    // A small initial jitter buffer absorbs uneven packet delivery without delaying every chunk.
    const now = this.context.currentTime;
    const startTime = this.nextTime > now ? this.nextTime : now + 0.12;
    this.nextTime = startTime + buffer.duration;
    source.start(startTime);
    return true;
  }

  mute(muted: boolean): void {
    this.output.gain.setValueAtTime(muted ? 0 : 1, this.context.currentTime);
  }

  clear(): void {
    for (const source of this.sources) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        /* A failed start must not prevent the remaining cleanup. */
      }
      source.disconnect();
    }
    this.sources.clear();
    this.nextTime = 0;
  }

  close(): void {
    this.mute(true);
    this.clear();
    this.output.disconnect();
  }
}
