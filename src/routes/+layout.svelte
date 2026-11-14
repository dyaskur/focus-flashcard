<script lang="ts">
  import '../app.css';
  import { setContext } from 'svelte';
  import { page } from '$app/state';
  import { invalidateAll } from '$app/navigation';
  import { createLearningStores } from '$lib/stores';
  import { api } from '$lib/api';
  import { Leaf, ArrowUpRight, BookOpen, WifiOff } from 'lucide-svelte';
  import { onMount } from 'svelte';
  let { data, children } = $props();
  const stores = createLearningStores();
  setContext('learning', stores);
  const { profile, sensoryMode } = stores;
  const activeChild = $derived(
    data.children.find((c) => c.id === data.activeChildId) ?? data.children[0] ?? null
  );
  let modeError = $state('');
  let online = $state(true);
  let mounted = $state(false);
  const inSession = $derived(page.url.pathname.startsWith('/belajar/'));
  $effect(() => {
    profile.set(activeChild);
    sensoryMode.set(activeChild?.sensoryMode ?? false);
  });
  $effect(() => {
    document.documentElement.classList.toggle('sensory', $sensoryMode);
  });
  onMount(() => {
    mounted = true;
    const update = () => (online = navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  });
  async function toggleMode() {
    const next = !$sensoryMode;
    sensoryMode.set(next);
    modeError = '';
    if (activeChild)
      try {
        await api(`children/${activeChild.id}`, { sensoryMode: next });
      } catch (e) {
        modeError = (e as Error).message;
      }
  }
  async function selectChild(event: Event) {
    try {
      await api(`children/${(event.target as HTMLSelectElement).value}`, { select: true });
      await invalidateAll();
    } catch (e) {
      modeError = (e as Error).message;
    }
  }
</script>

<svelte:head
  ><title>Fokus, Dengar, dan Pikir — Bertumbuh lewat cerita</title><meta
    name="description"
    content="Teman belajar interaktif berbahasa Indonesia. Dengarkan cerita, temukan jawaban, dan tumbuh bersama dengan pendampingan orang tua."
  /></svelte:head
>
<a class="skip-link" href="#main">Langsung ke isi</a>
<header class="site-header">
  <a
    href={data.user ? '/beranda' : '/'}
    class="brand"
    aria-label="Fokus, Dengar, dan Pikir, beranda"
    ><span class="brand-icon"><BookOpen size={22} strokeWidth={2.3} /></span><span
      >fokus<span class="brand-dot">.</span><small>dengar & pikir</small></span
    ></a
  >
  {#if !inSession}<nav aria-label="Navigasi utama">
      <a
        class:active={page.url.pathname === '/beranda' || page.url.pathname === '/'}
        href={data.user ? '/beranda' : '/'}>Ruang belajar</a
      ><a
        class:active={page.url.pathname === '/pendamping'}
        href={data.user ? '/pendamping' : '/#cara-bermain'}
        >{data.user ? 'Untuk pendamping' : 'Cara bermain'}</a
      >
    </nav>{/if}
  <div class="header-actions">
    {#if data.children.length > 1 && !inSession}<select
        aria-label="Pilih profil anak"
        value={activeChild?.id}
        onchange={selectChild}
        style="width:auto;max-width:110px;margin:0;font-size:11px"
        ><option disabled>Pilih anak</option>{#each data.children as child}<option value={child.id}
            >{child.name}</option
          >{/each}</select
      >{/if}
    <button
      class="quiet-toggle"
      role="switch"
      aria-checked={$sensoryMode}
      disabled={!mounted}
      onclick={toggleMode}
      ><Leaf size={17} /><span>Bebas distraksi</span><span class="switch" class:on={$sensoryMode}
        ><i></i></span
      ></button
    >
    {#if data.user && !inSession}<a class="avatar" href="/profil" aria-label="Profil dan pengaturan"
        >{(activeChild?.name ?? data.user.name).slice(0, 1).toUpperCase()}</a
      >{:else if !data.user}<a class="header-login" href="/masuk"
        >Masuk <ArrowUpRight size={16} /></a
      >{/if}
  </div>
</header>
{#if !online}<div class="offline-banner" role="status">
    <WifiOff size={17} /> Kamu sedang offline. Latihan suara membutuhkan internet. Hasil yang sudah tersimpan
    tetap aman.
  </div>{/if}
{#if modeError}<div class="notice" role="alert">
    Mode berubah di perangkat ini, tetapi belum tersimpan: {modeError}
  </div>{/if}
<main id="main" inert={!mounted}>{@render children()}</main>
<noscript
  ><p class="notice">Aktifkan JavaScript untuk menggunakan ruang belajar dan mikrofon.</p></noscript
>
{#if !inSession}<footer class="site-footer">
    <span class="footer-brand"><Leaf size={16} /> Langkah kecil, tumbuh bersama.</span><span
      >Dirancang untuk usia 4–7 tahun · Selalu bersama pendamping</span
    ><a href="/privasi">Privasi & keamanan</a>
  </footer>{/if}
