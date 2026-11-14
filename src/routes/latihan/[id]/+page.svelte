<script lang="ts">
  import { getContext, onDestroy, untrack } from 'svelte';
  import { beforeNavigate } from '$app/navigation';
  import { api } from '$lib/api';
  import {
    LiveTutor,
    type LiveCredentials,
    type LiveTutorCallbacks,
    type LiveAnswerEvent
  } from '$lib/live';
  import type { MockTutor } from '$lib/testing/mock-tutor';
  import type { LearningStores } from '$lib/stores';
  import type { Verdict } from '$lib/types';
  import type { PracticeMode, PracticeSession } from '$lib/pilot/types';
  import { questionAttempts, questionDone } from '$lib/pilot/types';
  import { currentCard, currentQuestion, results } from '$lib/pilot/session';
  import SessionResults from '$lib/pilot/SessionResults.svelte';
  let { data } = $props();
  const { uiLanguage } = getContext<LearningStores>('learning');
  const t = (id: string, en: string) => ($uiLanguage === 'en' ? en : id);
  let session = $state<PracticeSession>(untrack(() => data.practice));
  let busy = $state(false);
  let started = $state(false);
  let consent = $state(false);
  let message = $state('');
  let voiceStatus = $state('');
  let testMode = $state(false);
  let visual = $state(false);
  let verbalHint = $state(false);
  let skipOffered = $state(false);
  let reviewText = $state('');
  let feedback = $state('');
  let tutor: LiveTutor | MockTutor | undefined;
  let disposed = false;
  let outOfSync = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pendingPlayback = $state<'advance' | 'pause' | 'after-review' | null>(null);
  let silenceStage = 0;
  let questionEndedAt: number | null = null;
  let responseTimeMs: number | null = null;
  const card = $derived(currentCard(session));
  const question = $derived(currentQuestion(session));
  const attempts = $derived(questionAttempts(session));
  const done = $derived(questionDone(attempts));
  const ended = $derived(['completed', 'stopped'].includes(session.status));
  const wrong = $derived(attempts.filter((a) => a.verdict === 'incorrect').length);
  const hint = $derived(wrong >= 2 ? question?.secondHint : question?.hint.description);
  const say = (id: string, en: string) => (session.language === 'en' ? en : id);
  function clearTimer() {
    clearTimeout(timer);
    timer = undefined;
  }
  async function command(action: string, extra: Record<string, unknown> = {}) {
    if (busy || disposed || outOfSync)
      throw new Error(t('Tunggu penyimpanan selesai.', 'Wait for saving to finish.'));
    busy = true;
    try {
      const updated = await api<PracticeSession>(`pilot/${session.id}/action`, {
        action,
        eventId: crypto.randomUUID(),
        cardId: card.id,
        questionId: question.id,
        mode: session.mode,
        ...extra
      });
      if (!disposed) session = updated;
      return updated;
    } catch (error) {
      // A lost HTTP response may hide a committed attempt. Reconcile before allowing another.
      try {
        const response = await fetch(`/api/pilot/${session.id}`);
        if (!response.ok) throw new Error('Cannot reconcile', { cause: error });
        const saved: PracticeSession = await response.json();
        if (!disposed) session = saved;
      } catch {
        outOfSync = true;
      }
      throw error;
    } finally {
      busy = outOfSync;
    }
  }
  function present(readStory: boolean) {
    clearTimer();
    visual = false;
    verbalHint = false;
    skipOffered = false;
    feedback = '';
    questionEndedAt = null;
    responseTimeMs = null;
    silenceStage = 0;
    tutor?.present(
      { ...question, story: card.story, category: card.category, level: card.level },
      { readStory }
    );
  }
  function scheduleSilence() {
    clearTimer();
    if (!started || session.mode !== 'ai' || session.status !== 'active' || done || pendingPlayback)
      return;
    timer = setTimeout(
      () =>
        void run(async () => {
          if (busy) return;
          silenceStage++;
          if (silenceStage > 3) {
            await pause();
            return;
          }
          if (silenceStage === 1) {
            await command('hint');
            verbalHint = true;
          }
          if (silenceStage === 3) skipOffered = true;
          tutor?.nudge(silenceStage as 1 | 2 | 3, silenceStage === 1 ? hint : undefined);
        }),
      7000
    );
  }
  async function run(action: () => Promise<void>) {
    message = '';
    try {
      await action();
    } catch (e) {
      message = (e as Error).message;
      clearTimer();
    }
  }
  const callbacks: LiveTutorCallbacks = {
    onStatus(status) {
      if (disposed) return;
      voiceStatus = status;
      if (status !== 'listening') clearTimer();
      if (status === 'listening') {
        if (questionEndedAt !== null && !pendingPlayback) {
          questionEndedAt = performance.now();
          responseTimeMs = null;
        }
        if (pendingPlayback) queueMicrotask(() => void run(afterPlayback));
        else scheduleSilence();
      }
    },
    onSpeechStart() {
      clearTimer();
      silenceStage = 0;
      if (questionEndedAt !== null && responseTimeMs === null)
        responseTimeMs = Math.max(0, Math.round(performance.now() - questionEndedAt));
    },
    onSpeechEnd() {
      if (questionEndedAt !== null) scheduleSilence();
    },
    onQuestionFinished() {
      questionEndedAt = performance.now();
      responseTimeMs = null;
      scheduleSilence();
    },
    async onAnswer(event: LiveAnswerEvent, eventId: string) {
      if (event.questionId !== question.id)
        throw new DOMException('Question changed', 'AbortError');
      clearTimer();
      const updated = await command('answer', { ...event, eventId, responseTimeMs });
      const accepted = updated.attempts.find((a) => a.eventId === eventId)!;
      const count = questionAttempts(updated).filter((a) => a.verdict === 'incorrect').length;
      const text =
        accepted.verdict === 'correct'
          ? say(`Betul, ${question.expectedAnswer}.`, `Correct, ${question.expectedAnswer}.`)
          : accepted.verdict === 'unclear'
            ? updated.status === 'paused'
              ? say('Kita jeda. Minta bantuan pendamping.', 'Let’s pause and ask your caregiver.')
              : say('Belum jelas. Coba sekali lagi.', 'Not clear yet. Please try once more.')
            : count >= 3
              ? say('Kita lanjut dulu, ya.', 'Let’s move on for now.')
              : count === 1
                ? question.hint.description
                : question.secondHint;
      feedback = text;
      pendingPlayback =
        updated.status === 'paused'
          ? 'pause'
          : questionDone(questionAttempts(updated))
            ? 'advance'
            : null;
      return {
        verdict: accepted.verdict as 'correct' | 'incorrect' | 'unclear',
        feedbackReason: text
      };
    },
    async onControl(action) {
      if (action === 'pause') await pause();
      else if (action === 'repeat') await repeat();
      else if (action === 'hint') await showHint();
      else if (action === 'request_skip') {
        skipOffered = true;
        tutor?.nudge(3);
      } else if (action === 'confirm_skip') {
        if (!skipOffered) throw new Error('Skip not confirmed.');
        await skip();
      }
    },
    onError(error) {
      message = error;
      clearTimer();
      pendingPlayback = null;
      tutor?.close();
      tutor = undefined;
      started = false;
    }
  };
  async function connect() {
    if (busy || disposed || !consent) return;
    busy = true;
    message = '';
    try {
      const credentials = await api<LiveCredentials & { test?: boolean }>(
        `pilot/${session.id}/token`,
        {}
      );
      if (disposed) return;
      tutor?.close();
      if (credentials.test) {
        const { MockTutor } = await import('$lib/testing/mock-tutor');
        if (disposed) return;
        tutor = new MockTutor(callbacks);
        testMode = true;
      } else tutor = new LiveTutor(callbacks, { pilot: true });
      await tutor.connect(credentials);
      if (disposed) {
        tutor.close();
        return;
      }
      started = true;
      busy = false;
      if (done) {
        await advance();
        return;
      }
      if (session.attempts.length) await command('repeat');
      present(true);
    } finally {
      busy = false;
    }
  }
  async function afterPlayback() {
    const next = pendingPlayback;
    pendingPlayback = null;
    if (next === 'pause') {
      tutor?.pause();
      started = false;
    } else if (next === 'advance') await advance();
    else if (next === 'after-review') await advance(true);
  }
  async function advance(reviewed = false) {
    clearTimer();
    if (session.questionIndex === card.questions.length - 1 && !reviewed) {
      reviewText = results(session)
        .filter((r) => r.card.id === card.id && ['incorrect', 'skipped'].includes(r.status))
        .map((r) => r.question.explanation)
        .join(' ');
      if (reviewText) {
        if (session.mode === 'ai' && started) {
          pendingPlayback = 'after-review';
          tutor?.review(reviewText);
        }
        return;
      }
    }
    const oldCard = card.id;
    await command('next');
    reviewText = '';
    visual = false;
    verbalHint = false;
    feedback = '';
    if (ended) {
      tutor?.close();
      started = false;
      return;
    }
    if (session.mode === 'ai' && started) present(card.id !== oldCard);
  }
  async function manual(verdict: Verdict) {
    await command('answer', { verdict });
    if (session.status === 'paused') started = false;
  }
  async function repeat() {
    clearTimer();
    await command('repeat');
    if (session.mode === 'ai') present(true);
  }
  async function showHint() {
    await command('hint');
    verbalHint = true;
    tutor?.hint();
  }
  async function startManual() {
    if (session.attempts.length) await command('repeat');
    started = true;
  }
  async function pause() {
    clearTimer();
    pendingPlayback = null;
    tutor?.pause();
    await command('pause');
    started = false;
  }
  async function resume() {
    if (session.mode === 'ai' && !consent) return;
    await command('resume');
    if (session.mode === 'ai') {
      tutor?.close();
      tutor = undefined;
      started = false;
      await connect();
    } else await startManual();
  }
  async function changeMode(mode: PracticeMode) {
    clearTimer();
    pendingPlayback = null;
    tutor?.close();
    tutor = undefined;
    started = false;
    await command('mode', { mode });
  }
  async function skip() {
    await command('skip');
    skipOffered = false;
    await advance();
  }
  async function stop() {
    clearTimer();
    pendingPlayback = null;
    tutor?.close();
    await command('stop');
    started = false;
  }
  beforeNavigate(() => {
    clearTimer();
    tutor?.close();
    started = false;
  });
  onDestroy(() => {
    disposed = true;
    clearTimer();
    tutor?.close();
  });
</script>

<svelte:head><title>{t('Latihan flashcard', 'Flashcard practice')} — Fokus</title></svelte:head>
<div class="page-width inner-page pilot">
  <div class="pilot-row-heading">
    <a class="text-link" href="/beranda">← {t('Ruang belajar', 'Flashcards')}</a><span class="pill"
      >{session.language.toUpperCase()} · {session.mode === 'ai'
        ? 'AI'
        : t('Pendamping', 'Caregiver')}</span
    >
  </div>
  {#if message}<p class="error-text" role="alert">
      {message}
      <button class="text-toggle" onclick={() => location.reload()}
        >{t('Muat ulang hasil tersimpan', 'Reload saved session')}</button
      >
    </p>{/if}
  {#if ended}<div class="section-heading">
      <div>
        <span class="page-eyebrow">{t('RINGKASAN LATIHAN', 'PRACTICE SUMMARY')}</span>
        <h1>
          {session.status === 'completed'
            ? t('Sesi selesai.', 'Session complete.')
            : t('Sesi dihentikan.', 'Session stopped.')}
        </h1>
        <p>
          {t(
            'Hasil tersimpan. Tidak ada rekaman atau transkrip ucapan yang disimpan.',
            'Results saved. No voice recordings or speech transcripts are stored.'
          )}
        </p>
      </div>
      <a class="button secondary" href="/pendamping"
        >{t('Laporan perkembangan', 'Progress reports')} →</a
      >
    </div>
    <SessionResults {session} bind:busy onChange={(s) => (session = s)} />
  {:else}
    <div class="session-progress">
      {t('KARTU', 'CARD')}
      {session.cardIndex + 1}/{session.cards.length} · {t('PERTANYAAN', 'QUESTION')}
      {session.questionIndex + 1}/{card.questions.length}
    </div>
    <div class="pilot-session-grid">
      <article class="pilot-flashcard" lang={session.language}>
        <span class="page-eyebrow">{t('CERITA · BACA SEKALI', 'STORY · READ ONCE')}</span>
        <h1>{card.title}</h1>
        <p class="pilot-story">{card.story}</p>
        <ol class="pilot-question-list">
          {#each card.questions as q, index}<li
              class:current={index === session.questionIndex}
              class:previous={index < session.questionIndex}
            >
              <span>{index + 1}</span>
              <p>{q.prompt}</p>
            </li>{/each}
        </ol>
        <p class="fine-print">
          {t(
            'Layar untuk pendamping. Anak tidak perlu melihat HP.',
            'Caregiver screen. The child need not look at the phone.'
          )}
        </p>
      </article>
      <section class="form-card pilot-turn">
        <span class="page-eyebrow">{t('PERTANYAAN AKTIF', 'CURRENT QUESTION')}</span>
        <h2 data-testid="pilot-question" lang={session.language}>{question.prompt}</h2>
        <p class="fine-print">
          {wrong}/3 {t(
            'percobaan belum tepat · belum jelas tidak dihitung salah',
            'incorrect attempts · unclear is not counted wrong'
          )}
        </p>
        {#if testMode}<p class="test-banner">
            TEST ADAPTER · {t('bukan Gemini nyata', 'not real Gemini')}
          </p>{/if}
        {#if session.mode === 'ai' && !started}<label class="checkbox-label mt-4"
            ><input type="checkbox" bind:checked={consent} />{t(
              'Saya mendampingi dan mengizinkan pemrosesan suara oleh Gemini.',
              'I am supervising and permit Gemini to process the audio.'
            )}</label
          >{/if}
        {#if session.status === 'paused'}<div class="pilot-notice">
            <h3>{t('Latihan dijeda.', 'Practice paused.')}</h3>
            <p>
              {t(
                'Pendamping dapat membantu, melanjutkan, atau mengganti mode. Cerita akan dibaca ulang.',
                'The caregiver can help, resume, or switch modes. The current story will be reread.'
              )}
            </p>
            <button
              class="button primary mt-4"
              disabled={busy || (session.mode === 'ai' && !consent)}
              onclick={() => run(resume)}>{t('Lanjutkan sesi', 'Resume session')}</button
            >
          </div>
        {:else if !started}<div class="pilot-notice">
            <p>
              {session.mode === 'manual'
                ? t(
                    'Bacakan cerita, lalu pertanyaan aktif. Catat tiap percobaan anak; mikrofon tidak digunakan.',
                    'Read the story, then the current question. Record each attempt; no microphone is used.'
                  )
                : t(
                    'AI akan membaca dan bertanya. Anak cukup menjawab dengan suara.',
                    'AI reads and asks. The child can answer by voice.'
                  )}
            </p>
            {#if session.mode === 'ai'}<button
                class="button primary"
                disabled={busy || !consent}
                onclick={() => run(connect)}
                >{t('Aktifkan mikrofon & mulai', 'Enable microphone & start')}</button
              >{:else}<button
                class="button primary mt-4"
                disabled={busy}
                onclick={() => run(startManual)}>{t('Mulai membacakan', 'Start reading')}</button
              >{/if}
          </div>
        {:else}
          {#if session.mode === 'manual'}<div class="pilot-actions mt-5">
              <button
                class="button primary"
                disabled={busy || done}
                onclick={() => run(() => manual('correct'))}>{t('Benar', 'Correct')}</button
              ><button
                class="button secondary"
                disabled={busy || done}
                onclick={() => run(() => manual('incorrect'))}
                >{t('Belum tepat', 'Incorrect')}</button
              ><button
                class="button ghost"
                disabled={busy || done}
                onclick={() => run(() => manual('unclear'))}>{t('Belum jelas', 'Unclear')}</button
              >
            </div>{:else}<p class="pilot-voice" role="status">
              {{
                connecting: t('Menghubungkan…', 'Connecting…'),
                speaking: t('AI berbicara…', 'AI speaking…'),
                thinking: t('Memproses…', 'Thinking…'),
                listening: t('Mendengarkan jawaban.', 'Listening for an answer.'),
                reconnecting: t('Menyambungkan ulang…', 'Reconnecting…'),
                closed: t(
                  'Suara terputus. Sambungkan ulang atau pilih mode pendamping.',
                  'Audio disconnected. Reconnect or choose caregiver mode.'
                )
              }[voiceStatus] ?? voiceStatus}
            </p>{/if}
          {#if feedback}<p class="feedback-line" lang={session.language}>{feedback}</p>{/if}
          {#if (verbalHint || wrong > 0) && wrong < 3}<p
              class="pilot-notice"
              lang={session.language}
            >
              {hint}
            </p>{/if}
          {#if reviewText}<div class="pilot-notice">
              <strong>{t('Pembahasan akhir kartu', 'End-of-card review')}</strong>
              <p lang={session.language}>{reviewText}</p>
              {#if session.mode === 'manual'}<button
                  class="button primary mt-4"
                  disabled={busy}
                  onclick={() => run(() => advance(true))}
                  >{t('Selesai membahas · lanjut', 'Review finished · continue')}</button
                >{/if}
            </div>{:else if done}<button
              class="button primary full mt-5"
              disabled={busy}
              onclick={() =>
                run(() => {
                  pendingPlayback = null;
                  return advance();
                })}
              >{session.mode === 'manual'
                ? t('Lanjutkan', 'Continue')
                : t('Lanjutkan bila audio terhenti', 'Continue if audio stalled')} →</button
            >{/if}
          <div class="pilot-actions mt-5">
            <button class="button ghost" disabled={busy || done} onclick={() => run(repeat)}
              >{t('Ulang cerita', 'Repeat story')}</button
            ><button class="button ghost" disabled={busy || done} onclick={() => run(showHint)}
              >{t('Petunjuk verbal', 'Verbal hint')}</button
            ><button class="button ghost" disabled={busy} onclick={() => run(pause)}
              >{t('Jeda', 'Pause')}</button
            >
          </div>
          {#if !done}<button
              class="text-toggle"
              disabled={busy}
              onclick={() => (skipOffered = true)}>{t('Lewati pertanyaan', 'Skip question')}</button
            >{/if}
          {#if skipOffered && !done}<div class="pilot-notice" role="status">
              <p>{t('Lewati pertanyaan ini?', 'Skip this question?')}</p>
              <div class="pilot-actions">
                <button class="button secondary" disabled={busy} onclick={() => run(skip)}
                  >{t('Ya, lewati', 'Yes, skip')}</button
                ><button class="button ghost" disabled={busy} onclick={() => (skipOffered = false)}
                  >{t('Tidak', 'No')}</button
                >
              </div>
            </div>{/if}
        {/if}
        <details class="pilot-reference">
          <summary>{t('Acuan & bantuan pendamping', 'Answer reference & assistance')}</summary>
          <p lang={session.language}>
            <strong>{t('Acuan', 'Reference')}: {question.expectedAnswer}</strong>
          </p>
          <p class="fine-print">
            {t(
              'Terima jawaban bermakna sama, termasuk bahasa lain atau campuran. Jangan bacakan acuan sebelum akhir kartu.',
              'Accept the same meaning, including other or mixed languages. Do not read the answer reference before the end of the card.'
            )}
          </p>
          <label class="checkbox-label mt-4"
            ><input
              type="checkbox"
              disabled={busy}
              checked={session.events.some(
                (e) =>
                  e.type === 'caregiver' && e.cardId === card.id && e.questionId === question.id
              )}
              onchange={(e) =>
                run(async () => {
                  await command('caregiver', { enabled: e.currentTarget.checked });
                })}
            />{t('Bantuan pendamping diberikan', 'Caregiver assistance given')}</label
          ><button class="button ghost" disabled={busy} onclick={() => (visual = !visual)}
            >{t('Buka / tutup visual opsional', 'Show / hide optional visual')}</button
          >{#if visual}<div class="hint-card">
              <span class="hint-emoji">{question.hint.emoji}</span>
              <p lang={session.language}>{hint}</p>
            </div>
            <label class="checkbox-label mt-4"
              ><input
                type="checkbox"
                disabled={busy}
                checked={session.events.some(
                  (e) => e.type === 'visual' && e.cardId === card.id && e.questionId === question.id
                )}
                onchange={(e) =>
                  run(async () => {
                    await command('visual', { enabled: e.currentTarget.checked });
                  })}
              />{t(
                'Visual benar-benar ditunjukkan kepada anak',
                'Visual was actually shown to the child'
              )}</label
            >{/if}
        </details>
        <label class="mt-5"
          >{t('Ganti mode · progres tetap tersimpan', 'Switch mode · keep progress')}<select
            value={session.mode}
            disabled={busy}
            onchange={(e) => run(() => changeMode(e.currentTarget.value as PracticeMode))}
            ><option value="manual">{t('Pendamping', 'Caregiver')}</option><option value="ai"
              >AI</option
            ></select
          ></label
        >
        <button class="text-toggle danger" disabled={busy} onclick={() => run(stop)}
          >{t('Hentikan sesi & simpan hasil', 'Stop session & keep results')}</button
        >
      </section>
    </div>
    {#if session.attempts.length}<details class="mt-5">
        <summary
          >{t('Hasil & koreksi selama latihan', 'Results & corrections during practice')}</summary
        ><SessionResults
          {session}
          bind:busy
          onChange={(s) => {
            session = s;
            pendingPlayback = null;
            tutor?.close();
            started = false;
          }}
        />
      </details>{/if}
  {/if}
</div>
