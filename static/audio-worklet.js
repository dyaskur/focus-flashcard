/** Streaming area-average resampler; state survives the worklet's 128-frame blocks. */
export class Pcm16Resampler {
  constructor(inputRate, outputRate = 16000) {
    if (
      !Number.isFinite(inputRate) ||
      !Number.isFinite(outputRate) ||
      inputRate <= 0 ||
      outputRate <= 0
    ) {
      throw new Error('Unsupported audio sample rate');
    }
    this.ratio = inputRate / outputRate;
    this.reset();
  }

  reset() {
    this.sum = 0;
    this.weight = 0;
  }

  push(input) {
    const output = [];
    for (const value of input) {
      const sample = Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
      let remaining = 1;
      while (remaining > 1e-10) {
        const take = Math.min(remaining, this.ratio - this.weight);
        this.sum += sample * take;
        this.weight += take;
        remaining -= take;
        if (this.weight >= this.ratio - 1e-10) {
          const average = Math.max(-1, Math.min(1, this.sum / this.ratio));
          output.push(Math.round(average * (average < 0 ? 32768 : 32767)));
          this.sum = 0;
          this.weight = 0;
        }
      }
    }
    return output;
  }
}

// The guard lets the exact production DSP be tested in Node without browser globals.
if (typeof AudioWorkletProcessor !== 'undefined') {
  class MicrophoneProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
      this.resampler = new Pcm16Resampler(sampleRate);
      this.enabled = false;
      this.frame = new ArrayBuffer(640); // 20 ms, mono PCM16 at 16 kHz.
      this.view = new DataView(this.frame);
      this.offset = 0;
      this.energy = 0;
      this.port.onmessage = ({ data }) => {
        this.enabled = data.enabled === true;
        this.resampler.reset();
        this.offset = 0;
        this.energy = 0;
      };
    }

    process(inputs) {
      const channels = inputs[0];
      if (!this.enabled || !channels?.length) return true;
      const mono = new Float32Array(channels[0].length);
      for (const channel of channels) {
        for (let i = 0; i < mono.length; i++) mono[i] += channel[i] / channels.length;
      }
      for (const sample of this.resampler.push(mono)) {
        this.view.setInt16(this.offset * 2, sample, true);
        this.energy += (sample / 32768) ** 2;
        this.offset++;
        if (this.offset === 320) {
          this.port.postMessage({ pcm: this.frame, rms: Math.sqrt(this.energy / 320) }, [
            this.frame
          ]);
          this.frame = new ArrayBuffer(640);
          this.view = new DataView(this.frame);
          this.offset = 0;
          this.energy = 0;
        }
      }
      // Outputs remain silent: the microphone must never be played through the speakers.
      return true;
    }
  }
  registerProcessor('pcm16-microphone', MicrophoneProcessor);
}
