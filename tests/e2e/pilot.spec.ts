import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';

const artifacts = '.amp/in/artifacts';
async function register(page: Page) {
  await page.goto('/masuk?mode=register');
  await page.getByLabel('Nama pendamping').fill('Pendamping Pilot');
  await page.getByLabel('Email', { exact: true }).fill(`${randomUUID()}@example.test`);
  await page.getByLabel('Kata sandi').fill('Pilot-test-password-123');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Buat akun pendamping' }).click();
  await expect(page).toHaveURL(/\/profil/);
  await page.getByLabel('Nama panggilan anak').fill('Ammar');
  await page.getByLabel('Usia').fill('5');
  await page.getByRole('button', { name: 'Simpan & mulai belajar' }).click();
  await expect(page).toHaveURL(/\/beranda/);
}
async function snapshot(page: Page, name: string) {
  await mkdir(artifacts, { recursive: true });
  await page.screenshot({ path: `${artifacts}/${name}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
test('bilingual caregiver practice preserves attempts through pause, correction, mode switch, AI advance, history and replay', async ({
  page
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await register(page);
  await expect(page.getByRole('heading', { name: 'Cerita kecil, banyak penemuan.' })).toBeVisible();
  await page.getByLabel('Bahasa latihan anak').selectOption('en');
  await page.getByRole('button', { name: '1 kartu', exact: true }).click();
  await page.getByRole('button', { name: 'Periksa susunan sesi' }).click();
  await expect(page.getByText('1 kartu · 2 pertanyaan')).toBeVisible();
  await snapshot(page, 'pilot-setup-desktop');
  await page.getByRole('button', { name: /^Mulai sesi/ }).click();
  await expect(page).toHaveURL(/\/latihan\//);
  const id = page.url().split('/').pop()!;
  await expect(page.getByTestId('pilot-question')).toHaveAttribute('lang', 'en');
  await page.getByLabel('Bahasa antarmuka / Interface language').selectOption('en');
  await page.getByRole('button', { name: 'Start reading', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await snapshot(page, 'pilot-manual-mobile');
  await page.getByRole('button', { name: 'Unclear', exact: true }).click();
  await page.getByRole('button', { name: 'Unclear', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Practice paused.' })).toBeVisible();
  await snapshot(page, 'pilot-paused-mobile');
  await page.getByRole('button', { name: 'Resume session', exact: true }).click();
  for (let i = 1; i <= 3; i++) {
    await page.getByRole('button', { name: 'Incorrect', exact: true }).click();
    await expect(page.getByText(`${i}/3 incorrect attempts`, { exact: false })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Incorrect', exact: true })).toBeDisabled();
  await snapshot(page, 'pilot-third-attempt-mobile');
  await page.getByRole('button', { name: /^Continue →/ }).click();
  await expect(page.getByText('QUESTION 2/2', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start reading', exact: true })).toBeVisible();
  await expect(page.getByTestId('pilot-question')).toHaveAttribute('lang', 'en');
  await page.getByLabel('Switch mode · keep progress').selectOption('ai');
  await page.getByLabel('I am supervising and permit Gemini to process the audio.').check();
  await page.getByRole('button', { name: 'Enable microphone & start' }).click();
  await expect(page.getByText('TEST ADAPTER', { exact: false })).toBeVisible();
  await page.evaluate(() =>
    window.dispatchEvent(new CustomEvent('tutor:test-answer', { detail: {} }))
  );
  await expect(page.getByRole('heading', { name: 'Session complete.' })).toBeVisible();
  await snapshot(page, 'pilot-summary-mobile');
  const saved = await (await page.request.get(`/api/pilot/${id}`)).json();
  expect(saved.attempts).toHaveLength(6);
  expect(saved.attempts.map((a: { mode: string }) => a.mode)).toEqual([
    'manual',
    'manual',
    'manual',
    'manual',
    'manual',
    'ai'
  ]);
  expect(saved.events.filter((e: { type: string }) => e.type === 'hint')).toHaveLength(2);
  expect(saved.status).toBe('completed');
  await page.getByRole('link', { name: 'Progress reports' }).click();
  await page.getByLabel('Exercise language').selectOption('en');
  await page.setViewportSize({ width: 1280, height: 1000 });
  await snapshot(page, 'pilot-report-desktop');
  await page.getByRole('button', { name: 'History & corrections', exact: true }).click();
  await page.locator('.history-list > details > summary').first().click();
  const reference = page.locator('.pilot-question-result').first();
  await reference.locator('summary').click();
  await reference.locator('select').last().selectOption('correct');
  await expect(reference.getByText(/Original: Not yet successful → Correct/)).toBeVisible();
  await page.getByRole('button', { name: 'Practice again', exact: true }).click();
  await expect(page).toHaveURL(/\/latihan\//);
  await expect(page).not.toHaveURL(new RegExp(id));
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  const next = await (await page.request.get(`/api/pilot/${page.url().split('/').pop()}`)).json();
  expect(next.attempts).toEqual([]);
  expect((await (await page.request.get(`/api/pilot/${id}`)).json()).attempts).toHaveLength(6);
  expect(errors).toEqual([]);
});

test('manual practice never requests a microphone and unseen shortage is warned before starting', async ({
  page
}) => {
  await register(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: () => {
        throw new Error('Manual mode must not use microphone');
      }
    });
  });
  await page.reload();
  await page.getByRole('button', { name: '5 kartu', exact: true }).click();
  await page.getByRole('button', { name: 'Periksa susunan sesi' }).click();
  await page.getByRole('button', { name: /^Mulai sesi/ }).click();
  await page.getByRole('button', { name: 'Mulai membacakan' }).click();
  const id = page.url().split('/').pop()!;
  await page.route(`**/api/pilot/${id}/action`, async (route) => {
    if (route.request().postDataJSON().action === 'answer') {
      await route.fetch();
      await route.abort('failed');
      await page.unroute(`**/api/pilot/${id}/action`);
    } else await route.continue();
  });
  for (let n = 0; n < 10; n++) {
    await page.getByRole('button', { name: 'Benar', exact: true }).click();
    await expect(page.getByRole('button', { name: /^Lanjutkan →/ })).toBeEnabled();
    await page.getByRole('button', { name: /^Lanjutkan →/ }).click();
  }
  await expect(page.getByRole('heading', { name: 'Sesi selesai.' })).toBeVisible();
  const saved = await (await page.request.get(`/api/pilot/${id}`)).json();
  expect(saved.attempts).toHaveLength(10);
  expect(
    saved.attempts.every((a: { responseTimeMs: number | null }) => a.responseTimeMs === null)
  ).toBe(true);
  await page.goto('/beranda');
  await page.getByRole('button', { name: 'Periksa susunan sesi' }).click();
  await expect(
    page.getByText('0 belum pernah tuntas + 3 pernah dilatih dalam bahasa ini.')
  ).toBeVisible();
  await expect(page.getByText('Kartu baru tidak cukup.', { exact: false })).toBeVisible();
  await snapshot(page, 'pilot-unseen-warning');
  await page.getByRole('button', { name: /^Mulai sesi/ }).click();
  await expect(page.getByRole('button', { name: 'Mulai membacakan' })).toBeVisible();
});

test('silence gives two invitations and a skip offer, then pauses without a wrong attempt', async ({
  page
}) => {
  await register(page);
  await page.clock.install();
  await page.getByRole('combobox', { name: 'Mode latihan', exact: true }).selectOption('ai');
  await page.getByRole('button', { name: '1 kartu', exact: true }).click();
  await page.getByRole('button', { name: 'Periksa susunan sesi' }).click();
  await page.getByRole('button', { name: /^Mulai sesi/ }).click();
  await page.getByLabel('Saya mendampingi dan mengizinkan pemrosesan suara oleh Gemini.').check();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByRole('button', { name: 'Aktifkan mikrofon & mulai' }).click();
  await expect(page.getByText('AI berbicara…', { exact: true })).toBeVisible();
  await page.clock.runFor(100);
  await expect(page.getByText('Mendengarkan jawaban.', { exact: true })).toBeVisible();
  for (let stage = 1; stage <= 3; stage++) {
    await page.clock.runFor(7000);
    await expect(page.getByText('AI berbicara…', { exact: true })).toBeVisible();
    await page.clock.runFor(100);
    await expect(page.getByText('Mendengarkan jawaban.', { exact: true })).toBeVisible();
  }
  await expect(page.getByText('Lewati pertanyaan ini?', { exact: true })).toBeVisible();
  await page.clock.runFor(7000);
  await expect(page.getByRole('heading', { name: 'Latihan dijeda.' })).toBeVisible();
  const saved = await (await page.request.get(`/api/pilot/${page.url().split('/').pop()}`)).json();
  expect(saved.attempts).toEqual([]);
  expect(saved.events.filter((e: { type: string }) => e.type === 'hint')).toHaveLength(1);
  expect(saved.status).toBe('paused');
});
