import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
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
  await page.getByLabel('Koreksi soal 1 percobaan 1').selectOption('correct');
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
