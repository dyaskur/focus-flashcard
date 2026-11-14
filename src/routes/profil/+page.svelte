<script lang="ts">
  import { page } from '$app/state';
  import { enhance } from '$app/forms';
  import { UserRound, Plus, ArrowRight, Trash2, LogOut } from 'lucide-svelte';
  let { data, form } = $props();
  let selected = $derived(
    page.url.searchParams.get('baru') ? '' : (data.activeChildId ?? data.children[0]?.id ?? '')
  );
  const child = $derived(data.children.find((c) => c.id === selected));
  let confirmDelete = $state(false);
</script>

<div class="page-width inner-page">
  <span class="page-eyebrow">RUANG KELUARGA</span>
  <div class="section-heading">
    <div>
      <h1>Setiap anak, cerita berbeda.</h1>
      <p class="muted">Kenalan dulu, supaya ceritanya terasa lebih dekat.</p>
    </div>
    <form method="POST" action="?/logout">
      <button class="button ghost"><LogOut size={17} /> Keluar akun</button>
    </form>
  </div>
  <div class="profile-layout">
    <aside class="profile-list">
      <h3>Profil si kecil</h3>
      {#each data.children as c}<button
          class:active={selected === c.id}
          onclick={() => {
            selected = c.id;
            confirmDelete = false;
          }}
          ><span class="avatar">{c.name[0]}</span><span
            >{c.name}<small>{c.age ? `${c.age} tahun` : 'Si penjelajah kecil'}</small></span
          ></button
        >{/each}<button
        class="add-profile"
        onclick={() => {
          selected = '';
          confirmDelete = false;
        }}><Plus size={19} /> Tambah profil anak</button
      >
      <p class="fine-print">
        Hanya nama panggilan yang diperlukan. Jangan gunakan nama lengkap atau informasi sensitif.
      </p>
    </aside>
    <section class="form-card profile-form">
      <span class="pill"><UserRound size={14} />{child ? 'PROFIL ANAK' : 'TEMAN BARU'}</span>
      <h2>{child ? `Tentang ${child.name}` : 'Siapa nama panggilannya?'}</h2>
      {#key selected}<form action="?/save" method="POST" use:enhance>
          <input type="hidden" name="id" value={child?.id ?? ''} />
          <div class="form-grid">
            <label
              >Nama panggilan anak<input
                name="name"
                value={child?.name ?? ''}
                placeholder="Contoh: Ammar"
                required
                maxlength="40"
              /></label
            ><label
              >Usia <span class="optional">(opsional)</span><input
                name="age"
                type="number"
                min="1"
                max="18"
                value={child?.age ?? ''}
                placeholder="4–7 tahun"
              /></label
            ><label
              >Panggilan pendamping<input
                name="parentName"
                value={child?.parentName ?? ''}
                placeholder="Bunda"
                maxlength="40"
              /></label
            ><label
              >Nama teman<input
                name="friendName"
                value={child?.friendName ?? ''}
                placeholder="Lala"
                maxlength="40"
              /></label
            ><label
              >Nama hewan peliharaan<input
                name="petName"
                value={child?.petName ?? ''}
                placeholder="Milo"
                maxlength="40"
              /></label
            >
          </div>
          <p class="fine-print">
            Nama pendamping, teman, dan peliharaan boleh kosong. Kami akan memakai nama yang ramah
            sebagai pengganti.
          </p>
          {#if form?.message}<p role="alert" class="error-text">{form.message}</p>{/if}<button
            class="button primary">Simpan & mulai belajar<ArrowRight size={18} /></button
          >
        </form>{/key}{#if child}<div class="delete-area">
          {#if !confirmDelete}<button
              class="text-link danger"
              onclick={() => (confirmDelete = true)}
              ><Trash2 size={15} /> Hapus profil & riwayat</button
            >{:else}<p>
              Hapus {child.name} beserta seluruh riwayat belajar? Tindakan ini tidak dapat dibatalkan.
            </p>
            <form method="POST" action="?/delete">
              <input type="hidden" name="id" value={child.id} /><button class="button danger-button"
                >Ya, hapus permanen</button
              ><button type="button" class="button ghost" onclick={() => (confirmDelete = false)}
                >Batal</button
              >
            </form>{/if}
        </div>{/if}
    </section>
  </div>
</div>
