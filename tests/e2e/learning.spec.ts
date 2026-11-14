import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
const password = 'Test-password-strong-123';
async function register(page: Page) {
  const email = `${randomUUID()}@example.test`;
  await page.goto('/masuk?mode=register');
  await page.screenshot({ path: test.info().outputPath('registration.png'), fullPage: true });
  await page.getByLabel('Nama pendamping').fill('Bunda Uji');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Kata sandi').fill(password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Buat akun pendamping' }).click();
  await expect(page).toHaveURL(/\/profil/);
  await page.screenshot({ path: test.info().outputPath('profile.png'), fullPage: true });
  await page.getByLabel('Nama panggilan anak').fill('Ammar');
  await page.getByLabel('Usia').fill('5');
  await page.getByRole('button', { name: 'Simpan & mulai belajar' }).click();
  await expect(page).toHaveURL(/\/beranda/);
  await page.goto('/beranda?legacy=1');
  return email;
}
async function answer(page: Page, data = {}) {
  await page.evaluate(
    (detail) => window.dispatchEvent(new CustomEvent('tutor:test-answer', { detail })),
    data
  );
}
test('parent registers, personalizes, learns, gets hints, persists and corrects results', async ({
  page,
  browser
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const email = await register(page);
  await expect(page.getByRole('heading', { name: /Halo, Ammar/ })).toBeVisible();
  await page.getByRole('button', { name: /PIKIR & TEMUKAN/ }).click();
  await page.getByRole('button', { name: 'Bintang 2, Mulai terbiasa' }).click();
  await page.getByRole('button', { name: 'Mulai petualangan' }).click();
  await expect(page).toHaveURL(/\/belajar\//);
  const sessionId = page.url().split('/').pop()!;
  const anonymous = await browser.newContext();
  const unauthorized = await anonymous.request.get(
    `http://localhost:5174/api/sessions/${sessionId}`
  );
  expect(unauthorized.status()).toBe(401);
  await anonymous.close();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Aktifkan mikrofon & mulai' }).click();
  await expect(page.getByTestId('question')).toBeVisible();
  await expect(page.getByText('Aku mendengarkan. Jawab dengan suaramu.')).toBeVisible();
  await expect(page.getByTestId('hint')).not.toBeVisible();
  await page.screenshot({ path: test.info().outputPath('learning.png'), fullPage: true });
  await page.getByRole('button', { name: 'Jeda', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Istirahat dulu, tidak apa-apa.' })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('paused.png'), fullPage: true });
  await page.getByRole('button', { name: 'Lanjutkan cerita' }).click();
  await expect(page.getByTestId('hint')).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: test.info().outputPath('learning-hint.png'), fullPage: true });
  await answer(page, { answerText: 'tidak terdengar', verdict: 'unclear', confidence: 0.2 });
  await expect(
    page.getByText('Aku belum mendengar dengan jelas. Boleh ulangi pelan-pelan?')
  ).toBeVisible();
  await answer(page);
  await expect(page.getByRole('button', { name: 'Cerita berikutnya' })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('feedback.png'), fullPage: true });
  await page.getByRole('button', { name: 'Cerita berikutnya' }).click();
  await expect(page.getByText('CERITA 2 DARI 5')).toBeVisible();
  await expect(page.getByText('Aku mendengarkan. Jawab dengan suaramu.')).toBeVisible();
  await answer(page, { answerText: 'Jawaban sengaja salah', verdict: 'incorrect' });
  await expect(page.getByTestId('hint')).toBeVisible();
  await answer(page);
  await expect(page.getByRole('button', { name: 'Cerita berikutnya' })).toBeVisible();
  await page.getByRole('button', { name: 'Cerita berikutnya' }).click();
  for (let i = 3; i <= 5; i++) {
    await expect(page.getByText(`CERITA ${i} DARI 5`)).toBeVisible();
    await expect(page.getByText('Aku mendengarkan. Jawab dengan suaramu.')).toBeVisible();
    if (i === 4) await page.getByRole('button', { name: 'Lewati', exact: true }).click();
    else {
      await answer(page);
      await expect(page.getByRole('button', { name: 'Cerita berikutnya' })).toBeVisible();
      await page.getByRole('button', { name: 'Cerita berikutnya' }).click();
    }
  }
  await expect(page.getByRole('heading', { name: 'Kamu sudah berusaha hebat!' })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('completed.png'), fullPage: true });
  await page.getByRole('link', { name: 'Lihat bersama pendamping' }).click();
  await expect(page.getByTestId('sessions-count')).toHaveText('1');
  await expect(page.getByTestId('accuracy')).toHaveText('67%');
  await expect(page.locator('canvas')).toHaveCount(5);
  await expect(page.locator('canvas').first()).not.toHaveAttribute('width', '300');
  await page.screenshot({ path: test.info().outputPath('dashboard.png'), fullPage: true });
  await page.getByRole('link', { name: 'Riwayat & koreksi' }).click();
  await page.locator('summary').first().click();
  await expect(page.getByText('Soal 1 · Percobaan 1')).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('history.png'), fullPage: true });
  let releaseCorrection!: () => void;
  const correctionGate = new Promise<void>((resolve) => {
    releaseCorrection = resolve;
  });
  await page.route(`**/api/sessions/${sessionId}/correct`, async (route) => {
    await correctionGate;
    await route.continue();
  });
  const correction = page.getByLabel('Koreksi soal 1 percobaan 1');
  await correction.selectOption('correct');
  await expect(correction).toBeDisabled();
  releaseCorrection();
  await expect(correction).toBeEnabled();
  await expect(page.getByText(/Dikoreksi pendamping/)).toBeVisible();
  await page.getByRole('link', { name: 'Ringkasan belajar' }).click();
  await expect(page.getByTestId('accuracy')).toHaveText('75%');
  await page.getByRole('link', { name: 'Ruang belajar', exact: true }).click();
  await page.getByRole('switch').click();
  await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  await page.screenshot({ path: test.info().outputPath('sensory.png'), fullPage: true });
  await page.reload();
  await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  await page.goto('/profil');
  await page.getByRole('button', { name: 'Keluar akun' }).click();
  await page.goto('/masuk');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Kata sandi').fill(password);
  await page.getByRole('button', { name: 'Masuk ke ruang belajar' }).click();
  await expect(page).toHaveURL(/\/beranda/);
  expect(errors).toEqual([]);
});
test('new sessions reset consent, cursor, feedback, and attempts without losing previous results', async ({
  page
}) => {
  await register(page);
  await page.route('**/api/sessions', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{' })
  );
  await page.getByRole('button', { name: 'Mulai petualangan' }).click();
  await expect(page.getByText('Respons server tidak valid.', { exact: false })).toBeVisible();
  await expect(page).toHaveURL(/\/beranda\?legacy=1/);
  await page.unroute('**/api/sessions');
  await page.getByRole('button', { name: /PIKIR & TEMUKAN/ }).click();
  await page.getByRole('button', { name: 'Bintang 2, Mulai terbiasa' }).click();
  await page.getByRole('button', { name: 'Mulai petualangan' }).click();
  await expect(page).toHaveURL(/\/belajar\//);
  const oldUrl = page.url();
  const oldId = oldUrl.split('/').pop()!;
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Aktifkan mikrofon & mulai' }).click();
  await expect(page.getByText('Aku mendengarkan. Jawab dengan suaramu.')).toBeVisible();
  await answer(page);
  await page.getByRole('button', { name: 'Cerita berikutnya' }).click();
  await expect(page.getByText('CERITA 2 DARI 5')).toBeVisible();
  await expect(page.getByText('Aku mendengarkan. Jawab dengan suaramu.')).toBeVisible();
  await answer(page);
  await expect(page.getByRole('button', { name: 'Cerita berikutnya' })).toBeVisible();
  await page.getByRole('button', { name: 'Sembunyikan teks cerita' }).click();
  // A reconnect to the SAME answered session must still preserve its saved answer.
  await page.reload();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Aktifkan mikrofon & mulai' }).click();
  await expect(page.getByText('Jawabanmu sudah tersimpan. Yuk, lanjutkan.')).toBeVisible();
  await page.getByRole('button', { name: 'Sembunyikan teks cerita' }).click();
  await page.getByRole('button', { name: 'Mulai sesi baru', exact: true }).click();
  await expect(page).not.toHaveURL(oldUrl);
  await expect(page.getByRole('heading', { name: 'Duduk nyaman. Pasang telinga.' })).toBeVisible();
  await expect(page.getByText('CERITA 1 DARI 5')).toBeVisible();
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  await expect(page.getByRole('button', { name: 'Aktifkan mikrofon & mulai' })).toBeDisabled();
  await expect(page.getByText('Jawabanmu sudah tersimpan. Yuk, lanjutkan.')).not.toBeVisible();
  const id = page.url().split('/').pop()!;
  const details = await (await page.request.get(`/api/sessions/${id}`)).json();
  expect(details.session).toMatchObject({
    cursor: 0,
    status: 'active',
    category: 'logika',
    level: 2
  });
  expect(details.attempts).toHaveLength(0);
  const previous = await (await page.request.get(`/api/sessions/${oldId}`)).json();
  expect(previous.session.status).toBe('stopped');
  expect(previous.attempts).toHaveLength(2);
  await page.screenshot({
    path: test.info().outputPath('new-session-desktop.png'),
    fullPage: true
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: test.info().outputPath('new-session-mobile.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Aktifkan mikrofon & mulai' }).click();
  await expect(page.getByTestId('question')).toBeVisible();
  await expect(page.getByText('Aku mendengarkan. Jawab dengan suaramu.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sembunyikan teks cerita' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cerita berikutnya' })).not.toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('new-session-reading-mobile.png'),
    fullPage: true
  });
  await answer(page);
  await expect(page.getByRole('button', { name: 'Cerita berikutnya' })).toBeVisible();
  expect((await (await page.request.get(`/api/sessions/${id}`)).json()).attempts).toHaveLength(1);
});

test('mobile layout, sensory mode, and unauthenticated write protection', async ({
  page,
  request
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('switch')).toBeEnabled();
  await page.screenshot({ path: test.info().outputPath('mobile.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
  await page.getByRole('switch').click();
  await expect(page.locator('html')).toHaveClass(/sensory/);
  await expect(page.locator('.category-art').first()).toBeHidden();
  const rejected = await request.post('/api/sessions', {
    headers: { Origin: 'http://localhost:5174' },
    data: {}
  });
  expect(rejected.status()).toBe(401);
  const csrf = await request.post('/api/sessions', {
    headers: { Origin: 'https://attacker.example' },
    data: {}
  });
  expect(csrf.status()).toBe(403);
  await register(page);
  const reports = page.getByRole('link', { name: 'Riwayat & laporan' });
  await expect(reports).toBeVisible();
  await reports.scrollIntoViewIfNeeded();
  await expect(reports).toBeInViewport();
  await mkdir('.amp/in/artifacts', { recursive: true });
  await page.screenshot({ path: '.amp/in/artifacts/legacy-mobile-reports.png', fullPage: true });
  await reports.click();
  await expect(page).toHaveURL(/\/pendamping\?legacy=1/);
  await page.goto('/offline.html');
  await expect(page.getByText('Koneksi internet belum tersedia.', { exact: false })).toBeVisible();
  await page.screenshot({ path: '.amp/in/artifacts/offline-contrast.png', fullPage: true });
  const contrast = await page
    .locator('p')
    .first()
    .evaluate((p) => {
      const luminance = (color: string) => {
        const channels = color
          .match(/\d+/g)!
          .slice(0, 3)
          .map(Number)
          .map((v) => {
            const c = v / 255;
            return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          });
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      };
      const text = luminance(getComputedStyle(p).color);
      const background = luminance(getComputedStyle(document.body).backgroundColor);
      return (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05);
    });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
});

test('legacy answer saves block skipping and obsolete pending answers do not block reconnect', async ({
  page
}) => {
  await register(page);
  await page.getByRole('button', { name: 'Mulai petualangan' }).click();
  await expect(page).toHaveURL(/\/belajar\//);
  const id = page.url().split('/').pop()!;
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Aktifkan mikrofon & mulai' }).click();
  await expect(page.getByText('Aku mendengarkan. Jawab dengan suaramu.')).toBeVisible();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**/api/sessions/${id}/attempts`, async (route) => {
    await gate;
    await route.continue();
  });
  await answer(page);
  await expect(page.getByRole('button', { name: 'Lewati', exact: true })).toBeDisabled();
  release();
  await expect(page.getByRole('button', { name: 'Cerita berikutnya' })).toBeEnabled();
  await page.unroute(`**/api/sessions/${id}/attempts`);
  await page.getByRole('button', { name: 'Cerita berikutnya' }).click();
  await expect(page.getByText('CERITA 2 DARI 5')).toBeVisible();
  await expect(page.getByText('Aku mendengarkan. Jawab dengan suaramu.')).toBeVisible();
  await page.route(`**/api/sessions/${id}/attempts`, (route) => route.abort('failed'));
  await answer(page);
  await expect(page.getByRole('heading', { name: 'Kita coba sambungkan lagi.' })).toBeVisible();
  await page.unroute(`**/api/sessions/${id}/attempts`);
  const saved = await (await page.request.get(`/api/sessions/${id}`)).json();
  const headers = { Origin: 'http://localhost:5174' };
  expect(
    (
      await page.request.post(`/api/sessions/${id}/attempts`, {
        headers,
        data: {
          eventId: randomUUID(),
          questionId: saved.questions[1].id,
          answerText: '',
          verdict: 'skipped',
          confidence: 1,
          feedbackReason: '',
          responseTimeMs: null
        }
      })
    ).ok()
  ).toBe(true);
  expect(
    (
      await page.request.post(`/api/sessions/${id}/action`, { headers, data: { action: 'next' } })
    ).ok()
  ).toBe(true);
  await page.getByRole('button', { name: 'Sambungkan kembali', exact: true }).click();
  await expect(page.getByText('CERITA 3 DARI 5')).toBeVisible();
  await expect(page.getByText('Aku mendengarkan. Jawab dengan suaramu.')).toBeVisible();
  await answer(page);
  await expect(page.getByRole('button', { name: 'Cerita berikutnya' })).toBeEnabled();
});

test('legacy leaving during delayed session refresh cannot open a tutor afterward', async ({
  page
}) => {
  await register(page);
  await page.getByRole('button', { name: 'Mulai petualangan' }).click();
  await expect(page).toHaveURL(/\/belajar\//);
  const id = page.url().split('/').pop()!;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**/api/sessions/${id}`, async (route) => {
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
  });
  let tokens = 0;
  page.on('request', (request) => {
    if (request.url().endsWith(`/sessions/${id}/token`)) tokens++;
  });
  await page.getByRole('checkbox').check();
  const refreshing = page.waitForRequest((request) =>
    request.url().endsWith(`/api/sessions/${id}`)
  );
  await page.getByRole('button', { name: 'Aktifkan mikrofon & mulai' }).click();
  await refreshing;
  await page.getByRole('link', { name: 'Fokus, Dengar, dan Pikir, beranda' }).click();
  await expect(page).toHaveURL(/\/beranda/);
  release();
  await page.waitForLoadState('networkidle');
  expect(tokens).toBe(0);
});

test('voice credentials require session ownership, active state, and rate limits', async ({
  page,
  browser
}) => {
  await register(page);
  await page.getByRole('button', { name: 'Mulai petualangan' }).click();
  await expect(page).toHaveURL(/\/belajar\//);
  const id = page.url().split('/').pop()!;
  const context = page.context();
  const post = (action: string, data = {}) =>
    context.request.post(`/api/sessions/${id}/${action}`, {
      headers: { Origin: 'http://localhost:5174' },
      data
    });
  const details = await (await context.request.get(`/api/sessions/${id}`)).json();
  const outsider = await browser.newContext({ baseURL: 'http://localhost:5174' });
  const otherPage = await outsider.newPage();
  await register(otherPage);
  expect((await outsider.request.get(`/api/sessions/${id}`)).status()).toBe(404);
  expect(
    (
      await outsider.request.post(`/api/sessions/${id}/token`, {
        headers: { Origin: 'http://localhost:5174' },
        data: {}
      })
    ).status()
  ).toBe(404);
  expect(
    (
      await outsider.request.post(`/api/children/${details.child.id}`, {
        headers: { Origin: 'http://localhost:5174' },
        data: { sensoryMode: true }
      })
    ).status()
  ).toBe(404);
  await outsider.close();
  await post('action', { action: 'pause' });
  expect((await post('token')).status()).toBe(409);
  await post('action', { action: 'resume' });
  for (let i = 0; i < 9; i++) {
    const token = await post('token');
    expect(token.status()).toBe(200);
    expect(await token.json()).toEqual({ test: true });
  }
  expect((await post('token')).status()).toBe(429);
  expect((await context.request.get('/pendamping?child=not-a-uuid')).status()).toBe(400);
  expect((await context.request.get('/pendamping?from=2026-99-01')).status()).toBe(400);
});
