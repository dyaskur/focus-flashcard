<script lang="ts">
  import { getContext } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import type { LearningStores } from '$lib/stores';
  import type { Category } from '$lib/types';
  import Illustration from './Illustration.svelte';
  import {
    ArrowRight,
    Ear,
    Lightbulb,
    Star,
    Clock3,
    Mic,
    ShieldCheck,
    Sparkles,
    Heart
  } from 'lucide-svelte';
  let { authenticated = false }: { authenticated?: boolean } = $props();
  const { profile } = getContext<LearningStores>('learning');
  let category = $state<Category>('mendengar');
  let level = $derived($profile?.lastLevel ?? 1);
  let busy = $state(false);
  let message = $state('');
  const levels = [
    'Langkah pertama',
    'Mulai terbiasa',
    'Makin penasaran',
    'Berani mencoba',
    'Pemikir hebat'
  ];
  async function start() {
    if (!authenticated) return goto('/masuk?mode=register');
    if (!$profile) return goto('/profil?baru=1');
    busy = true;
    message = '';
    try {
      const session = await api<{ id: string }>('sessions', {
        childId: $profile.id,
        category,
        level
      });
      await goto(`/belajar/${session.id}`);
    } catch (e) {
      message = (e as Error).message;
      busy = false;
    }
  }
</script>

<div class="home-page page-width">
  <div class="page-eyebrow">
    <span class="green-dot"></span> RUANG BELAJAR SI KECIL <span class="eyebrow-line"></span>
    <span class="eyebrow-note">Belajar tanpa terburu-buru</span>
  </div>
  <section class="welcome-card">
    <div class="welcome-copy">
      <span class="pill"><Sparkles size={14} /> Petualangan kecil hari ini</span>
      <h1>
        {#if authenticated}Halo, {$profile?.name ?? 'teman kecil'}!<br />Siap
          <em>berpetualang?</em>{:else}Dengarkan cerita.<br />Temukan <em>keajaibannya.</em>{/if}
      </h1>
      <p>Sedikit mendengar, sedikit berpikir.<br />Banyak hal baru untuk ditemukan bersama.</p>
      <div class="hero-meta">
        <span><Clock3 size={15} /> 5–10 menit</span><span
          ><Heart size={15} /> Ditemani orang tua</span
        >
      </div>
    </div>
    <div class="hero-art">
      <span class="art-orbit orbit-one"></span><span class="art-orbit orbit-two"
      ></span><Illustration />
      <div class="art-label"><span>♪</span> Hai! Aku siap menemanimu.</div>
    </div>
    <span class="hero-corner decorative">✳</span>
  </section>

  <section class="choose-section" aria-labelledby="choose-title">
    <div class="section-heading">
      <div>
        <span class="step-label">01 <span>PILIH PETUALANGANMU</span></span>
        <h2 id="choose-title">Mau belajar apa hari ini?</h2>
      </div>
      {#if authenticated}<a class="button secondary" href="/pendamping?legacy=1"
          >Riwayat & laporan →</a
        >{:else}<span class="section-note"
          >Dua cara seru untuk bertumbuh <Sparkles size={15} /></span
        >{/if}
    </div>
    <div class="category-grid">
      <button
        class="category-card listening"
        class:selected={category === 'mendengar'}
        onclick={() => (category = 'mendengar')}
        aria-pressed={category === 'mendengar'}
        ><span class="card-top"
          ><span class="category-icon"><Ear size={22} /></span><span class="selection-dot"
            >{#if category === 'mendengar'}<span></span>{/if}</span
          ></span
        ><span class="category-content"
          ><span class="category-copy"
            ><span class="mini-label">DENGAR & BAYANGKAN</span><strong>Mendengar</strong><span
              >Cerita kecil untuk telinga<br />yang penuh rasa ingin tahu.</span
            ><span class="card-tags">Fokus <i>·</i> Ingatan <i>·</i> Pemahaman</span></span
          ><span class="category-art"><Illustration /></span></span
        ><span class="card-bottom">Yuk, pasang telinga! <ArrowRight size={18} /></span></button
      >
      <button
        class="category-card logic"
        class:selected={category === 'logika'}
        onclick={() => (category = 'logika')}
        aria-pressed={category === 'logika'}
        ><span class="card-top"
          ><span class="category-icon"><Lightbulb size={22} /></span><span class="selection-dot"
            >{#if category === 'logika'}<span></span>{/if}</span
          ></span
        ><span class="category-content"
          ><span class="category-copy"
            ><span class="mini-label">PIKIR & TEMUKAN</span><strong>Logika</strong><span
              >Pertanyaan seru untuk ide-ide<br />besar dari pemikir kecil.</span
            ><span class="card-tags">Sebab-akibat <i>·</i> Penalaran</span></span
          ><span class="category-art"><Illustration kind="fox" /></span></span
        ><span class="card-bottom">Ayo, temukan jawabannya! <ArrowRight size={18} /></span></button
      >
    </div>
  </section>

  <section class="level-section" aria-labelledby="level-title">
    <div class="section-heading">
      <div>
        <span class="step-label">02 <span>ATUR LANGKAH KECILMU</span></span>
        <h2 id="level-title">Mulai dari yang nyaman</h2>
      </div>
      <span class="section-note">Tidak perlu buru-buru naik level.</span>
    </div>
    <div class="level-options">
      {#each levels as label, index}<button
          class="level-option"
          class:selected={level === index + 1}
          onclick={() => (level = index + 1)}
          aria-pressed={level === index + 1}
          aria-label={`Bintang ${index + 1}, ${label}`}
          ><span class="stars"
            >{#each Array(index + 1) as _}<Star
                size={17}
                fill="currentColor"
                strokeWidth={1.4}
              />{/each}</span
          ><strong>Bintang {index + 1}</strong><small>{label}</small></button
        >{/each}
    </div>
  </section>

  <section class="start-strip">
    <div class="start-icon"><Mic size={24} /></div>
    <div class="start-copy">
      <strong>Sudah siap? Kita mulai, yuk!</strong>
      <p>
        {category === 'mendengar' ? 'Mendengar' : 'Logika'} <span>·</span> Bintang {level}
        <span>·</span> 5 cerita dalam satu sesi
      </p>
    </div>
    <button class="button primary" onclick={start} disabled={busy}
      >{busy ? 'Menyiapkan cerita…' : 'Mulai petualangan'} <ArrowRight size={19} /></button
    >
  </section>
  {#if message}<p class="error-text" role="alert">{message}</p>{/if}
  <div class="care-note">
    <ShieldCheck size={18} /><span
      >Ruang aman untuk belajar. Tidak ada nilai buruk, hanya kesempatan mencoba lagi.</span
    >
  </div>
  {#if !authenticated}<section id="cara-bermain" class="how-section">
      <span class="mini-label">SESEDERHANA SATU, DUA, TIGA</span>
      <h2>Biarkan rasa ingin tahu memimpin.</h2>
      <div class="how-grid">
        <div>
          <span>01</span>
          <h3>Kenalan dulu</h3>
          <p>Buat akun pendamping dan profil si kecil.</p>
        </div>
        <div>
          <span>02</span>
          <h3>Dengarkan bersama</h3>
          <p>AI membacakan cerita dan memberi waktu untuk berpikir.</p>
        </div>
        <div>
          <span>03</span>
          <h3>Ceritakan jawabanmu</h3>
          <p>Jawab dengan suara. Petunjuk hadir saat dibutuhkan.</p>
        </div>
      </div>
      <p class="muted">
        Suara diproses oleh Google Gemini dengan izin orang tua. Bukan alat diagnosis atau pengganti
        terapi.
      </p>
    </section>{/if}
</div>
