<script lang="ts">
  import { page } from '$app/state';
  import { invalidateAll } from '$app/navigation';
  import { api } from '$lib/api';
  import {
    BookOpen,
    Target,
    Clock3,
    Lightbulb,
    ArrowUpRight,
    ChevronDown,
    Ear
  } from 'lucide-svelte';
  import ProgressChart from '$lib/components/ProgressChart.svelte';
  import type { Verdict } from '$lib/types';
  import PilotReport from '$lib/pilot/PilotReport.svelte';
  let { data } = $props();
  let message = $state('');
  const metrics = $derived(data.metrics);
  const historyMode = $derived(page.url.searchParams.get('tab') === 'riwayat');
  const verdictLabels: Record<Verdict, string> = {
    correct: 'Benar',
    incorrect: 'Belum tepat',
    unclear: 'Belum jelas',
    skipped: 'Dilewati'
  };
  const statusLabels: Record<string, string> = {
    active: 'Berlangsung',
    paused: 'Dijeda',
    completed: 'Selesai',
    stopped: 'Dihentikan'
  };
  async function correct(sessionId: string, attemptId: string, event: Event) {
    try {
      await api(`sessions/${sessionId}/correct`, {
        attemptId,
        verdict: (event.target as HTMLSelectElement).value
      });
      await invalidateAll();
    } catch (e) {
      message = (e as Error).message;
    }
  }
</script>

<svelte:head><title>Ruang pendamping — Fokus</title></svelte:head>
{#if !page.url.searchParams.has('legacy')}<PilotReport
    sessions={data.practices}
    children={data.children}
  />{:else}
  <div class="page-width inner-page">
    <span class="page-eyebrow">BERSAMA, MELIHAT SI KECIL BERTUMBUH</span>
    <div class="section-heading">
      <div>
        <h1>Setiap langkah punya cerita.</h1>
        <p class="muted">Bukan tentang sempurna. Tentang keberanian untuk terus mencoba.</p>
      </div>
      <a href="/profil" class="button ghost">Kelola profil <ArrowUpRight size={16} /></a>
    </div>
    <nav class="dashboard-tabs" aria-label="Laporan">
      <a href="/pendamping?legacy=1" class:active={!historyMode}>Ringkasan belajar</a><a
        href="/pendamping?legacy=1&tab=riwayat"
        class:active={historyMode}>Riwayat & koreksi</a
      >
    </nav>
    <form class="filter-row" method="GET">
      <input type="hidden" name="legacy" value="1" />
      <input type="hidden" name="tab" value={historyMode ? 'riwayat' : 'ringkasan'} /><label
        >Profil anak<select name="child" value={page.url.searchParams.get('child') ?? ''}
          ><option value="">Semua anak</option>{#each data.children as child}<option
              value={child.id}>{child.name}</option
            >{/each}</select
        ></label
      ><label
        >Kategori<select name="category" value={page.url.searchParams.get('category') ?? ''}
          ><option value="">Semua kategori</option><option value="mendengar">Mendengar</option
          ><option value="logika">Logika</option></select
        ></label
      ><label
        >Level<select name="level" value={page.url.searchParams.get('level') ?? ''}
          ><option value="">Semua level</option>{#each [1, 2, 3, 4, 5] as level}<option
              value={level}>Bintang {level}</option
            >{/each}</select
        ></label
      ><label
        >Dari tanggal<input
          name="from"
          type="date"
          value={page.url.searchParams.get('from') ?? ''}
        /></label
      ><label
        >Sampai tanggal<input
          name="to"
          type="date"
          value={page.url.searchParams.get('to') ?? ''}
        /></label
      ><button class="button secondary">Terapkan</button>
    </form>
    {#if message}<p class="error-text" role="alert">{message}</p>{/if}
    {#if !historyMode}<div class="metric-grid">
        <article class="metric-card">
          <span class="metric-label">Sesi selesai<BookOpen size={16} /></span><strong
            data-testid="sessions-count">{metrics.completedSessions}</strong
          ><small>{metrics.questions} soal dijelajahi</small>
        </article>
        <article class="metric-card">
          <span class="metric-label">Akurasi percobaan pertama<Target size={16} /></span><strong
            data-testid="accuracy">{metrics.accuracy}%</strong
          ><small>{metrics.correct} benar tanpa percobaan ulang</small>
        </article>
        <article class="metric-card">
          <span class="metric-label">Rata-rata waktu respons<Clock3 size={16} /></span><strong
            >{metrics.responseTimeMs === null
              ? '—'
              : `${(metrics.responseTimeMs / 1000).toFixed(1)} dtk`}</strong
          ><small>Dari akhir pertanyaan ke awal ucapan</small>
        </article>
        <article class="metric-card">
          <span class="metric-label">Belajar dengan petunjuk<Lightbulb size={16} /></span><strong
            >{metrics.questions
              ? Math.round((metrics.hints / metrics.questions) * 100)
              : 0}%</strong
          ><small>{metrics.hints} soal menggunakan bantuan</small>
        </article>
      </div>
      {#if !metrics.questions}<div class="empty-state">
          <BookOpen size={29} class="mx-auto" />
          <h3>Cerita pertamanya belum dimulai.</h3>
          <p>
            Setelah si kecil berlatih, jejak belajarnya akan muncul di sini. Tidak ada data contoh
            yang ditampilkan.
          </p>
          <a href="/beranda" class="button primary"
            >Mulai cerita pertama<ArrowUpRight size={16} /></a
          >
        </div>{/if}
      <div class="chart-grid">
        <article class="chart-card">
          <h3>Langkah di setiap bintang</h3>
          <p>Akurasi jawaban pada percobaan pertama, per level.</p>
          <ProgressChart
            labels={metrics.levels.map((r) => `Bintang ${r.level}`)}
            values={metrics.levels.map((r) => (r.count ? r.accuracy : null))}
          />
        </article>
        <article class="chart-card">
          <h3>Dua cara bertumbuh</h3>
          <p>Akurasi berdasarkan kategori belajar.</p>
          <ProgressChart
            labels={['Mendengar', 'Logika']}
            values={metrics.categories.map((r) => (r.count ? r.accuracy : null))}
            colors={['#9cbac9', '#e4b67c']}
          />
        </article>
        <article class="chart-card">
          <h3>Jejak kecil dari waktu ke waktu</h3>
          <p>Akurasi harian · zona waktu Jakarta.</p>
          <ProgressChart
            type="line"
            labels={metrics.trend.map((r) => r.date)}
            values={metrics.trend.map((r) => r.accuracy)}
          />
        </article>
        <article class="chart-card">
          <h3>Waktu untuk berpikir</h3>
          <p>Rata-rata waktu respons per kategori, dalam detik.</p>
          <ProgressChart
            labels={['Mendengar', 'Logika']}
            values={metrics.categories.map((r) =>
              r.responseTimeMs === null ? null : r.responseTimeMs / 1000
            )}
            colors={['#9cbac9', '#e4b67c']}
            percentage={false}
            label="Waktu respons (detik)"
          />
        </article>
      </div>
      <div class="chart-card mt-5">
        <h3>Ritme di setiap level</h3>
        <p>Waktu respons rata-rata per level, dalam detik.</p>
        <ProgressChart
          labels={metrics.levels.map((r) => `Bintang ${r.level}`)}
          values={metrics.levels.map((r) =>
            r.responseTimeMs === null ? null : r.responseTimeMs / 1000
          )}
          percentage={false}
          label="Waktu respons (detik)"
        />
      </div>
      <p class="fine-print">
        Level paling sering dipilih: {metrics.mostUsedLevel
          ? `Bintang ${metrics.mostUsedLevel}`
          : 'belum ada'}. {metrics.skipped} soal dilewati · {metrics.unclear} belum jelas. Keduanya bukan
        jawaban salah. Akurasi = benar pada percobaan pertama ÷ soal dengan penilaian benar/salah pada
        percobaan pertama. Waktu respons dihitung per soal pada percobaan pertama yang tersedia.
      </p>
    {:else}<p class="muted">
        Buka sesi untuk melihat tiap percobaan dan memperbaiki penilaian AI bila diperlukan. Ucapan
        dan rekaman suara tidak disimpan.
      </p>
      <div class="history-list">
        {#each data.history as { session, child }}<details class="history-row">
            <summary
              ><span class="category-icon"
                >{#if session.category === 'mendengar'}<Ear size={19} />{:else}<Lightbulb
                    size={19}
                  />{/if}</span
              ><span
                ><strong
                  >{child.name} · {session.category === 'mendengar'
                    ? 'Mendengar'
                    : 'Logika'}</strong
                ><small
                  >Bintang {session.level} · {new Date(session.startedAt).toLocaleString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}</small
                ></span
              ><span class="badge">{statusLabels[session.status]}</span><ChevronDown
                size={15}
              /></summary
            >{#each data.attempts.filter((a) => a.sessionId === session.id) as attempt}<div
                class="attempt-row"
              >
                <span
                  >Soal {session.questionIds.indexOf(attempt.questionId) + 1} · Percobaan {attempt.attemptNumber}<small
                    >{attempt.responseTimeMs === null
                      ? 'Waktu tidak tersedia'
                      : `${(attempt.responseTimeMs / 1000).toFixed(1)} detik`}{attempt.hintUsed
                      ? ' · Dengan petunjuk'
                      : ''}{attempt.corrected ? ' · Dikoreksi pendamping' : ''}</small
                  ></span
                ><strong>{verdictLabels[attempt.verdict]}</strong
                >{#if attempt.verdict !== 'skipped'}<select
                    aria-label={`Koreksi soal ${session.questionIds.indexOf(attempt.questionId) + 1} percobaan ${attempt.attemptNumber}`}
                    value={attempt.verdict}
                    onchange={(event) => correct(session.id, attempt.id, event)}
                    ><option value="correct">Benar</option><option value="incorrect"
                      >Belum tepat</option
                    ><option value="unclear">Belum jelas</option></select
                  >{/if}
              </div>{/each}{#if !data.attempts.some((a) => a.sessionId === session.id)}<p
                class="fine-print"
              >
                Belum ada jawaban tercatat.
              </p>{/if}{#if ['active', 'paused'].includes(session.status)}<a
                class="button secondary mt-4"
                href={`/belajar/${session.id}`}>Lanjutkan sesi<ArrowUpRight size={16} /></a
              >{/if}
          </details>{:else}<div class="empty-state">
            <h3>Belum ada sesi belajar.</h3>
            <p>Petualangan si kecil akan tercatat di sini.</p>
          </div>{/each}
      </div>{/if}
    <p class="care-note">
      <Lightbulb size={16} /> Data ini membantu mendampingi latihan, bukan penilaian klinis atau diagnosis
      perkembangan anak.
    </p>
  </div>
{/if}
