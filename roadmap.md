# 🗺️ Roadmap Pengembangan: Mutabaah Space & Portal Al-Futuwwah

Dokumentasi ini merangkum peta jalan strategis pengembangan aplikasi **Mutabaah Space** (sistem pelacak spiritual dan manajemen halaqah/mentoring) hingga evolusinya menjadi portal resmi terpadu **LDK Al-Futuwwah** (v1.0).

---

## 📌 Ringkasan Eksekutif & Tech Stack

* **Inisiator & Role**: Ketua Divisi Pendidikan dan Kaderisasi (Admin, Musyrif, Developer)
* **Target Pengguna**: 
  * Mahasiswa Internal Kampus (Angkatan Baru & Kader LDK)
  * Kelompok Pengajian Eksternal / Halaqah Umum (e.g. Kelompok Abi)
* **Tech Stack**:
  * **Frontend / Framework**: Next.js 16 (App Router, Turbopack)
  * **Styling**: Tailwind CSS
  * **Interactivity & Micro-interactions**: `motion` (Framer Motion) & `lucide-react`
  * **Backend & Database**: Supabase (PostgreSQL, Row-Level Security)
  * **PWA & Distribution**: Native Web App Manifest, Vercel Serverless Hosting

---

## 🚀 Fase Rilis (v0.1 – v1.0)

```
[v0.1: MVP] ──> [v0.2: Multi-Tenancy] ──> [v0.3: Hybrid & Presensi] ──> [v0.4: Gamifikasi]
                                                                                │
[v1.0: Full Release] <── [v0.8: Landing Page] <── [v0.7: Custom Program] <── [v0.5 & v0.6]
```

---

### 🟢 v0.1: Single Group MVP & PWA Setup *(Selesai)*
Fokus pada validasi prototipe untuk satu kelompok mentoring mandiri dengan pendekatan visual interaktif yang ramah Gen Z.

* **Fitur Utama**:
  * Autentikasi dasar (NIM & Password) disimpan di Supabase.
  * *Amal Yaumi Tracker*: Input shalat berjamaah, tilawah Qur'an, dan checklist sunnah (Tahajud, Dhuha, Al-Ma'tsurat).
  * *Peer-to-Peer Quran Memorization*: Pencatatan setoran hafalan berpasangan antar-anggota (Ziyadah & Murajaah).
  * Dashboard Musyrif v0.1: Rekap harian dan live feed setoran.
  * Konfigurasi PWA (*Add to Home Screen*) dengan `manifest.ts` dan viewport mobile-optimized.

---

### 🟢 v0.2: Multi-Tenancy & Group Expansion *(Selesai)*
Ekspansi aplikasi agar dapat digunakan oleh banyak musyrif LDK se-kampus serta kelompok halaqah umum eksternal tanpa percampuran data.

* **Arsitektur Database**:
  * File migrasi Supabase: `supabase/migrations/001_v0.2_multitenancy.sql`.
  * Tabel `groups` (`id`, `nama_kelompok`, `kode_kelompok`, `musyrif_nim`, `kategori`, `deskripsi`).
  * Penambahan kolom pada `users`: `group_id`, `status` (`'pending' | 'approved' | 'rejected'`), `no_hp`, dan role `'admin'`.
  * Fleksibilitas identitas: Kolom NIM mengakomodasi No. HP / Username unik untuk pengguna umum/non-kampus.
* **Fitur Utama**:
  * **Registrasi Berjenjang**:
    * Mahasiswa/Anggota mendaftar dengan validasi *Kode Kelompok* langsung terhubung ke grup terkait.
    * Musyrif baru mendaftar mandiri dengan status *Pending* (menunggu aktivasi admin).
  * **Admin Approval Panel (`/admin`)**: Verifikasi dan aktivasi akun musyrif baru serta CRUD/manajemen kelompok baru oleh Admin Kaderisasi.
  * **Musyrif Hub (`/musyrif`)**: Halaman seleksi kelompok binaan yang diampu oleh musyrif.
  * **Dynamic Routing Musyrif (`/musyrif/[groupId]`)**: Satu template dinamis terisolasi untuk mengelola rekap mutabaah dan live setoran per kelompok binaan.
  * **Data Isolation**: Setoran hafalan dan peer-to-peer tasmi' antar-anggota terisolasi dalam lingkup satu kelompok (`group_id`).

---

### 🟢 v0.3: Hybrid Habit, Presensi & Safe Space *(Selesai)*
Mengakomodasi spektrum mahasiswa muslim umum dengan memisahkan ranah privasi ibadah harian dari evaluasi pekanan kelompok.

* **Arsitektur Database**:
  * File migrasi Supabase: `supabase/migrations/003_v0.3_presensi_hybrid.sql`.
  * Tabel `liqo_meetings`: Pencatatan sesi pertemuan mingguan (`id`, `group_id`, `tanggal`, `judul_materi`, `tempat`).
  * Tabel `liqo_presensi`: Absensi per anggota (`meeting_id`, `user_nim`, `status`: `'hadir' | 'izin' | 'sakit' | 'alpa'`, `catatan`).
  * Tabel `mutabaah_pekanan`: Laporan evaluasi mingguan kelompok (`pekan_ke`, `rata_jamaah`, `total_tilawah_halaman`, dll.).
* **Fitur Utama**:
  * **Pemisahan Ruang Amal Yaumi (Safe Space / Privat)**: Mutabaah harian di `/dashboard` menjadi ruang aman pribadi yang tidak diintip musyrif secara mentah untuk menjaga keikhlasan.
  * **Kalkulator Evaluasi Otomatis (Magic Feature)**: Tombol *"Hitung"* di tab Pekanan untuk menarik rata-rata mutabaah harian selama sepekan ke form evaluasi liqo secara instan.
  * **Mutabaah Pekanan Kelompok**: Form laporan mingguan saat mentoring yang masuk langsung ke dashboard musyrif.
  * **Modul Presensi Pertemuan Liqo**:
    * Musyrif mencatat kehadiran sesi tatap muka per anggota (`Hadir`, `Izin`, `Sakit`, `Alpa`) terintegrasi judul materi.
    * Anggota dapat melihat riwayat kehadiran mereka di tab Presensi dashboard.

---

### 🟢 v0.4: Gamifikasi Spiritual *(Selesai)*
Mendorong konsistensi habit ibadah melalui penguatan psikologis positif.

* **Arsitektur Database**:
  * File migrasi Supabase: `supabase/migrations/004_v0.4_gamifikasi.sql`.
  * Tabel `user_badges` (`id`, `user_nim`, `badge_id`, `unlocked_at`).
  * Penambahan kolom `is_udzur` pada tabel `users`.
* **Fitur Utama**:
  * **Spiritual Streak Tracker**: Penghitung konsistensi amalan tanpa putus (Real-time dynamic streak).
  * **Mode Udzur Syar'i (Freeze Streak)**: Toggle pembekuan streak agar streak mentee/akhwat tidak hangus saat berhalangan.
  * **Milestone Badges**: Lencana pencapaian personal privat (*First Step*, *Habit Builder*, *Jamaah Full*, *Night Seeker*, *Dhuha Warrior*, *Peer Tasmi'*).
  * **Navigasi Profil Personal**: Menampilkan kartu lencana status (Terkunci vs Terbuka) dan streak tracker.

---

### 🟡 v0.5: Otomasi Administrasi & LPJ *(Fase Berikutnya)*
Menghilangkan beban rekap manual untuk pelaporan formal organisasi.

* **Fitur Utama**:
  * Generator laporan otomatis ke format **PDF & Excel (.xlsx)**.
  * Rekapitulasi absensi mentoring per semester untuk arsip divisi kaderisasi.
  * Laporan perkembangan kelompok per musyrif sekali klik.

---

### 🔴 v0.6: AI Insights & Analitik Kaderisasi
Pemanfaatan model bahasa cerdas untuk meringankan beban evaluasi musyrif dan kaderisasi.

* **Fitur Utama**:
  * Rangkuman otomatis tren ruhiyah mingguan per kelompok.
  * Deteksi dini (*Early Warning*): Rekomendasi pendekatan bagi anggota yang menunjukkan indikasi penurunan keaktifan 3 pekan berturut-turut.
  * Asisten penyusunan draf evaluasi personal musyrif.

---

### 🟤 v0.7: Modul Program Khusus (Custom Programs)
Memberikan keleluasaan musyrif membuat program akselerasi ibadah mandiri.

* **Fitur Utama**:
  * Pembuatan tantangan terfokus: *One Day One Juz* (ODOJ), *One Day One Half Juz* (ODOH), Sedekah Subuh, atau Gerakan Shubuh Berjamaah.
  * Papan progres khusus tantangan per kelompok.

---

### ⚪ v0.8: Portal Publik & Landing Page Al-Futuwwah
Wajah resmi organisasi yang menjadi etalase kegiatan dan gerbang pendaftaran mentoring.

* **Struktur Routing**:
  * `/` : Landing page modern profil LDK Al-Futuwwah, filosofi, program kerja, dan call-to-action (CTA).
  * `/mutabaah/*` : Sub-jalur operasional aplikasi mutabaah dan mentoring.
* **Fitur Utama**:
  * Informasi kurikulum mentoring (Fase 1: *Back to Basic*, Fase 2: *Reality Check*, Fase 3: *Safe Space*, Fase 4: *Main Character Energy*).
  * Pendaftaran mentoring terbuka bagi mahasiswa baru secara terpusat.

---

### 🏆 v1.0: Full Release (Ekosistem Resmi Al-Futuwwah)
Rilis penuh platform web terintegrasi sebagai Super-App Dakwah Kampus.

* **Fitur Utama**:
  * **Full CRUD Media & Artikel**: Publikasi artikel islami, jurnal kaderisasi, buletin dakwah, dan dokumentasi program kerja.
  * **Content Management System (CMS)** untuk pengurus media LDK.
  * **Integrasi Kalender Islam & Event Kampus**: Pengingat kajian akbar, agenda mabit, dan jadwal ujian/kegiatan akademik.
  * Keamanan menyeluruh: Pengetatan Row-Level Security (RLS) PostgreSQL dan validasi izin berbasis peran multi-level (*Admin, Pengurus Media, Musyrif, Anggota, Publik*).

---

## 🛠️ Rencana Pasca-v1.0 (Maintenance & Sustainability)

1. **Siklus Regenerasi Kepengurusan**:
   * Fitur transfer kepemilikan Admin Utama antar-Ketua Divisi Kaderisasi per periode.
   * Modul *Batch Archive* untuk mengarsipkan data angkatan lulusan tanpa menghapus riwayat analitik.
2. **Optimasi Infrastruktur & Database**:
   * Evaluasi kuota Supabase PostgreSQL (pengelolaan retensi data riwayat mutabaah lama).
   * Peningkatan strategi offline-first cache pada Service Worker PWA.
3. **Penyempurnaan Berkelanjutan**:
   * Pengumpulan feedback berkala dari musyrif dan anggota liqo lintas fakultas untuk peningkatan UX.