<script lang="ts">
  import '../app.css';
  import { setContext, untrack } from 'svelte';
  import { page } from '$app/state';
  import { invalidateAll } from '$app/navigation';
  import { createLearningStores } from '$lib/stores';
  import { api } from '$lib/api';
  import { Leaf, ArrowUpRight, BookOpen, WifiOff } from 'lucide-svelte';
  import { onMount } from 'svelte';
  let { data, children } = $props();
  const stores = createLearningStores();
  setContext('learning', stores);
  const { profile, sensoryMode, uiLanguage } = stores;
  uiLanguage.set(untrack(() => data.uiLanguage));
  const t = (id: string, en: string) => ($uiLanguage === 'en' ? en : id);
  const activeChild = $derived(
    data.children.find((c) => c.id === data.activeChildId) ?? data.children[0] ?? null
  );
  let modeError = $state('');
  let online = $state(true);
  let mounted = $state(false);
  let savingPreference = $state(false);
  let savingLanguage = $state(false);
  const inSession = $derived(/^\/(belajar|latihan)\//.test(page.url.pathname));
  $effect(() => {
    profile.set(activeChild);
    sensoryMode.set(activeChild?.sensoryMode ?? false);
  });
  $effect(() => {
    document.documentElement.classList.toggle('sensory', $sensoryMode);
  });
  $effect(() => {
    document.documentElement.lang = $uiLanguage;
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
    if (savingPreference) return;
    savingPreference = true;
    const next = !$sensoryMode;
    sensoryMode.set(next);
    modeError = '';
    if (activeChild)
      try {
        await api(`children/${activeChild.id}`, { sensoryMode: next });
      } catch (e) {
        modeError = (e as Error).message;
      }
    savingPreference = false;
  }
  async function selectChild(event: Event) {
    const select = event.target as HTMLSelectElement;
    try {
      await api(`children/${select.value}`, { select: true });
      await invalidateAll();
    } catch (e) {
      select.value = activeChild?.id ?? '';
      modeError = (e as Error).message;
    }
  }
  async function changeLanguage(event: Event) {
    if (savingLanguage) return;
    const select = event.target as HTMLSelectElement;
    const next = select.value as 'id' | 'en';
    savingLanguage = true;
    try {
      if (data.user) await api('preferences', { uiLanguage: next });
      uiLanguage.set(next);
    } catch (e) {
      select.value = $uiLanguage;
      modeError = (e as Error).message;
    } finally {
      savingLanguage = false;
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
        href={data.user ? '/beranda' : '/'}>{t('Ruang belajar', 'Flashcards')}</a
      ><a
        class:active={page.url.pathname === '/pendamping'}
        href={data.user ? '/pendamping' : '/#cara-bermain'}
        >{data.user ? t('Laporan', 'Reports') : 'Cara bermain'}</a
      >
    </nav>{/if}
  <div class="header-actions">
    <select
      aria-label="Bahasa antarmuka / Interface language"
      class="interface-language"
      value={$uiLanguage}
      disabled={savingLanguage}
      onchange={changeLanguage}><option value="id">ID</option><option value="en">EN</option></select
    >
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
      disabled={!mounted || savingPreference}
      onclick={toggleMode}
      ><Leaf size={17} /><span>{t('Bebas distraksi', 'Low distraction')}</span><span
        class="switch"
        class:on={$sensoryMode}><i></i></span
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
    <WifiOff size={17} />
    {t(
      'Sedang offline. Kedua mode pilot membutuhkan internet. Hasil yang sudah tersimpan tetap aman.',
      'Offline. Both pilot modes require internet. Previously saved results are safe.'
    )}
  </div>{/if}
{#if modeError}<div class="notice" role="alert">
    Mode berubah di perangkat ini, tetapi belum tersimpan: {modeError}
  </div>{/if}
<main id="main" inert={!mounted}>
  {#key page.params.id}{@render children()}{/key}
</main>
<noscript
  ><p class="notice">Aktifkan JavaScript untuk menggunakan ruang belajar dan mikrofon.</p></noscript
>
{#if !inSession}<footer class="site-footer">
    <span class="footer-brand"
      ><Leaf size={16} />
      {t('Langkah kecil, tumbuh bersama.', 'Small steps, growing together.')}</span
    ><span
      >{t(
        'Dirancang untuk usia 4–7 tahun · Selalu bersama pendamping',
        'Designed for ages 4–7 · Always with a caregiver'
      )}</span
    >{#if data.user}<a href="/pendamping">{t('Laporan', 'Reports')}</a>{/if}<a href="/privasi"
      >{t('Privasi & keamanan', 'Privacy & safety')}</a
    >
  </footer>{/if}
