<script lang="ts">
  import { getContext } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import type { LearningStores } from '$lib/stores';
  import type { PracticeSession, PracticeAttempt } from './types';
  import { results, finishedCard } from './session';
  let {
    session,
    onChange,
    busy = $bindable(false)
  }: {
    session: PracticeSession;
    onChange: (session: PracticeSession) => void;
    busy?: boolean;
  } = $props();
  const { uiLanguage } = getContext<LearningStores>('learning');
  const t = (id: string, en: string) => ($uiLanguage === 'en' ? en : id);
  let message = $state('');
  const rows = $derived(results(session));
  const labels = $derived({
    correct: t('Benar', 'Correct'),
    incorrect: t('Belum berhasil', 'Not yet successful'),
    unclear: t('Belum jelas', 'Unclear'),
    skipped: t('Dilewati', 'Skipped'),
    unfinished: t('Belum selesai', 'Unfinished')
  });
  async function correct(attempt: PracticeAttempt, verdict: string) {
    if (busy) return;
    busy = true;
    message = '';
    try {
      onChange(
        await api<PracticeSession>(`pilot/${session.id}/action`, {
          action: 'correct',
          eventId: crypto.randomUUID(),
          cardId: attempt.cardId,
          questionId: attempt.questionId,
          attemptId: attempt.id,
          verdict
        })
      );
    } catch (e) {
      message = (e as Error).message;
    } finally {
      busy = false;
    }
  }
  async function assistance(cardId: string, questionId: string, enabled: boolean) {
    if (busy) return;
    busy = true;
    message = '';
    try {
      onChange(
        await api<PracticeSession>(`pilot/${session.id}/action`, {
          action: 'caregiver',
          eventId: crypto.randomUUID(),
          cardId,
          questionId,
          enabled
        })
      );
    } catch (e) {
      message = (e as Error).message;
    } finally {
      busy = false;
    }
  }
  async function replay(cardId: string) {
    busy = true;
    try {
      const card = session.cards.find((c) => c.id === cardId)!;
      const next = await api<PracticeSession>('pilot/sessions', {
        childId: session.childId,
        category: card.category,
        level: card.level,
        language: session.language,
        mode: session.mode,
        count: 1,
        selection: 'random',
        replayCardId: cardId,
        confirmed: true
      });
      await goto(`/latihan/${next.id}`);
    } catch (e) {
      message = (e as Error).message;
    } finally {
      busy = false;
    }
  }
</script>

<section class="pilot-results">
  <div class="metric-grid">
    {#each [[t('Tanpa bantuan tercatat', 'Without recorded assistance'), rows.filter((r) => r.status === 'correct' && !r.assisted).length], [t('Berhasil dengan bantuan', 'Successful with assistance'), rows.filter((r) => r.status === 'correct' && r.assisted).length], [t('Belum berhasil', 'Not yet successful'), rows.filter((r) => r.status === 'incorrect').length], [t('Belum jelas / belum selesai', 'Unclear / unfinished'), rows.filter( (r) => ['unclear', 'unfinished'].includes(r.status) ).length]] as metric}<article
        class="metric-card"
      >
        <span class="metric-label">{metric[0]}</span><strong>{metric[1]}</strong>
      </article>{/each}
  </div>
  <p class="fine-print">
    {rows.filter((r) => r.status === 'skipped').length}
    {t(
      'dilewati. Belum jelas dan diam bukan jawaban salah. Mode dicatat per percobaan; bantuan yang tidak tercatat tidak dapat disimpulkan tidak terjadi.',
      'skipped. Unclear speech and silence are not wrong answers. Mode is recorded per attempt; unrecorded assistance may still have occurred.'
    )}
  </p>
  {#if message}<p class="error-text" role="alert">{message}</p>{/if}
  {#each session.cards as card}<article class="history-row">
      <div class="pilot-row-heading">
        <div>
          <h3>{card.title}</h3>
          <p class="muted">
            {finishedCard(session, card.id)
              ? t(
                  'Tuntas dilatih, bukan berarti dikuasai',
                  'Practice completed, not a mastery claim'
                )
              : t('Kartu belum selesai', 'Card unfinished')} · {session.language.toUpperCase()}
          </p>
        </div>
        <button class="button secondary" disabled={busy} onclick={() => replay(card.id)}
          >{t('Latih ulang', 'Practice again')}</button
        >
      </div>
      {#if rows.some((r) => r.card.id === card.id && ['incorrect', 'skipped'].includes(r.status))}<p
          class="pilot-notice"
        >
          {t(
            'Saran: ulangi kartu ini di kesempatan lain dengan membacakan cerita lebih pelan.',
            'Suggestion: revisit this card another time, reading the story more slowly.'
          )}
        </p>{/if}
      {#each rows.filter((r) => r.card.id === card.id) as row}<details
          class="pilot-question-result"
        >
          <summary
            ><span>{row.question.prompt}</span><strong
              >{labels[row.status as keyof typeof labels]}</strong
            ></summary
          >
          <p class="fine-print">{t('Acuan', 'Reference')}: {row.question.expectedAnswer}</p>
          {#each row.attempts as attempt, i}<div class="attempt-row">
              <span
                >{t('Percobaan', 'Attempt')}
                {i + 1} · {attempt.mode === 'ai' ? 'AI' : t('Pendamping', 'Caregiver')}<small
                  >{attempt.answerLanguage
                    ? `${t('Bahasa jawaban', 'Answer language')}: ${attempt.answerLanguage}`
                    : t(
                        'Bahasa jawaban tidak ditandai',
                        'Answer language unmarked'
                      )}{attempt.responseTimeMs !== null
                    ? ` · ${(attempt.responseTimeMs / 1000).toFixed(1)} s`
                    : ''}</small
                >{#if attempt.originalVerdict}<small
                    >{t('Awal', 'Original')}: {labels[attempt.originalVerdict]} → {labels[
                      attempt.verdict
                    ]} · {t('dikoreksi', 'corrected')}</small
                  >{/if}</span
              ><strong>{labels[attempt.verdict]}</strong>{#if attempt.verdict !== 'skipped'}<select
                  aria-label={`${t('Koreksi', 'Correct')} ${row.question.id} ${i + 1}`}
                  disabled={busy}
                  value={attempt.verdict}
                  onchange={(e) => correct(attempt, e.currentTarget.value)}
                  ><option value="correct">{t('Benar', 'Correct')}</option><option value="incorrect"
                    >{t('Belum tepat', 'Incorrect')}</option
                  ><option value="unclear">{t('Belum jelas', 'Unclear')}</option></select
                >{/if}
            </div>{/each}
          <label class="checkbox-label"
            ><input
              type="checkbox"
              disabled={busy}
              checked={session.events.some(
                (e) =>
                  e.type === 'caregiver' && e.cardId === card.id && e.questionId === row.question.id
              )}
              onchange={(e) => assistance(card.id, row.question.id, e.currentTarget.checked)}
            />{t(
              'Bantuan pendamping diberikan untuk pertanyaan ini',
              'Caregiver assistance was given for this question'
            )}</label
          >
          <p class="fine-print">
            {session.events
              .filter(
                (e) =>
                  e.cardId === card.id &&
                  (e.type === 'repeat' ||
                    (e.questionId === row.question.id &&
                      ['hint', 'visual', 'caregiver'].includes(e.type)))
              )
              .map(
                (e) =>
                  `${{ repeat: t('Ulang cerita', 'Story repeated'), hint: t('Petunjuk', 'Hint'), visual: t('Visual digunakan', 'Visual used'), caregiver: t('Pendamping', 'Caregiver'), pause: '', resume: '', mode: '' }[e.type]} · ${new Date(e.createdAt).toLocaleTimeString($uiLanguage)}`
              )
              .join(' / ') || t('Tidak ada bantuan tercatat', 'No assistance recorded')}
          </p>
        </details>{/each}
    </article>{/each}
</section>
