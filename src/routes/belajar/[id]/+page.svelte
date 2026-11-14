<script lang="ts">
  import { getContext, onDestroy, untrack } from 'svelte';
  import { goto, beforeNavigate } from '$app/navigation';
  import { api } from '$lib/api';
  import { LiveTutor, type LiveCredentials, type LiveTutorCallbacks } from '$lib/live';
  import type { MockTutor } from '$lib/testing/mock-tutor';
  import type { LearningStores } from '$lib/stores';
  import type { AnswerEvent, Verdict } from '$lib/types';
  import { SilenceTimer, transition, type LearningState } from '$lib/session-state';
  import Illustration from '$lib/components/Illustration.svelte';
  import {
    ArrowLeft,
    ArrowRight,
    Star,
    Mic,
    RotateCcw,
    SkipForward,
    Pause,
    Play,
    ShieldCheck
  } from 'lucide-svelte';
  let { data } = $props();
  const { question: questionStore, personalizedQuestion } = getContext<LearningStores>('learning');
  let cursor = $state(untrack(() => data.session.cursor));
  let phase = $state<LearningState>(
    untrack(() => (['completed', 'stopped'].includes(data.session.status) ? 'completed' : 'idle'))
  );
  let hintShown = $state(false);
  let showText = $state(true);
  let consent = $state(false);
  let message = $state('');
  let testMode = $state(false);
  let busy = $state(false);
  let answered = $state(
    untrack(() =>
      data.attempts.some(
        (a) =>
          a.questionId === data.questions[cursor]?.id && ['correct', 'skipped'].includes(a.verdict)
      )
    )
  );
  let feedback = $state('');
  let questionEndedAt: number | null = null;
  let responseTimeMs: number | null = null;
  let tutor: LiveTutor | MockTutor | undefined;
  let pending: { event: AnswerEvent; eventId: string; responseTimeMs: number | null } | undefined;
  let attempts = $state(
    untrack(() =>
      data.attempts.map((a) => ({
        questionId: a.questionId,
        verdict: a.verdict,
        hintUsed: a.hintUsed
      }))
    )
  );
  const current = $derived($personalizedQuestion);
  const labels: Record<LearningState, string> = {
    idle: 'Siap mendengarkan cerita?',
    connecting: 'Menghubungkan teman belajar…',
    presenting: 'Dengarkan baik-baik, ya…',
    awaiting_answer: 'Aku mendengarkan. Jawab dengan suaramu.',
    evaluating: 'Sebentar, aku sedang berpikir…',
    feedback: 'Terima kasih sudah mencoba!',
    next_question: 'Menyiapkan cerita berikutnya…',
    completed: 'Petualangan tersimpan.',
    paused: 'Istirahat dulu. Mikrofon dijeda.',
    reconnecting: 'Menyambungkan kembali…',
    error: 'Kita sambungkan kembali, ya.'
  };
  const silence = new SilenceTimer(() => {
    void showHint();
  });
  $effect(() => {
    questionStore.set(data.questions[cursor] ?? null);
  });
  function move(to: LearningState) {
    phase = transition(phase, to);
  }
  function fail(error: unknown) {
    silence.cancel();
    tutor?.pause();
    message = error instanceof Error ? error.message : String(error);
    if (phase !== 'completed') move('error');
  }
  async function action(name: 'next' | 'pause' | 'resume' | 'stop' | 'hint') {
    return api<{ status: string; cursor: number }>(`sessions/${data.session.id}/action`, {
      action: name
    });
  }
  async function showHint() {
    if (!current || answered || ['paused', 'error', 'completed'].includes(phase) || hintShown)
      return;
    silence.cancel();
    hintShown = true;
    try {
      await action('hint');
      tutor?.hint();
    } catch (e) {
      fail(e);
    }
  }
  const callbacks: LiveTutorCallbacks = {
    onStatus(status) {
      if (['paused', 'error', 'completed'].includes(phase)) return;
      if (status === 'speaking') {
        silence.cancel();
        if (!answered) move('presenting');
      }
      if (status === 'thinking') {
        silence.cancel();
        if (!answered) move('evaluating');
      }
      if (status === 'reconnecting') {
        silence.cancel();
        move('reconnecting');
      }
    },
    onSpeechStart() {
      silence.cancel();
      if (questionEndedAt !== null && responseTimeMs === null)
        responseTimeMs = Math.max(0, Math.round(performance.now() - questionEndedAt));
    },
    onQuestionFinished() {
      if (answered || ['paused', 'error', 'completed'].includes(phase)) return;
      move('awaiting_answer');
      questionEndedAt = performance.now();
      responseTimeMs = null;
      if (!hintShown) silence.start();
    },
    onAnswer: saveAnswer,
    onError: fail
  };
  async function saveAnswer(event: AnswerEvent, eventId: string) {
    silence.cancel();
    if (!current || event.questionId !== current.id || ['paused', 'completed'].includes(phase))
      throw new Error('Soal tidak aktif.');
    pending ??= { event, eventId, responseTimeMs };
    try {
      const saved = await api<{ verdict: AnswerEvent['verdict']; hintUsed: boolean }>(
        `sessions/${data.session.id}/attempts`,
        { ...pending.event, eventId: pending.eventId, responseTimeMs: pending.responseTimeMs }
      );
      pending = undefined;
      attempts.push({
        questionId: event.questionId,
        verdict: saved.verdict,
        hintUsed: saved.hintUsed
      });
      const reasons = {
        correct: 'Bagus, kamu berhasil! Terima kasih sudah mendengarkan.',
        incorrect: current.hint.description,
        unclear: 'Aku belum mendengar dengan jelas. Boleh ulangi pelan-pelan?'
      };
      feedback = reasons[saved.verdict];
      answered = saved.verdict === 'correct';
      if (saved.verdict === 'incorrect') hintShown = true;
      move('feedback');
      return { verdict: saved.verdict, feedbackReason: feedback };
    } catch (e) {
      fail(e);
      throw e;
    }
  }
  async function connect() {
    if (!consent || busy) return;
    busy = true;
    message = '';
    silence.cancel();
    tutor?.close();
    move('connecting');
    try {
      const freshResponse = await fetch(`/api/sessions/${data.session.id}`);
      if (!freshResponse.ok) throw new Error('Sesi tidak dapat dimuat.');
      const fresh = await freshResponse.json();
      if (['completed', 'stopped'].includes(fresh.session.status)) {
        move('presenting');
        move('next_question');
        move('completed');
        return;
      }
      if (fresh.session.status === 'paused') await action('resume');
      cursor = fresh.session.cursor;
      answered = fresh.attempts.some(
        (a: { questionId: string; verdict: Verdict }) =>
          a.questionId === data.questions[cursor].id && ['correct', 'skipped'].includes(a.verdict)
      );
      hintShown = fresh.session.hintedQuestionIds.includes(data.questions[cursor].id);
      const credentials = await api<LiveCredentials & { test?: boolean }>(
        `sessions/${data.session.id}/token`,
        {}
      );
      testMode = !!credentials.test;
      if (testMode) {
        const { MockTutor } = await import('$lib/testing/mock-tutor');
        tutor = new MockTutor(callbacks);
        await tutor.connect();
      } else {
        tutor = new LiveTutor(callbacks);
        await tutor.connect(credentials);
      }
      move('presenting');
      if (pending) {
        const queued = pending;
        await saveAnswer(queued.event, queued.eventId);
      }
      if (answered) {
        move('feedback');
        feedback = 'Jawabanmu sudah tersimpan. Yuk, lanjutkan.';
      } else tutor.present(data.questions[cursor]);
    } catch (e) {
      fail(e);
    } finally {
      busy = false;
    }
  }
  async function next(skip = false) {
    if (!current || busy) return;
    busy = true;
    silence.cancel();
    tutor?.pause();
    try {
      if (skip && !answered) {
        await api(`sessions/${data.session.id}/attempts`, {
          eventId: crypto.randomUUID(),
          questionId: current.id,
          answerText: '',
          verdict: 'skipped',
          confidence: 1,
          feedbackReason: '',
          responseTimeMs: null
        });
        attempts.push({ questionId: current.id, verdict: 'skipped', hintUsed: hintShown });
      }
      move('next_question');
      const result = await action('next');
      cursor = result.cursor;
      hintShown = false;
      answered = false;
      feedback = '';
      questionEndedAt = null;
      responseTimeMs = null;
      if (result.status === 'completed') {
        tutor?.close();
        move('completed');
      } else {
        move('presenting');
        tutor?.present(data.questions[cursor]);
        await tutor?.resume();
      }
    } catch (e) {
      fail(e);
    } finally {
      busy = false;
    }
  }
  async function pause() {
    silence.cancel();
    message = '';
    try {
      if (phase === 'paused') {
        await action('resume');
        move('presenting');
        questionEndedAt = null;
        responseTimeMs = null;
        await tutor?.resume();
      } else {
        tutor?.pause();
        await action('pause');
        move('paused');
      }
    } catch (e) {
      fail(e);
    }
  }
  function repeat() {
    silence.cancel();
    questionEndedAt = null;
    responseTimeMs = null;
    feedback = '';
    move('presenting');
    tutor?.repeat();
  }
  async function leave() {
    silence.cancel();
    tutor?.close();
    try {
      await action('stop');
      await goto('/beranda');
    } catch (e) {
      fail(e);
    }
  }
  async function startNew() {
    if (busy) return;
    busy = true;
    message = '';
    silence.cancel();
    tutor?.close();
    try {
      await action('stop');
      const session = await api<{ id: string }>('sessions', {
        childId: data.child.id,
        category: data.session.category,
        level: data.session.level
      });
      await goto(`/belajar/${session.id}`);
    } catch (e) {
      fail(e);
    } finally {
      busy = false;
    }
  }
  beforeNavigate(() => {
    silence.cancel();
    tutor?.close();
  });
  onDestroy(() => {
    silence.cancel();
    tutor?.close();
  });
</script>

<svelte:head><title>Waktu bercerita — Fokus</title></svelte:head>
<div class="session-page">
  {#if testMode}<p class="test-banner">
      Adapter pengujian aktif — bukan percakapan Gemini asli.
    </p>{/if}
  <div class="session-top">
    <button class="text-link" onclick={leave}><ArrowLeft size={17} /> Selesai dulu</button>
    <div class="session-meta">
      {data.session.category === 'mendengar' ? 'Mendengar' : 'Logika'}<span class="stars"
        >{#each Array(data.session.level) as _}<Star size={14} fill="currentColor" />{/each}</span
      >
    </div>
    <span class="text-link">Bersama {data.child.name}</span>
  </div>
  {#if phase === 'completed'}
    <section class="learning-card completion">
      <div class="completion-art"><Illustration kind="fox" /></div>
      <span class="pill">SETIAP USAHA ITU BERARTI</span>
      <h1>Kamu sudah berusaha hebat!</h1>
      <p>
        Terima kasih sudah mendengar dan berpikir bersama.<br />Istirahat kecil, lalu temukan cerita
        baru.
      </p>
      <div class="completion-stats">
        <span
          ><strong>{new Set(attempts.map((a) => a.questionId)).size}</strong><small
            >Cerita dijelajahi</small
          ></span
        ><span
          ><strong
            >{new Set(attempts.filter((a) => a.verdict === 'correct').map((a) => a.questionId))
              .size}</strong
          ><small>Jawaban ditemukan</small></span
        ><span
          ><strong
            >{new Set(attempts.filter((a) => a.hintUsed).map((a) => a.questionId)).size}</strong
          ><small>Dengan bantuan</small></span
        >
      </div>
      <a class="button primary" href="/beranda">Petualangan baru<ArrowRight size={17} /></a><a
        class="button ghost"
        href="/pendamping?legacy=1">Lihat bersama pendamping</a
      >
    </section>
  {:else}
    <div class="progress-track" aria-label={`Soal ${cursor + 1} dari ${data.questions.length}`}>
      {#each data.questions as _q, i}<span class:done={i < cursor} class:current={i === cursor}
        ></span>{/each}
    </div>
    <p class="session-progress">CERITA {cursor + 1} DARI {data.questions.length}</p>
    <section class="learning-card">
      <div class="session-illustration">
        <Illustration kind={data.session.category === 'mendengar' ? 'owl' : 'fox'} />
      </div>
      {#if phase === 'idle' || phase === 'connecting' || phase === 'error'}<h1>
          {phase === 'idle'
            ? 'Duduk nyaman. Pasang telinga.'
            : phase === 'error'
              ? 'Kita coba sambungkan lagi.'
              : 'Menyiapkan teman bercerita…'}
        </h1>
        <div class="connection-card">
          <p>
            Teman AI akan membacakan cerita. Si kecil cukup menjawab dengan suara. Pastikan ada
            pendamping, ya.
          </p>
          <label class="checkbox-label"
            ><input type="checkbox" bind:checked={consent} /><span
              >Saya mengizinkan mikrofon dan pemrosesan suara oleh Google Gemini. Audio tidak
              disimpan oleh aplikasi.</span
            ></label
          ><button class="button primary" onclick={connect} disabled={!consent || busy}
            ><Mic size={18} />{phase === 'error'
              ? 'Sambungkan kembali'
              : 'Aktifkan mikrofon & mulai'}</button
          >
        </div>
      {:else if phase === 'paused'}<h1>Istirahat dulu, tidak apa-apa.</h1>
        <p class="muted mt-3">Mikrofon dijeda. Ceritamu menunggu di sini.</p>
        <button class="button primary mt-6" onclick={pause}
          ><Play size={17} /> Lanjutkan cerita</button
        >
      {:else}<div data-testid="question" data-question-id={current?.id}>
          {#if showText}<p class="story">{current?.story}</p>
            <h1>{current?.prompt}</h1>{:else}<h1>Dengarkan ceritanya, ya.</h1>{/if}
        </div>
        <div class="ai-indicator" role="status">
          {#if ['presenting', 'evaluating'].includes(phase)}<span class="audio-bars"
              ><i></i><i></i><i></i><i></i></span
            >{:else}<Mic size={18} />{/if}<span>{labels[phase]}</span>
        </div>
        {#if hintShown && current}<aside class="hint-card" data-testid="hint" role="status">
            <span class="hint-emoji" aria-hidden="true">{current.hint.emoji}</span>
            <div>
              <strong>PETUNJUK KECIL UNTUKMU</strong>
              <p>{current.hint.description}</p>
            </div>
          </aside>{/if}
        {#if feedback}<p class="feedback-line" role="status">{feedback}</p>{/if}
        {#if answered}<button class="button primary mt-5" onclick={() => next()} disabled={busy}
            >Cerita berikutnya<ArrowRight size={18} /></button
          >{/if}
        <button class="text-toggle" onclick={() => (showText = !showText)}
          >{showText ? 'Sembunyikan teks cerita' : 'Tampilkan teks cerita'}</button
        >
      {/if}
      {#if message}<p class="error-text" role="alert">
          {message} Progress yang sudah tersimpan tetap aman.
        </p>{/if}
    </section>
    {#if !['idle', 'connecting', 'error'].includes(phase)}<div class="session-controls">
        <button
          class="button ghost"
          onclick={repeat}
          disabled={answered || phase === 'paused' || busy}
          ><RotateCcw size={16} /> Ulangi cerita</button
        ><button
          class="button ghost"
          onclick={() => next(true)}
          disabled={phase === 'paused' || busy}><SkipForward size={17} /> Lewati</button
        ><button class="button ghost" onclick={pause} disabled={busy}
          >{#if phase === 'paused'}<Play size={16} /> Lanjut{:else}<Pause size={16} /> Jeda{/if}</button
        >
      </div>{/if}
    <div class="session-controls">
      <button class="text-link" onclick={startNew} disabled={busy}>Mulai sesi baru</button>
    </div>
    <p class="care-note">
      <ShieldCheck size={16} /> Tidak perlu terburu-buru. Boleh mencoba lagi, kapan pun kamu siap.
    </p>
  {/if}
</div>
