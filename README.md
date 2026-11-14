# Fokus, Dengar, dan Pikir

Aplikasi latihan mendengar dan logika berbahasa Indonesia untuk anak usia 4–7 tahun, **selalu bersama orang tua atau pendamping**. Bukan alat diagnosis atau pengganti terapi.

Implementasi mencakup akun pendamping, beberapa profil anak, 200 soal, sesi lima soal, Gemini Live dua arah, petunjuk otomatis, koreksi pendamping, dashboard PostgreSQL, mode bebas distraksi, dan PWA.

**Status verifikasi:** aplikasi, database, build, serta alur browser dengan adapter pengujian sudah dijalankan. Koneksi dan streaming audio Gemini nyata sudah diuji di Chromium dengan input mikrofon hening sintetis; percakapan dua arah serta perilaku mikrofon/speaker fisik **belum terverifikasi**. Production tidak mengganti Gemini dengan suara atau penilaian palsu.

## Menjalankan secara lokal

Gunakan Node.js 24 LTS, npm, PostgreSQL 16+, dan browser modern yang mendukung AudioWorklet. Mikrofon memerlukan HTTPS atau localhost.

```sh
npm ci
cp .env.example .env
createdb fokus
```

Sesuaikan `.env` dengan database lokal Anda:

| Variabel            | Kegunaan                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`      | URL PostgreSQL, termasuk pengguna, kata sandi bila diperlukan, host, port, dan nama database            |
| `GEMINI_API_KEY`    | Kunci Gemini server-side dengan akses Live API; jangan gunakan awalan `PUBLIC_`                         |
| `GEMINI_LIVE_MODEL` | Default `gemini-3.8-live`; pilih model native audio yang mendukung function calling dan ephemeral token |
| `ORIGIN`            | Origin aplikasi, lokal `http://localhost:5173`; production harus origin HTTPS sebenarnya                |

```sh
npm run db:migrate
npm run db:seed
npm run dev
```

Buka port 5173 pada mesin yang menjalankan aplikasi. Buat akun pendamping, tambahkan nama panggilan anak, lalu pilih kategori dan level. Nama pendamping, teman, hewan peliharaan, dan usia boleh kosong. Aplikasi memakai fallback nama yang natural.

Seed dapat dijalankan ulang: ID soal stabil dan menggunakan upsert. Distribusinya tepat 100 Mendengar dan 100 Logika, masing-masing 20 soal per level 1–5. Tidak ada akun bawaan atau data hasil belajar contoh.

## Mengaktifkan percakapan suara

1. Isi `GEMINI_API_KEY` di lingkungan server dan pastikan proyek Google memiliki akses, kuota, serta billing yang sesuai.
2. Restart server setelah mengubah environment.
3. Masuk sebagai pendamping dan mulai sesi. Setujui pemrosesan suara oleh Google Gemini, lalu tekan **Aktifkan mikrofon & mulai** dan izinkan mikrofon browser.
4. Gemini membacakan cerita dan pertanyaan. Jawab dengan suara. Pengulangan, lewati, jeda, lanjutkan, dan selesai tersedia di layar.

Server menerbitkan token sekali pakai dengan batas waktu membuka sesi 60 detik dan masa token 30 menit. Model, instruksi, rubrik, dan fungsi `report_answer` dikunci oleh token; kunci utama tidak dikirim ke browser. Browser memakai WebSocket constrained v1beta langsung ke Gemini. Satu koneksi digunakan kembali untuk lima soal, dengan session resumption saat tersedia.

Audio mikrofon di-resample dari sample rate perangkat menjadi PCM16 mono 16 kHz oleh AudioWorklet. Playback memakai antrean PCM16 24 kHz. VAD mikrofon menghentikan timer bantuan saat ucapan dimulai; interupsi membuang antrean suara AI. Resource dilepas saat sesi berakhir atau halaman ditinggalkan.

Jika key belum diisi, UI menampilkan pesan konfigurasi yang jelas. Tidak ada fallback browser SpeechRecognition/SpeechSynthesis, TTS/STT terpisah, atau simulasi percakapan pada production. Permintaan ulang/petunjuk tidak dicatat sebagai jawaban. Jawaban tidak jelas meminta pengulangan, bukan otomatis dianggap salah.

Referensi: [Live API](https://ai.google.dev/gemini-api/docs/live-api), [kapabilitas](https://ai.google.dev/gemini-api/docs/live-api/capabilities), [ephemeral token](https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens).

## Arsitektur

| Bagian             | Implementasi                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| UI dan routing     | SvelteKit 3, Svelte 5, TypeScript, Tailwind 4, adapter Node                                                        |
| State              | `src/lib/stores.ts`: `writable` dan `derived`, dibuat per layout agar data pengguna tidak berbagi singleton server |
| Personalisasi      | `src/lib/personalize.ts`: template asli tetap utuh; teks, jawaban valid, dan petunjuk dipersonalisasi konsisten    |
| Akun dan akses     | `src/lib/server/auth.ts`, form actions, `src/hooks.server.ts`                                                      |
| Database           | `src/lib/server/schema.ts`, migrations di `drizzle/`, skrip migrate/seed di `scripts/`                             |
| Sesi dan penilaian | `src/lib/server/learning.ts`, `src/lib/evaluation.ts`, `src/lib/session-state.ts`                                  |
| HTTP               | `src/routes/api/[...path]/+server.ts`: profil, sesi, attempt, token, aksi, koreksi                                 |
| Gemini dan audio   | `src/lib/server/gemini.ts`, `src/lib/live/`, `static/audio-worklet.js`                                             |
| Konten             | `src/lib/content/questions.ts`: 200 soal eksplisit dengan alternatif jawaban dan metadata petunjuk                 |
| Analitik           | `src/lib/analytics.ts`, route `/pendamping`, Chart.js yang dimuat saat diperlukan                                  |
| PWA                | `src/service-worker/`, `static/manifest.webmanifest`, ikon lokal, `static/offline.html`                            |

Database memiliki foreign key, indeks pemilik/tanggal, batas level, serta constraint unik event dan nomor percobaan. Penulisan attempt dan perpindahan cursor memakai transaksi dan row lock. Retry event yang sama mengembalikan hasil tersimpan; usaha lisan baru tetap merupakan percobaan terpisah. Query profil dan hasil dibatasi oleh pemilik akun.

State sesi eksplisit memisahkan penyajian, menunggu jawaban, penilaian, feedback, jeda, reconnect, error, dan selesai. Timer bantuan tujuh detik dimulai setelah playback selesai, bukan saat AI mulai berbicara. Petunjuk memakai piktogram relevan dan deskripsi per soal; maskot SVG dibuat lokal. Ini bukan perpustakaan 200 ilustrasi SVG khusus.

## Definisi laporan

- **Akurasi:** soal benar pada percobaan pertama ÷ soal yang percobaan pertamanya dinilai benar/salah. Percobaan pertama yang belum jelas atau dilewati tidak masuk penyebut. Retry tidak menaikkan akurasi percobaan pertama.
- **Waktu respons:** akhir pertanyaan diputar sampai aktivitas suara anak pertama kali terdeteksi. Pengulangan/jeda memulai batas waktu yang baru. Dashboard merata-ratakan waktu percobaan pertama yang tersedia, tidak memasukkan soal dilewati.
- **Bantuan:** soal yang menggunakan petunjuk pada salah satu percobaan ÷ soal yang sudah memiliki percobaan. Jawaban salah memicu bantuan; diam tujuh detik menampilkan petunjuk tanpa mencatat jawaban salah.
- **Sesi selesai:** seluruh lima soal sudah dijawab benar atau dilewati. Sesi dihentikan dibedakan dari sesi selesai.
- **Perkembangan:** akurasi per hari, kategori, dan level; rata-rata waktu per kategori dan level; jumlah soal, benar, bantuan, belum jelas, dilewati, serta level paling sering dikerjakan. Tanggal memakai zona waktu Jakarta.

Filter tersedia untuk profil, kategori, level, dan tanggal sesi dimulai. Koreksi pendamping mengubah verdict sambil mempertahankan verdict asli dan tanda koreksi. Angka ini membantu latihan, bukan ukuran klinis.

## Privasi dan keamanan

- Kata sandi di-hash menggunakan scrypt dan salt acak. Token sesi acak hanya disimpan sebagai hash di database, dengan expiry 30 hari. Cookie HttpOnly, SameSite=Lax, dan Secure pada HTTPS.
- Mutasi mensyaratkan Origin yang sama. Autentikasi, kepemilikan, validasi Zod, serta rate limiting database diterapkan pada endpoint sensitif. Token suara dibatasi 10 permintaan per akun per menit, termasuk permintaan yang ditolak.
- Audio mentah dan transkrip percakapan **tidak disimpan** oleh aplikasi. Teks jawaban diproses sementara untuk evaluasi; database menyimpan verdict, nomor percobaan, waktu, dan pemakaian bantuan, bukan ucapan anak.
- Google memproses audio dan teks cerita/rubrik yang diperlukan, termasuk nama panggilan hasil personalisasi. Email, usia, dan riwayat tidak dikirim ke Gemini. Jangan memasukkan nama lengkap atau data sensitif ke profil.
- Menghapus profil menghapus seluruh sesi dan attempt melalui cascade. Halaman pribadi dan respons API memakai `private, no-store` dan tidak masuk cache service worker.
- Pengelola wajib meninjau ketentuan Google dan persetujuan/pemrosesan data anak yang berlaku sebelum penggunaan publik. Instruksi child-safe bukan jaminan bahwa keluaran AI selalu tepat; pendamping tetap diperlukan.

## Pengujian

```sh
npm run check
npm run lint
npm test
npm run build
```

Tanpa `TEST_DATABASE_URL`, pengujian PostgreSQL dilewati secara eksplisit. Untuk integrasi dan Playwright, gunakan **database terpisah yang boleh diisi data uji**, bukan database production:

```sh
createdb fokus_test
export TEST_DATABASE_URL=postgres://localhost:5432/fokus_test
DATABASE_URL="$TEST_DATABASE_URL" npm run db:migrate
DATABASE_URL="$TEST_DATABASE_URL" npm run db:seed
TEST_DATABASE_URL="$TEST_DATABASE_URL" npm test
npx playwright install chromium
TEST_DATABASE_URL="$TEST_DATABASE_URL" npm run test:e2e
```

Playwright menjalankan server tersendiri pada port 5174, memakai database uji dan adapter tutor deterministik. Adapter hanya dipilih bila `TEST_GEMINI_ADAPTER=1` **dan** server bukan production; banner pengujian selalu terlihat. Jangan mengaktifkannya pada server normal. E2E tidak mengakses mikrofon atau Gemini asli dan tidak membuktikan kualitas percakapan audio.

Pengujian meliputi distribusi dan kelengkapan 200 soal, placeholder, normalisasi tanpa substring false positive, semantik terstruktur, timer, state transitions, PCM/resampling/playback, serialisasi token SDK, reconnect/cleanup, idempotency bersamaan, ownership/cascade database, pendaftaran/login, profil, retry, hint, completion, dashboard/koreksi, sensory persistence, CSRF, dan batas token. Screenshot browser tersimpan di `test-results/`.

## Production dan PWA

```sh
npm ci
npm run build
NODE_ENV=production HOST=0.0.0.0 PORT=3000 ORIGIN=https://contoh.domain npm start
```

Sediakan `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_LIVE_MODEL`, dan `ORIGIN` di lingkungan hosting. Terapkan migration dan seed sebelum membuka layanan. Gunakan reverse proxy HTTPS, koneksi PostgreSQL yang aman, backup, dan pengawasan kuota Google. Jalankan pada root domain; AudioWorklet memakai `/audio-worklet.js`.

Manifest dan service worker mendukung pemasangan pada browser yang memenuhi syarat. Service worker menyimpan aset statis dan halaman fallback offline, bukan halaman akun atau data anak. UI fallback memberi tahu bahwa suara memerlukan internet. Ini **bukan** mode Gemini offline. Pemasangan fisik pada iOS/Android belum diuji.

SvelteKit saat ini mengeluarkan peringatan deprecation untuk alias `$lib` dan peringatan konfigurasi service-worker terkait ekstensi `.json`; type checking, dev server, build service worker, dan pemeriksaan offline tetap berhasil. Ekstensi eksplisit dipakai agar resolver Vite dapat memuat konfigurasi dengan benar.

## Batas yang belum terverifikasi

- Sesi nyata dengan API key: kualitas bahasa Indonesia, evaluasi ucapan anak, latency, echo/barge-in fisik, izin perangkat, dan reconnect jaringan nyata.
- Safari/iOS/Android fisik dan proses pemasangan PWA; browser otomatis yang dijalankan adalah Chromium.
- Kalibrasi usia/terapi dan play-testing 200 soal. Level tinggi ditujukan untuk ujung usia yang lebih tua dengan pendampingan.
- Persetujuan hukum dan kebijakan data pihak ketiga untuk deployment tertentu.

Pengembangan masih lokal; aplikasi belum di-push atau di-deploy.
