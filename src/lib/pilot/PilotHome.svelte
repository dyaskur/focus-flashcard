<script lang="ts">
  import { getContext } from 'svelte';
  import { goto } from '$app/navigation';
  import type { LearningStores } from '$lib/stores';
  import { api } from '$lib/api';
  import type { Category } from '$lib/types';
  import type { PilotCard, Language, PracticeMode, PracticeSession } from './types';
  let { cards, sessions }: { cards: PilotCard[]; sessions: PracticeSession[] } = $props();
  const { profile, uiLanguage } = getContext<LearningStores>('learning');
  const t = (id: string, en: string) => ($uiLanguage === 'en' ? en : id);
  let category = $state<Category>('mendengar');
  let level = $state(1);
  let language = $state<Language>('id');
  let mode = $state<PracticeMode>('manual');
  let count = $state(3);
  let selection = $state<'new' | 'random'>('new');
  let busy = $state(false);
  let message = $state('');
  let composition = $state<{ oldCount: number; questionCount: number; count: number } | null>(null);
  const available = $derived(cards.filter((c) => c.category === category && c.level === level));
  const settings = $derived({
    childId: $profile?.id,
    category,
    level,
    language,
    mode,
    count,
    selection
  });
  const validCount = $derived(Number.isInteger(count) && count >= 1 && count <= available.length);
  $effect(() => {
    void settings;
    composition = null;
    if (settings.childId && validCount) void preview();
  });
  async function preview() {
    message = '';
    const requested = JSON.stringify(settings);
    try {
      const result = await api<{ oldCount: number; questionCount: number; count: number }>(
        'pilot/preview',
        settings
      );
      if (requested === JSON.stringify(settings)) composition = result;
    } catch (e) {
      if (requested === JSON.stringify(settings)) message = (e as Error).message;
    }
  }
  async function start() {
    busy = true;
    message = '';
    try {
      const session = await api<PracticeSession>('pilot/sessions', {
        ...settings,
        confirmed: true
      });
      await goto(`/latihan/${session.id}`);
    } catch (e) {
      message = (e as Error).message;
    } finally {
      busy = false;
    }
  }
</script>

<div class="page-width inner-page pilot">
  <div class="section-heading">
    <div>
      <span class="page-eyebrow">FLASHCARD PILOT · 20 {t('KARTU', 'CARDS')}</span>
      <h1>{t('Cerita kecil, banyak penemuan.', 'Small stories, new discoveries.')}</h1>
      <p>
        {t(
          `Latihan bersama ${$profile?.name ?? 'si kecil'}. Pendamping memegang HP; anak cukup mendengar dan menjawab.`,
          `Practice with ${$profile?.name ?? 'your child'}. The caregiver holds the phone; the child listens and answers.`
        )}
      </p>
    </div>
    <a class="button secondary" href="/pendamping"
      >{t('Riwayat & laporan', 'History & reports')} →</a
    >
  </div>
  <div class="pilot-home-grid">
    <section class="form-card">
      <fieldset class="pilot-mode-choice" disabled={busy}>
        <legend>{t('Siapa yang membacakan?', 'Who reads the story?')}</legend>
        <label class:chosen={mode === 'manual'}>
          <input type="radio" name="practice-mode" value="manual" bind:group={mode} />
          <span
            ><strong>{t('Pendamping', 'Caregiver')}</strong><small
              >{t('Tanpa mikrofon', 'No microphone')}</small
            ></span
          >
        </label>
        <label class:chosen={mode === 'ai'}>
          <input type="radio" name="practice-mode" value="ai" bind:group={mode} />
          <span
            ><strong>Gemini Live</strong><small>{t('Bicara dengan AI', 'Talk with AI')}</small
            ></span
          >
        </label>
      </fieldset>
      <div class="pilot-start-summary" role="status">
        <strong
          >{composition
            ? `${composition.count} ${t('kartu', 'cards')} · ${composition.questionCount} ${t('pertanyaan', 'questions')}`
            : validCount
              ? t('Menyiapkan kartu…', 'Preparing cards…')
              : t('Periksa jumlah kartu.', 'Check the card count.')}</strong
        >
        <p>
          {category === 'mendengar' ? t('Mendengar', 'Listening') : t('Logika', 'Reasoning')} · Level
          {level} · {language === 'id' ? 'Indonesia' : 'English'}
        </p>
      </div>
      {#if composition && selection === 'new' && composition.oldCount}<div
          class="pilot-notice"
          role="status"
        >
          <p>
            {composition.count - composition.oldCount}
            {t('belum pernah tuntas', 'not completed before')} + {composition.oldCount}
            {t('pernah dilatih dalam bahasa ini', 'previously practiced in this language')}.
          </p>
          <p>
            {t(
              'Kartu baru tidak cukup. Sisanya memakai kartu yang paling lama tidak dilatih. Lanjutkan atau ubah jumlah.',
              'Not enough unseen cards. The rest are the least recently practiced. Continue or change the count.'
            )}
          </p>
        </div>{/if}
      <button class="button primary full mt-5" disabled={busy || !composition} onclick={start}
        >{busy ? t('Memulai…', 'Starting…') : t('Mulai sesi', 'Start session')} →</button
      >
      {#if message}<p class="error-text" role="alert">
          {message}
          <button class="text-toggle" onclick={preview}>{t('Coba lagi', 'Try again')}</button>
        </p>{/if}
      <details class="pilot-setup-options">
        <summary>{t('Ubah pengaturan', 'Change settings')}</summary>
        <fieldset disabled={busy}>
          <div class="form-grid mt-5">
            <label
              >{t('Kategori', 'Category')}<select bind:value={category}>
                <option value="mendengar">{t('Mendengar', 'Listening')}</option><option
                  value="logika">{t('Logika', 'Reasoning')}</option
                >
              </select></label
            >
            <label
              >Level<select bind:value={level}>
                <option value={1}>1 · {t('Mulai mengenal', 'Getting started')}</option><option
                  value={2}>2 · {t('Mulai terbiasa', 'Growing familiar')}</option
                >
              </select></label
            >
            <label
              >{t('Bahasa latihan anak', 'Child’s exercise language')}<select bind:value={language}>
                <option value="id">Indonesia</option><option value="en">English</option>
              </select></label
            >
            <label
              >{t('Jumlah kartu', 'Number of cards')}<input
                aria-label={t('Jumlah kartu', 'Number of cards')}
                type="number"
                min="1"
                max={available.length}
                step="1"
                bind:value={count}
              /></label
            >
          </div>
          <div class="pilot-actions">
            {#each [1, 3, 5] as n}<button
                class="button ghost"
                class:chosen={count === n}
                onclick={() => (count = n)}>{n} {t('kartu', 'cards')}</button
              >{/each}
          </div>
          <label
            >{t('Pemilihan kartu', 'Card selection')}<select bind:value={selection}>
              <option value="new"
                >{t(
                  'Belum pernah tuntas · bahasa ini',
                  'Not completed before · this language'
                )}</option
              >
              <option value="random"
                >{t(
                  'Acak semua · termasuk kartu lama',
                  'Pure random · includes practiced cards'
                )}</option
              >
            </select></label
          >
          <p class="fine-print">
            {available.length}
            {t(
              'kartu tersedia. Tidak ada kartu ganda dalam sesi.',
              'cards available. No duplicate cards in a session.'
            )}
          </p>
        </fieldset>
      </details>
      <p class="fine-print">
        {t(
          'Kedua mode membutuhkan internet. Anak tidak perlu melihat layar.',
          'Both modes require internet. The child need not see the screen.'
        )}
      </p>
    </section>
  </div>
  {#if sessions.some((s) => ['active', 'paused'].includes(s.status))}<section class="mt-5">
      <h2>{t('Lanjutkan latihan', 'Continue practice')}</h2>
      {#each sessions.filter((s) => ['active', 'paused'].includes(s.status)) as session}<a
          class="history-row pilot-resume"
          href={`/latihan/${session.id}`}
          ><span
            >{session.cards[session.cardIndex]?.title} · {session.language.toUpperCase()}<small
              >{session.cardIndex + 1}/{session.cards.length}
              {t('kartu', 'cards')} · {session.mode === 'manual'
                ? t('Pendamping', 'Caregiver')
                : 'AI'}</small
            ></span
          ><strong>{t('Lanjutkan', 'Continue')} →</strong></a
        >{/each}
    </section>{/if}
  <p class="fine-print">
    <a href="/beranda?legacy=1"
      >{t('Buka latihan format lama (200 soal)', 'Open legacy practice (200 questions)')} →</a
    >
  </p>
</div>
