import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createLiveToken } from '../server/gemini';
import type { Question } from '../types';

const question: Question = {
  id: 'q1',
  category: 'logika',
  level: 1,
  story: 'Ada dua apel.',
  prompt: 'Berapa apel?',
  expectedAnswer: 'dua',
  alternatives: ['2'],
  hint: { emoji: '🍎', title: 'Hitung', description: 'Satu, lalu satu lagi.' }
};

beforeEach(() => {
  vi.stubEnv('GEMINI_API_KEY', 'server-only-test-key');
  vi.stubEnv('GEMINI_LIVE_MODEL', '');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it('uses the REAL SDK serializer to provision one-use v1beta tokens with server-locked constraints', async () => {
  const fetch = vi.fn(
    async () => new Response(JSON.stringify({ name: 'auth_tokens/test-token' }), { status: 200 })
  );
  vi.stubGlobal('fetch', fetch);
  const before = Date.now();
  const credentials = await createLiveToken([question]);
  expect(credentials).toEqual({
    token: 'auth_tokens/test-token',
    model: 'gemini-3.8-live',
    config: { responseModalities: ['AUDIO'], sessionResumption: {} }
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
  expect(String(url)).toContain('/v1beta/auth_tokens');
  const request = JSON.parse(init.body as string);
  expect(request.uses).toBe(1);
  expect(Date.parse(request.newSessionExpireTime) - before).toBeGreaterThanOrEqual(60_000);
  expect(Date.parse(request.newSessionExpireTime) - before).toBeLessThan(61_000);
  expect(Date.parse(request.expireTime) - before).toBeGreaterThanOrEqual(30 * 60_000);
  const locked = request.bidiGenerateContentSetup;
  expect(locked.model).toBe('models/gemini-3.8-live');
  expect(locked.generationConfig.responseModalities).toEqual(['AUDIO']);
  expect(locked.inputAudioTranscription).toEqual({});
  expect(locked.outputAudioTranscription).toEqual({});
  expect(locked.tools[0].functionDeclarations[0]).toMatchObject({
    name: 'report_answer',
    behavior: 'BLOCKING'
  });
  expect(
    locked.tools[0].functionDeclarations[0].parametersJsonSchema.properties.questionId.enum
  ).toEqual(['q1']);
  expect(request.fieldMask).toContain('model');
  expect(request.fieldMask).toContain('systemInstruction.parts');
  expect(request.fieldMask).toContain('tools');
  expect(request.fieldMask).toContain('generationConfig.responseModalities');
  expect(request.fieldMask).not.toContain('sessionResumption');
  expect(locked.sessionResumption).toBeUndefined();
  expect(JSON.stringify(credentials)).not.toContain('server-only-test-key');
  expect(JSON.stringify(credentials)).not.toContain('dua');
  expect(JSON.stringify(locked)).not.toContain('Ada dua apel.');
});

it('honors GEMINI_LIVE_MODEL and fails explicitly on missing credentials or missing token names', async () => {
  vi.stubEnv('GEMINI_LIVE_MODEL', 'custom-live');
  const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetch);
  await expect(createLiveToken([question])).rejects.toThrow('token');
  expect(
    JSON.parse((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
      .bidiGenerateContentSetup.model
  ).toBe('models/custom-live');
  vi.stubEnv('GEMINI_API_KEY', '');
  await expect(createLiveToken([question])).rejects.toThrow('GEMINI_API_KEY');
});

it('rejects empty/duplicate question sets before contacting Gemini', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  await expect(createLiveToken([])).rejects.toThrow('soal');
  await expect(createLiveToken([question, question])).rejects.toThrow('unik');
  expect(fetch).not.toHaveBeenCalled();
});
