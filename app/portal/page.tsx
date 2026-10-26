'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Shield,
  BookOpen,
  Users,
  Flame,
  ArrowRight,
  CheckCircle2,
  Lock,
  Smartphone,
  Compass,
  Heart,
  ChevronDown,
  Moon,
  Sun,
  Star,
  Award,
  Zap,
  GraduationCap,
  Calendar,
  Building2,
  MapPin,
} from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

interface SavedUser {
  nim: string;
  nama: string;
  role: string;
}

export default function LandingPortalPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<SavedUser | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    // 1. Cek jika aplikasi dibuka dalam mode Standalone PWA / APK
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://'));

    const saved = localStorage.getItem('mutabaah_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setCurrentUser(u);

        // Jika dibuka dari shortcut PWA / Home Screen, langsung alihkan ke dashboard/ruang kerja
        if (isStandalone) {
          if (u.role === 'admin') router.replace('/admin');
          else if (u.role === 'musyrif') router.replace('/musyrif');
          else router.replace('/dashboard');
        }
      } catch (e) {
        localStorage.removeItem('mutabaah_user');
      }
    }
  }, [router]);

  const kurikulumFase = [
    {
      fase: 'Fase 01',
      title: 'Back to Basic',
      subtitle: 'Fondasi Aqidah & Ibadah di Tengah Kesibukan Teknik',
      icon: Compass,
      color: 'emerald',
      desc: 'Memurnikan niat menuntut ilmu, membentengi aqidah, memperbaiki wudhu & menegakkan shalat berjamaah 5 waktu di sela padatnya jadwal kuliah kampus ITPLN.',
      topics: ['Tauhid & Urgensi Syahadatain', 'Fiqih Shalat Berjamaah', 'Adab Penuntut Ilmu Teknik & Energi', 'Tahsin Al-Qur’an Dasar'],
    },
    {
      fase: 'Fase 02',
      title: 'Reality Check',
      subtitle: 'Ketahanan Mental & Menjawab Isu Kontemporer',
      icon: Shield,
      color: 'blue',
      desc: 'Membongkar perang pemikiran (ghazwul fikri), menjaga adab pergaulan islami di kampus, detoks media sosial, serta manajemen stres menghadapi tugas & praktikum.',
      topics: ['Menepis Syubhat & Pemikiran Bebas', 'Adab Pergaulan Islami Mahasiswa', 'Ghadhdhul Bashar di Era Digital', 'Manajemen Waktu Ksatria Petir'],
    },
    {
      fase: 'Fase 03',
      title: 'Safe Space & Peer Tasmi’',
      subtitle: 'Keluarga Kedua di Kampus & Penjagaan Hafalan',
      icon: Heart,
      color: 'purple',
      desc: 'Menemukan lingkar persaudaraan yang suportif. Saling menyimak setoran hafalan Juz 30 berpasangan tanpa canggung, saling menguatkan saat lelah kuliah.',
      topics: ['P2P Tasmi’ Juz ‘Amma', 'Ukhuwah Islamiyah & Solidaritas', 'Taqarrub Ilallah & Qiyamul Lail', 'Tolong-Menolong dalam Kebaikan'],
    },
    {
      fase: 'Fase 04',
      title: 'Main Character Energy',
      subtitle: 'Kader Pemimpin & Kontributor Peradaban',
      icon: Star,
      color: 'amber',
      desc: 'Beralih dari penikmat kebaikan menjadi pelopor perubahan. Siap menjadi teladan integritas moral di fakultas, musyrif penerus LDK, dan kontributor umat.',
      topics: ['Leadership Islami Kampus', 'Dakwah Kreatif Berbasis Teknologi', 'Regenerasi Musyrif Muda', 'Kontribusi untuk Bangsa & Umat'],
    },
  ];

  const fiturUnggulan = [
    {
      icon: Lock,
      title: 'Safe Space Harian Mahasiswa',
      desc: 'Mutabaah harianmu adalah urusan pribadimu dengan Allah Ta’ala. Musyrif hanya menerima rekap pekanan dan refleksi umum tanpa mengintip checklist harianmu.',
    },
    {
      icon: BookOpen,
      title: 'Peer-to-Peer Tasmi’ Hafalan',
      desc: 'Setor dan simak hafalan Qur’an berpasangan dengan rekan halaqah ITPLN. Semua kemajuan tercatat rapi di sistem tanpa perlu lembaran kartu fisik.',
    },
    {
      icon: Flame,
      title: 'Streak & Mode Udzur Syar’i',
      desc: 'Bangun konsistensi ibadah lewat streak harian. Dilengkapi fitur Freeze Streak otomatis untuk mahasiswi/akhwat yang sedang berhalangan syar’i.',
    },
    {
      icon: Smartphone,
      title: 'PWA Ringan & Cepat',
      desc: 'Dapat langsung di-install di layar utama HP (Android & iOS). Hemat memori, responsif, dan mudah dibuka kapan saja di lingkungan kampus ITPLN.',
    },
  ];

  const faqs = [
    {
      q: 'Apa itu UKM LDK Al-Futuwwah Institut Teknologi PLN (ITPLN)?',
      a: 'LDK Al-Futuwwah ITPLN adalah Unit Kegiatan Mahasiswa (UKM) resmi di bidang kerohanian Islam di bawah naungan Bidang Kemahasiswaan Institut Teknologi PLN (ITPLN), yang berfokus pada pembinaan karakter, keilmuan islami, dan ukhuwah mahasiswa.',
    },
    {
      q: 'Bagaimana jika jadwal mentoring bentrok dengan praktikum, lab, atau tugas kuliah ITPLN?',
      a: 'Tenang saja! Waktu dan tempat mentoring/halaqah disepakati secara fleksibel bersama kelompok dan musyrif pembina (bisa di Masjid Al-Futuwwah ITPLN, gazebo taman kampus, kantin, maupun daring), sehingga tidak mengganggu kegiatan akademik.',
    },
    {
      q: 'Apakah terbuka untuk seluruh fakultas dan jurusan di ITPLN?',
      a: 'Sangat terbuka untuk seluruh Ksatria Petir ITPLN! Baik dari FKET (Ketenagalistrikan & Energi Terbarukan), FTBE (Teknologi & Bisnis Energi), FRSE (Rekayasa Sistem Energi), FTKI (Teknologi Komunikasi & Informatika), dari mahasiswa baru hingga tingkat akhir.',
    },
    {
      q: 'Apakah saya boleh ikut mentoring jika bacaan Al-Qur’an saya masih terbata-bata?',
      a: 'Sangat boleh! Di mentoring Al-Futuwwah tidak ada sistem menghakimi. Kelompok dibagi berdasarkan kenyamanan, dan kita belajar bersama dari dasar (tahsin, wudhu, shalat) dengan suasana santai dan saling merangkul.',
    },
    {
      q: 'Apakah ada biaya pendaftaran atau iuran untuk program ini?',
      a: 'Tidak ada biaya sama sekali (100% Gratis). Program pembinaan mentoring dan platform Mutabaah Space ini disediakan penuh oleh UKM LDK Al-Futuwwah ITPLN untuk kemaslahatan mahasiswa.',
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 transition-colors duration-200">
      {/* 1. TOP NAVBAR */}
      <nav className="sticky top-0 z-40 bg-white/85 dark:bg-stone-900/85 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Identity */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-stone-900 dark:text-white tracking-tight leading-tight">
                  LDK Al-Futuwwah
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  ITPLN
                </span>
              </div>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium block leading-tight">
                UKM Kerohanian Islam &bull; Institut Teknologi PLN
              </span>
            </div>
          </Link>

          {/* Nav Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-stone-600 dark:text-stone-300">
            <a href="#tentang" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              Tentang LDK
            </a>
            <a href="#kurikulum" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              Kurikulum 4 Fase
            </a>
            <a href="#fitur" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              Mutabaah Space
            </a>
            <a href="#faq" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              FAQ
            </a>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:scale-105 transition cursor-pointer"
              title="Ganti Tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>

            {currentUser ? (
              <Link
                href={
                  currentUser.role === 'admin'
                    ? '/admin'
                    : currentUser.role === 'musyrif'
                    ? '/musyrif'
                    : '/dashboard'
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition hover:scale-105"
              >
                <span>Buka Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-emerald-500 text-stone-700 dark:text-stone-200 text-xs font-semibold transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/login?tab=register"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition hover:scale-105"
                >
                  <span>Daftar Mentoring</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Soft Background Blur Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge Kampus ITPLN */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-6 shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>UKM LDK Al-Futuwwah &bull; Institut Teknologi PLN</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 dark:text-white tracking-tight leading-[1.15]"
          >
            Membentuk Ksatria Petir Berkarakter{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Qur&apos;ani & Tangguh
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl mx-auto font-normal"
          >
            Pusat kaderisasi dan pembinaan spiritualitas islami mahasiswa <strong>Institut Teknologi PLN (ITPLN)</strong>.
            Menyeimbangkan prestasi akademik dan praktikum dengan keteguhan ruhiyah lewat mentoring terarah dan platform{' '}
            <strong className="text-stone-900 dark:text-stone-100 font-semibold">Mutabaah Space</strong>.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            {currentUser ? (
              <Link
                href={
                  currentUser.role === 'admin'
                    ? '/admin'
                    : currentUser.role === 'musyrif'
                    ? '/musyrif'
                    : '/dashboard'
                }
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>Lanjutkan ke Mutabaah ({currentUser.nama})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login?tab=register"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Daftar Mentoring ITPLN</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-emerald-500 font-bold text-sm shadow-sm transition hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 text-stone-400" />
                  <span>Masuk ke Akun</span>
                </Link>
              </>
            )}
          </motion.div>

          {/* Highlights Kampus ITPLN */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center"
          >
            <div className="p-2">
              <p className="text-xl font-extrabold text-amber-500 flex items-center justify-center gap-1">
                <Zap className="w-5 h-5 fill-amber-500 inline" /> ITPLN
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium mt-0.5">Ksatria Petir</p>
            </div>
            <div className="p-2">
              <p className="text-xl font-extrabold text-stone-900 dark:text-white">UKM Resmi</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium mt-0.5">LDK Al-Futuwwah</p>
            </div>
            <div className="p-2">
              <p className="text-xl font-extrabold text-stone-900 dark:text-white">Safe Space</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium mt-0.5">Privat & Nyaman</p>
            </div>
            <div className="p-2">
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">PWA Mobile</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium mt-0.5">Akses Cepat di HP</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2.5 TENTANG LDK AL-FUTUWWAH ITPLN */}
      <section id="tentang" className="py-16 bg-stone-100/60 dark:bg-stone-900/40 border-y border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                Mengenal Al-Futuwwah
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight mt-3">
                Rumah Spiritual & Keluarga Kedua di Kampus Menara PLN
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-4 leading-relaxed">
                UKM LDK Al-Futuwwah Institut Teknologi PLN hadir sebagai wadah pembinaan keislaman dan ukhuwah bagi seluruh mahasiswa muslim ITPLN. Di tengah kesibukan kuliah teknik ketenagalistrikan, energi, dan komputasi, Al-Futuwwah menjadi oasis yang menjaga hati tetap hidup, akal tetap cemerlang, dan akhlak tetap luhur.
              </p>
              <div className="mt-6 space-y-2.5 text-xs text-stone-600 dark:text-stone-300 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Membina ribuan alumni dan mahasiswa aktif lintas jurusan ITPLN</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pendampingan intensif dari kakak tingkat dan alumni musyrif berpengalaman</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kegiatan positif: Mentoring, Kajian Akbar, Mabit, dan Baksos Sosial</span>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900 dark:text-white">Pusat Kegiatan</h3>
                  <p className="text-[11px] text-stone-500">Institut Teknologi PLN, Jakarta Barat</p>
                </div>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                Sekretariat & kegiatan berpusat di <strong>Masjid Kampus / Gedung Menara PLN</strong>, Jl. Lingkar Luar Barat, Cengkareng. Terbuka bagi seluruh mahasiswa muslim yang ingin memperdalam ilmu agama, mengasah hafalan Qur’an, atau sekadar berbagi cerita di lingkar halaqah yang hangat.
              </p>
              <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Menara PLN, Duri Kosambi, Cengkareng, Jakarta Barat</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. KURIKULUM 4 FASE (THE JOURNEY) */}
      <section id="kurikulum" className="py-16 bg-white dark:bg-stone-900/50 border-b border-stone-200/80 dark:border-stone-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Peta Jalan Pembinaan Mahasiswa
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight mt-3">
              Kurikulum Mentoring 4 Fase Ksatria Petir
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-2">
              Perjalanan terstruktur menempa karakter mahasiswa ITPLN dari pemurnian fondasi hingga menjadi kader mandiri.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {kurikulumFase.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-3xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {item.fase}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-stone-900 dark:text-white tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {item.subtitle}
                  </p>

                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-3 leading-relaxed">
                    {item.desc}
                  </p>

                  <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                      Fokus Bahasan:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.topics.map((topic, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-medium"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. SHOWCASE FITUR MUTABAAH SPACE */}
      <section id="fitur" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Inovasi Digital Kaderisasi
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight mt-3">
              Mutabaah Space: Sahabat Ibadah Mahasiswa
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-2">
              Sistem pendukung mentoring modern yang menghargai privasi ibadah pribadi dan mempermudah setoran hafalan kelompok.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {fiturUnggulan.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-white mb-2">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. NILAI DAKWAH AL-FUTUWWAH */}
      <section className="py-16 bg-stone-100 dark:bg-stone-900/60 border-t border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-stone-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5 w-fit">
                <Zap className="w-3.5 h-3.5 fill-amber-300" />
                <span>Karakter Futuwwah Mahasiswa ITPLN</span>
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-3">
                &ldquo;Ksatria yang Berani Berdiri Teguh di Atas Integritas &amp; Nilai Kebaikan&rdquo;
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 mt-4 leading-relaxed font-light">
                Di kampus energi Institut Teknologi PLN, Ksatria Al-Futuwwah adalah sosok pemuda yang unggul dalam sains dan teknologi, santun dalam tutur kata, dan istiqomah menjaga hubungan dengan Allah Ta’ala di manapun ia berada.
              </p>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs">
                  <p className="text-xs font-bold text-emerald-200">Aqidah</p>
                  <p className="text-[11px] text-white/80 mt-0.5">Shahihah</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs">
                  <p className="text-xs font-bold text-emerald-200">Ibadah</p>
                  <p className="text-[11px] text-white/80 mt-0.5">Istiqomah</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs">
                  <p className="text-xs font-bold text-emerald-200">Akhlak</p>
                  <p className="text-[11px] text-white/80 mt-0.5">Ksatria Mulia</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs">
                  <p className="text-xs font-bold text-emerald-200">Ukhuwah</p>
                  <p className="text-[11px] text-white/80 mt-0.5">Solid ITPLN</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ (TANYA JAWAB) */}
      <section id="faq" className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Seputar Mentoring Kampus
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight mt-3">
              Pertanyaan yang Sering Diajukan Mahasiswa
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-stone-800 dark:text-stone-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-emerald-600' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-stone-600 dark:text-stone-300 leading-relaxed border-t border-stone-100 dark:border-stone-800/60 pt-3">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CTA BANNER */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-600/30">
              <Zap className="w-6 h-6 text-amber-300 fill-amber-300" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
              Ayo Jadi Bagian dari Keluarga Besar Al-Futuwwah ITPLN!
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-lg mx-auto mt-2 leading-relaxed">
              Jadikan masa kuliahmu di Institut Teknologi PLN seimbang antara prestasi akademik dan keberkahan ruhiyah.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login?tab=register"
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition hover:scale-105 flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span>Daftar Mentoring Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-emerald-500 font-bold text-xs shadow-sm transition hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>Sudah Punya Akun? Masuk</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-stone-200 dark:border-stone-800 py-8 bg-white dark:bg-stone-900 text-xs text-stone-500 dark:text-stone-400 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                UKM LDK Al-Futuwwah &bull; Institut Teknologi PLN
              </span>
              <span className="text-[10px] text-stone-400">
                Divisi Pendidikan dan Kaderisasi (Dirdik)
              </span>
            </div>
          </div>

          <p className="text-[11px] text-center sm:text-right">
            Menara PLN, Jl. Lingkar Luar Barat, Cengkareng, Jakarta Barat 11750.<br />
            &copy; 2026 LDK Al-Futuwwah ITPLN. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
