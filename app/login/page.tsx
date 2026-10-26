'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  User,
  Lock,
  Hash,
  ArrowRight,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  UserCheck,
  Phone,
  Moon,
  Sun,
  ArrowLeft,
} from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import Link from 'next/link';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();

  const initialTab = searchParams.get('tab') === 'register' ? false : true;
  const [isLogin, setIsLogin] = useState(initialTab);
  const [roleToRegister, setRoleToRegister] = useState<'anggota' | 'musyrif'>('anggota');

  // Input states
  const [nim, setNim] = useState('');
  const [nama, setNama] = useState('');
  const [password, setPassword] = useState('');
  const [kodeKelompok, setKodeKelompok] = useState('');
  const [noHp, setNoHp] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Sinkronkan tab jika query parameter berubah
  useEffect(() => {
    if (searchParams.get('tab') === 'register') {
      setIsLogin(false);
    } else if (searchParams.get('tab') === 'login') {
      setIsLogin(true);
    }
  }, [searchParams]);

  // Cek apakah user sudah login sebelumnya
  useEffect(() => {
    const savedUser = localStorage.getItem('mutabaah_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user.role === 'admin') {
          router.push('/admin');
        } else if (user.role === 'musyrif') {
          router.push('/musyrif');
        } else {
          router.push('/dashboard');
        }
      } catch (e) {
        localStorage.removeItem('mutabaah_user');
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      if (isLogin) {
        // --- PROSES LOGIN VIA SERVER API ---
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nim, password }),
        });

        const result = await res.json();

        if (!res.ok) {
          setErrorMsg(result.error || 'NIM/Username atau Password salah.');
          setLoading(false);
          return;
        }

        localStorage.setItem('mutabaah_user', JSON.stringify(result.user));
        if (result.user.role === 'admin') {
          router.push('/admin');
        } else if (result.user.role === 'musyrif') {
          router.push('/musyrif');
        } else {
          router.push('/dashboard');
        }
      } else {
        // --- PROSES REGISTER VIA SERVER API (PASSWORD DI-HASH BCRYPT) ---
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nim,
            nama,
            password,
            roleToRegister,
            kodeKelompok,
            noHp,
          }),
        });

        const result = await res.json();

        if (!res.ok) {
          setErrorMsg(result.error || 'Pendaftaran gagal.');
          setLoading(false);
          return;
        }

        if (result.role === 'musyrif') {
          setInfoMsg(
            'Alhamdulillah! Pendaftaran Musyrif berhasil dikirim. Akun kamu sedang menunggu verifikasi dari Admin Kaderisasi sebelum bisa login.'
          );
          setIsLogin(true);
          setPassword('');
        } else {
          localStorage.setItem('mutabaah_user', JSON.stringify(result.user));
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 transition-colors duration-200 flex items-center justify-center p-4 relative">
      {/* Top Bar Actions */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between max-w-4xl mx-auto pointer-events-none">
        <Link
          href="/portal"
          className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 text-xs font-semibold shadow-sm hover:text-emerald-600 dark:hover:text-emerald-400 transition hover:scale-105"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Info LDK ITPLN</span>
        </Link>

        <button
          onClick={toggleTheme}
          className="pointer-events-auto p-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 shadow-sm transition hover:scale-105 cursor-pointer"
          title="Ganti Tema (Terang/Gelap)"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
        </button>
      </div>

      {/* Animasi Kartu Utama */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
        className="max-w-md w-full bg-white dark:bg-stone-900 rounded-3xl shadow-xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 my-16 transition-colors"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shadow-inner mb-3"
          >
            <Sparkles className="w-7 h-7" />
          </motion.div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100 tracking-tight">
            Mutabaah Space
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
            UKM LDK Al-Futuwwah ITPLN &bull; Institut Teknologi PLN
          </p>
        </div>

        {/* Sliding Pill Toggle (Masuk / Daftar) */}
        <div className="relative flex bg-stone-100 dark:bg-stone-800 p-1.5 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`relative z-10 flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors duration-200 cursor-pointer ${
              isLogin ? 'text-emerald-800 dark:text-emerald-300' : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            {isLogin && (
              <motion.div
                layoutId="authTab"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                className="absolute inset-0 bg-white dark:bg-stone-700 rounded-xl shadow-sm -z-10"
              />
            )}
            Masuk
          </button>

          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`relative z-10 flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors duration-200 cursor-pointer ${
              !isLogin ? 'text-emerald-800 dark:text-emerald-300' : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            {!isLogin && (
              <motion.div
                layoutId="authTab"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                className="absolute inset-0 bg-white dark:bg-stone-700 rounded-xl shadow-sm -z-10"
              />
            )}
            Daftar Baru
          </button>
        </div>

        {/* Pilihan Peran saat Daftar Baru */}
        {!isLogin && (
          <div className="mb-5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl flex gap-1">
            <button
              type="button"
              onClick={() => setRoleToRegister('anggota')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                roleToRegister === 'anggota'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Anggota / Mentee</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleToRegister('musyrif')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                roleToRegister === 'musyrif'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Musyrif Baru</span>
            </button>
          </div>
        )}

        {/* Alert Info/Sukses */}
        <AnimatePresence mode="wait">
          {infoMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium leading-relaxed overflow-hidden"
            >
              {infoMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alert Error */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2 overflow-hidden"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Input */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
              NIM / Username / No. HP
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder={roleToRegister === 'anggota' && !isLogin ? 'Contoh: 240101...' : 'NIM atau No. HP'}
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
              />
            </div>
          </div>

          {/* Form Ekstra saat Register */}
          <AnimatePresence initial={false}>
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-3.5 overflow-hidden"
              >
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required={!isLogin}
                      placeholder="Masukkan nama lengkap"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
                    />
                  </div>
                </div>

                {roleToRegister === 'anggota' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        Kode Kelompok Mentoring
                      </label>
                      <span className="text-[10px] text-stone-400 font-medium">Opsional</span>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Contoh: FUTUWWAH-01 (bisa diisi nanti)"
                        value={kodeKelompok}
                        onChange={(e) => setKodeKelompok(e.target.value.toUpperCase())}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm uppercase tracking-wider transition-all"
                      />
                    </div>
                  </div>
                )}

                {roleToRegister === 'musyrif' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                      Nomor WhatsApp Aktif
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="0812xxxxxxx (untuk verifikasi admin)"
                        value={noHp}
                        onChange={(e) => setNoHp(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
              />
            </div>
          </div>

          {/* Tombol Submit */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold text-sm transition-colors shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>
              {loading
                ? 'Memproses...'
                : isLogin
                ? 'Masuk ke Space'
                : roleToRegister === 'musyrif'
                ? 'Ajukan Registrasi Musyrif'
                : 'Gabung ke Kelompok'}
            </span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex items-center justify-center text-stone-500 text-sm">
          Memuat formulir...
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
