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
  $effect(() => {
    void settings;
    composition = null;
  });
  async function preview() {
    busy = true;
    message = '';
    const requested = JSON.stringify(settings);
    try {
      const result = await api<{ oldCount: number; questionCount: number; count: number }>(
        'pilot/preview',
        settings
      );
      if (requested === JSON.stringify(settings)) composition = result;
    } catch (e) {
      message = (e as Error).message;
    } finally {
      busy = false;
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
      <h2>{t('Atur latihan', 'Plan a practice')}</h2>
      <p class="muted">
        {t(
          'Satu cerita, 2–4 pertanyaan berurutan. Tidak ada kartu ganda dalam sesi.',
          'One story, 2–4 questions in sequence. No duplicate cards in a session.'
        )}
      </p>
      <div class="form-grid mt-5">
        <label
          >{t('Kategori', 'Category')}<select bind:value={category}
            ><option value="mendengar">{t('Mendengar', 'Listening')}</option><option value="logika"
              >{t('Logika', 'Reasoning')}</option
            ></select
          ></label
        >
        <label
          >{t('Level', 'Level')}<select bind:value={level}
            ><option value={1}>1 · {t('Mulai mengenal', 'Getting started')}</option><option
              value={2}>2 · {t('Mulai terbiasa', 'Growing familiar')}</option
            ></select
          ></label
        >
        <label
          >{t('Bahasa latihan anak', 'Child’s exercise language')}<select bind:value={language}
            ><option value="id">Indonesia</option><option value="en">English</option></select
          ></label
        >
        <label
          >{t('Mode latihan', 'Practice mode')}<select bind:value={mode}
            ><option value="manual"
              >{t('Pendamping · tanpa mikrofon', 'Caregiver · no microphone')}</option
            ><option value="ai">AI · Gemini Live</option></select
          ></label
        >
      </div>
      <label
        >{t('Pemilihan kartu', 'Card selection')}<select bind:value={selection}
          ><option value="new"
            >{t('Belum pernah tuntas · bahasa ini', 'Not completed before · this language')}</option
          ><option value="random"
            >{t(
              'Acak semua · termasuk kartu lama',
              'Pure random · includes practiced cards'
            )}</option
          ></select
        ></label
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
      <div class="pilot-actions">
        {#each [1, 3, 5] as n}<button
            class="button ghost"
            class:chosen={count === n}
            onclick={() => (count = n)}>{n} {t('kartu', 'cards')}</button
          >{/each}
      </div>
      <p class="fine-print">
        {available.length}
        {t(
          'kartu tersedia untuk filter ini. Default 3; bukan perkiraan durasi.',
          'cards available for these filters. Three recommended; no fixed duration.'
        )}
      </p>
      {#if composition}<div class="pilot-notice" role="status">
          <strong
            >{composition.count}
            {t('kartu', 'cards')} · {composition.questionCount}
            {t('pertanyaan', 'questions')}</strong
          >
          <p>
            {composition.count - composition.oldCount}
            {t('belum pernah tuntas', 'not completed before')} + {composition.oldCount}
            {t('pernah dilatih dalam bahasa ini', 'previously practiced in this language')}.
          </p>
          {#if selection === 'new' && composition.oldCount}<p>
              {t(
                'Kartu baru tidak cukup. Sisanya memakai kartu yang paling lama tidak dilatih. Lanjutkan atau ubah jumlah.',
                'Not enough unseen cards. The rest are the least recently practiced. Continue or change the count.'
              )}
            </p>{/if}<button class="button primary mt-4" disabled={busy} onclick={start}
            >{t('Mulai sesi', 'Start session')} →</button
          >
        </div>{:else}<button
          class="button primary full mt-5"
          disabled={busy || !Number.isInteger(count) || count < 1 || count > available.length}
          onclick={preview}>{t('Periksa susunan sesi', 'Preview session')} →</button
        >{/if}
      {#if message}<p class="error-text" role="alert">{message}</p>{/if}
    </section>
    <aside>
      <article class="pilot-card-preview">
        <span class="page-eyebrow">{t('BENTUK KARTU', 'CARD FORMAT')}</span>
        <h2>{t('Dengarkan. Bayangkan. Jawab.', 'Listen. Imagine. Answer.')}</h2>
        <div class="preview-story">
          {t(
            'Cerita dibaca sekali, lalu tanyakan satu per satu. Acuan jawaban ada di layar pendamping.',
            'Read the story once, then ask one question at a time. Answer references stay on the caregiver’s screen.'
          )}
        </div>
        <ol>
          <li>{t('Siapa?', 'Who?')}</li>
          <li>{t('Apa yang terjadi?', 'What happened?')}</li>
          <li>{t('Mengapa?', 'Why?')}</li>
        </ol>
        <p class="muted">
          {t(
            'Contoh struktur, bukan soal sesi. Anak tidak perlu melihat layar, termasuk dalam mode AI.',
            'Example structure, not a session card. The child need not see the screen, including in AI mode.'
          )}
        </p>
      </article>
      <p class="fine-print">
        {t(
          'Kedua mode membutuhkan internet pada pilot. Bahasa UI di pojok atas tidak mengubah bahasa latihan.',
          'Both pilot modes require internet. The interface language above does not change the exercise language.'
        )}
      </p>
    </aside>
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
