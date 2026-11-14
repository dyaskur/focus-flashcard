<script lang="ts">
  import { getContext } from 'svelte';
  import type { LearningStores } from '$lib/stores';
  import type { PracticeSession, PracticeMode } from './types';
  import { results, assistanceFor, cardCompletedAt } from './session';
  import ProgressChart from '$lib/components/ProgressChart.svelte';
  import SessionResults from './SessionResults.svelte';
  let {
    sessions,
    children
  }: {
    sessions: (PracticeSession & { childName: string })[];
    children: { id: string; name: string }[];
  } = $props();
  const { uiLanguage, profile } = getContext<LearningStores>('learning');
  const t = (id: string, en: string) => ($uiLanguage === 'en' ? en : id);
  let childId = $state('');
  let language = $state('id');
  let mode = $state<PracticeMode>('manual');
  let category = $state('');
  let level = $state('');
  let assistance = $state('');
  let experience = $state('');
  let from = $state('');
  let to = $state('');
  let tab = $state<'report' | 'history'>('report');
  const filtered = $derived(
    sessions.filter(
      (s) =>
        s.childId === (childId || $profile?.id) &&
        s.language === language &&
        (!category || s.category === category) &&
        (!level || s.level === Number(level)) &&
        (!from || s.startedAt.slice(0, 10) >= from) &&
        (!to || s.startedAt.slice(0, 10) <= to)
    )
  );
  const rows = $derived(
    filtered.flatMap((session) =>
      results(session).flatMap((row) => {
        const attempts = row.attempts.filter((a) => a.mode === mode);
        const first = attempts.find((a) => ['correct', 'incorrect'].includes(a.verdict));
        const assisted = first ? assistanceFor(session, first).length > 0 : false;
        const repeated = sessions.some((s) => {
          const completedAt = cardCompletedAt(s, row.card.id);
          return (
            s.id !== session.id &&
            s.childId === session.childId &&
            s.language === session.language &&
            completedAt !== null &&
            completedAt < session.startedAt
          );
        });
        return first &&
          (!assistance || (assistance === 'yes') === assisted) &&
          (!experience || (experience === 'repeat') === repeated)
          ? [{ ...row, first, assisted, repeated, session }]
          : [];
      })
    )
  );
  const correct = $derived(rows.filter((r) => r.first.verdict === 'correct').length);
  const times = $derived(
    rows.filter((r) => r.first.responseTimeMs !== null).map((r) => r.first.responseTimeMs!)
  );
  const skills = $derived(
    (['who', 'what', 'where', 'when', 'sequence', 'cause'] as const).map((skill) => {
      const group = rows.filter((r) => r.question.skill === skill);
      return {
        skill,
        count: group.length,
        correct: group.filter((r) => r.first.verdict === 'correct').length
      };
    })
  );
  const skillLabels = $derived({
    who: t('Tokoh', 'Who'),
    what: t('Tindakan / objek', 'Action / object'),
    where: t('Tempat', 'Where'),
    when: t('Waktu', 'When'),
    sequence: t('Urutan', 'Sequence'),
    cause: t('Sebab-akibat', 'Cause & effect')
  });
  const dates = $derived([...new Set(rows.map((r) => r.session.startedAt.slice(0, 10)))].sort());
  const trend = $derived(
    dates.map((date) => {
      const group = rows.filter((r) => r.session.startedAt.startsWith(date));
      return {
        date,
        count: group.length,
        accuracy: Math.round(
          (100 * group.filter((r) => r.first.verdict === 'correct').length) / group.length
        )
      };
    })
  );
  function update(session: PracticeSession) {
    sessions = sessions.map((s) => (s.id === session.id ? { ...s, ...session } : s));
  }
</script>

<div class="page-width inner-page pilot">
  <div class="section-heading">
    <div>
      <span class="page-eyebrow">{t('UNTUK PENDAMPING', 'FOR CAREGIVERS')}</span>
      <h1>{t('Lihat hasil bersama konteksnya.', 'Understand results in context.')}</h1>
      <p>
        {t(
          'Hasil AI dan pendamping dipisahkan. Aktivitas bukan diagnosis atau ukuran klinis.',
          'AI and caregiver assessments stay separate. Activity is not a diagnosis or clinical measure.'
        )}
      </p>
    </div>
    <a class="button secondary" href="/beranda">{t('Latihan baru', 'New practice')} →</a>
  </div>
  <div class="tabs">
    <button class:active={tab === 'report'} onclick={() => (tab = 'report')}
      >{t('Perkembangan', 'Progress')}</button
    ><button class:active={tab === 'history'} onclick={() => (tab = 'history')}
      >{t('Riwayat & koreksi', 'History & corrections')}</button
    >
  </div>
  <div class="filter-row mt-5">
    <label
      >{t('Profil anak', 'Child')}<select bind:value={childId}
        ><option value="">{$profile?.name}</option
        >{#each children.filter((c) => c.id !== $profile?.id) as child}<option value={child.id}
            >{child.name}</option
          >{/each}</select
      ></label
    >
    <label
      >{t('Bahasa latihan', 'Exercise language')}<select bind:value={language}
        ><option value="id">Indonesia</option><option value="en">English</option></select
      ></label
    >
    <label
      >{t('Penilaian', 'Assessment')}<select bind:value={mode}
        ><option value="manual">{t('Pendamping saja', 'Caregiver only')}</option><option value="ai"
          >AI {t('saja', 'only')}</option
        ></select
      ></label
    >
    <label
      >{t('Kategori', 'Category')}<select bind:value={category}
        ><option value="">{t('Semua', 'All')}</option><option value="mendengar"
          >{t('Mendengar', 'Listening')}</option
        ><option value="logika">{t('Logika', 'Reasoning')}</option></select
      ></label
    >
    <label
      >Level<select bind:value={level}
        ><option value="">{t('Semua', 'All')}</option><option value="1">1</option><option value="2"
          >2</option
        ></select
      ></label
    >
    <label
      >{t(
        'Bantuan pada jawaban pertama yang dapat dinilai',
        'Assistance at first assessable answer'
      )}<select bind:value={assistance}
        ><option value="">{t('Semua', 'All')}</option><option value="no"
          >{t('Tanpa bantuan tercatat', 'Without recorded assistance')}</option
        ><option value="yes">{t('Dengan bantuan', 'With assistance')}</option></select
      ></label
    >
    <label
      >{t('Pengalaman kartu · bahasa ini', 'Card experience · this language')}<select
        bind:value={experience}
        ><option value="">{t('Semua', 'All')}</option><option value="new"
          >{t('Belum pernah tuntas', 'Not completed before')}</option
        ><option value="repeat">{t('Pernah tuntas', 'Previously completed')}</option></select
      ></label
    >
    <label>{t('Dari · UTC', 'From · UTC')}<input type="date" bind:value={from} /></label><label
      >{t('Sampai · UTC', 'To · UTC')}<input type="date" bind:value={to} /></label
    >
  </div>
  <p class="fine-print">
    {filtered.length}
    {t(
      'sesi aktivitas pada filter profil, bahasa, kategori, level, dan tanggal; dapat mencakup kedua mode. Filter bantuan/pengalaman memengaruhi angka penilaian, bukan daftar histori.',
      'activity sessions for the profile, language, category, level and dates; may include both modes. Assistance/experience filters affect assessment metrics, not the history list.'
    )}
  </p>
  {#if tab === 'report'}
    <div class="metric-grid mt-5">
      <article class="metric-card">
        <span class="metric-label"
          >{t('Pertanyaan dapat dinilai', 'Assessable questions')} · {mode === 'ai'
            ? 'AI'
            : t('Pendamping', 'Caregiver')}</span
        ><strong>{rows.length}</strong><small
          >{t(
            'Pertama yang benar/salah per pertanyaan, per mode',
            'First correct/incorrect answer per question, per mode'
          )}</small
        >
      </article>
      <article class="metric-card">
        <span class="metric-label"
          >{t('Benar pada jawaban tersebut', 'Correct at that answer')}</span
        ><strong>{rows.length ? `${Math.round((100 * correct) / rows.length)}%` : '—'}</strong
        ><small>{correct}/{rows.length} {t('pertanyaan', 'questions')}</small>
      </article>
      <article class="metric-card">
        <span class="metric-label">{t('Dengan bantuan tercatat', 'With recorded assistance')}</span
        ><strong>{rows.filter((r) => r.assisted).length}</strong><small>n = {rows.length}</small>
      </article>
      <article class="metric-card">
        <span class="metric-label">{t('Waktu respons AI', 'AI response time')}</span><strong
          >{mode === 'ai' && times.length
            ? `${(times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(1)} s`
            : '—'}</strong
        ><small
          >{mode === 'ai'
            ? `n = ${times.length}`
            : t('Tidak diukur pada mode pendamping', 'Not measured in caregiver mode')}</small
        >
      </article>
    </div>
    <div class="chart-grid">
      <article class="chart-card">
        <h3>{t('Menurut jenis kemampuan', 'By question skill')}</h3>
        <p>
          {t(
            'Persentase benar pada jawaban pertama yang bisa dinilai; bukan skor kemampuan klinis.',
            'Correct at the first assessable answer; not a clinical ability score.'
          )}
        </p>
        <ProgressChart
          label={t('Benar (%)', 'Correct (%)')}
          labels={skills.map((s) => `${skillLabels[s.skill]} (n=${s.count})`)}
          values={skills.map((s) => (s.count ? Math.round((100 * s.correct) / s.count) : null))}
        />
        <p class="fine-print">
          {skills
            .map(
              (s) =>
                `${skillLabels[s.skill]}: ${s.count ? `${s.correct}/${s.count} (${Math.round((100 * s.correct) / s.count)}%)` : t('belum ada data', 'no data')}`
            )
            .join(' · ')}
        </p>
      </article>
      <article class="chart-card">
        <h3>{t('Jejak sesi · UTC', 'Practice over time · UTC')}</h3>
        <p>
          {t(
            'Tiap titik menampilkan jumlah data. Satu sesi kecil tidak membuktikan tren.',
            'Each point includes sample size. A small session does not establish a trend.'
          )}
        </p>
        <ProgressChart
          type="line"
          label={t('Benar (%)', 'Correct (%)')}
          labels={trend.map((r) => `${r.date} (n=${r.count})`)}
          values={trend.map((r) => r.accuracy)}
        />
      </article>
    </div>
    <p class="pilot-notice">
      {t(
        'Belum jelas, diam, dan respons lambat tidak cukup untuk menyimpulkan anak tidak paham atau kurang fokus. Bandingkan konteks bahasa, bantuan, dan pengalaman kartu yang sebanding.',
        'Unclear speech, silence, and slow responses do not establish lack of understanding or attention. Compare similar language, assistance, and card-experience contexts.'
      )}
    </p>
  {:else}<div class="history-list">
      {#each filtered as session}<details class="history-row">
          <summary
            ><span
              ><strong
                >{session.childName} · {session.cards.length}
                {t('kartu', 'cards')} · {session.language.toUpperCase()}</strong
              ><small
                >{new Date(session.startedAt).toLocaleString($uiLanguage)} · {session.status} · {session.attempts.filter(
                  (a) => a.mode === 'ai'
                ).length} AI / {session.attempts.filter((a) => a.mode === 'manual').length}
                {t('percobaan pendamping', 'caregiver attempts')}</small
              ></span
            ></summary
          >{#if ['active', 'paused'].includes(session.status)}<a
              class="button primary mt-4"
              href={`/latihan/${session.id}`}>{t('Lanjutkan sesi', 'Resume session')}</a
            >{/if}<SessionResults {session} onChange={update} />
        </details>{:else}<div class="empty-state">
          {t('Belum ada sesi untuk filter ini.', 'No sessions for these filters.')}
        </div>{/each}
    </div>{/if}
  <p class="fine-print">
    <a href="/pendamping?legacy=1"
      >{t(
        'Laporan format lama · 200 soal tetap tersimpan',
        'Legacy reports · 200-question history preserved'
      )} →</a
    >
  </p>
</div>
