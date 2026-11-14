import { describe, expect, it } from 'vitest';
import { Pcm16Resampler } from '../../../static/audio-worklet.js';
import { MicActivity, PlaybackBoundary, base64ToFloat32, pcm16ToBase64 } from './audio';

describe('actual worklet PCM resampler', () => {
  it.each([8000, 16000, 44100, 48000, 96000])(
    'produces exactly mono 16 kHz from %i Hz across arbitrary worklet blocks',
    (rate) => {
      const input = Float32Array.from(
        { length: rate },
        (_, i) => 0.5 * Math.sin((2 * Math.PI * 440 * i) / rate)
      );
      const whole = new Pcm16Resampler(rate).push(input);
      const streaming = new Pcm16Resampler(rate);
      const chunks: number[] = [];
      for (let i = 0; i < input.length; i += 128)
        chunks.push(...streaming.push(input.subarray(i, i + 128)));
      expect(whole).toHaveLength(16000);
      expect(chunks).toEqual(whole);
      expect(Math.max(...chunks)).toBeLessThanOrEqual(16384);
      expect(Math.min(...chunks)).toBeGreaterThanOrEqual(-16384);
    }
  );

  it('clips safely, uses signed PCM16, averages samples, and discards pre-pause partial input', () => {
    expect(new Pcm16Resampler(16000).push([-2, -1, 0, 1, 2, NaN, Infinity])).toEqual([
      -32768, -32768, 0, 32767, 32767, 0, 0
    ]);
    const resampler = new Pcm16Resampler(48000);
    expect(resampler.push([1, 1])).toEqual([]);
    resampler.reset();
    expect(resampler.push([0, 0, 0])).toEqual([0]);
    expect(resampler.push([1, -1, 0])).toEqual([0]);
  });

  it('rejects invalid sample rates rather than labeling arbitrary audio 16 kHz', () => {
    for (const rate of [0, -1, NaN, Infinity]) expect(() => new Pcm16Resampler(rate)).toThrow();
  });
});

it('decodes little-endian PCM16 with correct sign, full scale, and byte boundaries', () => {
  const bytes = new Uint8Array([0, 128, 255, 127, 0, 0, 255, 255, 0, 64]);
  expect([...base64ToFloat32(pcm16ToBase64(bytes.buffer))]).toEqual([
    -1,
    32767 / 32768,
    0,
    -1 / 32768,
    0.5
  ]);
  expect(() => base64ToFloat32(btoa('a'))).toThrow('PCM16');
  expect(() => base64ToFloat32('%%%')).toThrow();
});

describe('playback/event boundaries', () => {
  it('requires BOTH actual queue drain and server turnComplete, in either order, exactly once', () => {
    for (const completeFirst of [true, false]) {
      const boundary = new PlaybackBoundary();
      boundary.audio();
      if (completeFirst) boundary.complete();
      expect(boundary.takeFinished(!completeFirst)).toBe(false);
      boundary.complete();
      expect(boundary.takeFinished(true)).toBe(true);
      expect(boundary.takeFinished(true)).toBe(false);
      boundary.audio();
      expect(boundary.takeFinished(true)).toBe(false);
      boundary.complete();
      expect(boundary.takeFinished(true)).toBe(true);
    }
  });

  it('never starts a silence timer on a text-only, interrupted, or paused turn', () => {
    const boundary = new PlaybackBoundary();
    boundary.complete();
    expect(boundary.takeFinished(true)).toBe(false);
    boundary.audio();
    boundary.reset();
    boundary.complete();
    expect(boundary.takeFinished(true)).toBe(false);
  });

  it('mic speech onset uses sustained ENERGY, not transcript arrivals; tolerates natural pauses', () => {
    const activity = new MicActivity();
    expect(activity.update(0.001, 1000)).toBeUndefined();
    expect(activity.update(0.05, 20)).toBeUndefined();
    expect(activity.update(0.05, 20)).toBe('start');
    expect(activity.update(0.05, 100)).toBeUndefined();
    expect(activity.update(0, 580)).toBeUndefined();
    expect(activity.update(0.05, 20)).toBeUndefined();
    expect(activity.update(0, 600)).toBe('end');
    activity.reset();
    expect(activity.active).toBe(false);
  });
});
