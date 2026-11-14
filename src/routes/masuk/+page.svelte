<script lang="ts">
  import { page } from '$app/state';
  import { enhance } from '$app/forms';
  import Illustration from '$lib/components/Illustration.svelte';
  import { ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-svelte';
  let { form } = $props();
  let register = $state(page.url.searchParams.get('mode') === 'register');
  let submitting = $state(false);
</script>

<div class="auth-page page-width">
  <div class="auth-story">
    <span class="pill">UNTUK ORANG TUA & PENDAMPING</span>
    <h1>Temani langkah kecil.<br /><em>Rayakan setiap usaha.</em></h1>
    <p>Sebuah ruang untuk mendengar, berpikir, dan tumbuh dengan caranya sendiri.</p>
    <Illustration /><span class="care-note"
      ><ShieldCheck size={18} /> Tanpa rekaman suara tersimpan.</span
    >
  </div>
  <section class="form-card">
    <a class="text-link" href="/"><ArrowLeft size={15} /> Kembali ke ruang belajar</a>
    <div class="tabs">
      <button class:active={!register} onclick={() => (register = false)}>Masuk</button><button
        class:active={register}
        onclick={() => (register = true)}>Buat akun</button
      >
    </div>
    <h2>{register ? 'Senang berkenalan!' : 'Selamat datang kembali.'}</h2>
    <p class="muted">
      {register
        ? 'Mulai petualangan belajar bersama si kecil.'
        : 'Masuk ke ruang belajar keluarga Anda.'}
    </p>
    <form
      method="POST"
      use:enhance={() => {
        submitting = true;
        return async ({ update }) => {
          await update();
          submitting = false;
        };
      }}
    >
      <input
        type="hidden"
        name="mode"
        value={register ? 'register' : 'login'}
      />{#if register}<label
          >Nama pendamping<input
            name="name"
            autocomplete="name"
            placeholder="Nama Anda"
            required
            minlength="2"
            maxlength="60"
          /></label
        >{/if}<label
        >Email<input
          name="email"
          type="email"
          autocomplete="email"
          placeholder="nama@email.com"
          required
          maxlength="254"
        /></label
      ><label
        >Kata sandi<input
          name="password"
          type="password"
          autocomplete={register ? 'new-password' : 'current-password'}
          placeholder="Minimal 8 karakter"
          minlength="8"
          maxlength="128"
          required
        /></label
      >{#if register}<label class="checkbox-label"
          ><input name="consent" type="checkbox" required /><span
            >Saya orang tua/pendamping dan menyetujui pemrosesan suara melalui Google Gemini. Saya
            telah membaca <a href="/privasi">kebijakan privasi</a>.</span
          ></label
        >{/if}{#if form?.message}<p class="error-text" role="alert">{form.message}</p>{/if}<button
        class="button primary full"
        disabled={submitting}
        >{submitting
          ? 'Sebentar, ya…'
          : register
            ? 'Buat akun pendamping'
            : 'Masuk ke ruang belajar'}<ArrowRight size={18} /></button
      >
    </form>
    <p class="fine-print">
      Akun hanya untuk orang dewasa. Anak selalu belajar dengan pendampingan.
    </p>
  </section>
</div>
