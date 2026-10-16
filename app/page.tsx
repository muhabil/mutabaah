'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, User, Lock, Hash, ArrowRight, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [nim, setNim] = useState('');
  const [nama, setNama] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Cek apakah user sudah login sebelumnya
  useEffect(() => {
    const savedUser = localStorage.getItem('mutabaah_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user.role === 'musyrif') {
        router.push('/musyrif');
      } else {
        router.push('/dashboard');
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        // --- PROSES LOGIN ---
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('nim', nim.trim())
          .eq('password', password)
          .single();

        if (error || !data) {
          setErrorMsg('NIM atau Password salah, atau belum terdaftar.');
          setLoading(false);
          return;
        }

        localStorage.setItem('mutabaah_user', JSON.stringify(data));
        if (data.role === 'musyrif') {
          router.push('/musyrif');
        } else {
          router.push('/dashboard');
        }
      } else {
        // --- PROSES REGISTER ANGGOTA BARU ---
        if (!nama.trim()) {
          setErrorMsg('Nama lengkap wajib diisi.');
          setLoading(false);
          return;
        }

        const { data: existingUser } = await supabase
          .from('users')
          .select('nim')
          .eq('nim', nim.trim())
          .single();

        if (existingUser) {
          setErrorMsg('NIM ini sudah terdaftar! Silakan langsung login.');
          setLoading(false);
          return;
        }

        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              nim: nim.trim(),
              nama: nama.trim(),
              password: password,
              role: 'anggota',
            },
          ])
          .select()
          .single();

        if (insertError) {
          setErrorMsg('Gagal mendaftar: ' + insertError.message);
          setLoading(false);
          return;
        }

        localStorage.setItem('mutabaah_user', JSON.stringify(newUser));
        router.push('/dashboard');
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-emerald-50/30 to-stone-200 flex items-center justify-center p-4 overflow-hidden">
      {/* Animasi Kartu Utama */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
        className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 sm:p-8 border border-stone-200/80"
      >
        {/* Header dengan Animasi Ikon */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner mb-3"
          >
            <Sparkles className="w-7 h-7" />
          </motion.div>
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight">
            Mutabaah Space
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Back to Basic • Track Your Spiritual Glow Up ✨
          </p>
        </div>

        {/* Sliding Pill Toggle (Masuk / Daftar) */}
        <div className="relative flex bg-stone-100 p-1.5 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setErrorMsg('');
            }}
            className={`relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-200 ${
              isLogin ? 'text-emerald-800' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {isLogin && (
              <motion.div
                layoutId="activeTab"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
              />
            )}
            Masuk
          </button>

          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setErrorMsg('');
            }}
            className={`relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-200 ${
              !isLogin ? 'text-emerald-800' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {!isLogin && (
              <motion.div
                layoutId="activeTab"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
              />
            )}
            Daftar Baru
          </button>
        </div>

        {/* Animasi Pesan Error */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2.5 overflow-hidden"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              NIM Mahasiswa
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Contoh: 240101..."
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all"
              />
            </div>
          </div>

          {/* Input Nama Lengkap dengan Animasi Buka-Tutup Halus */}
          <AnimatePresence initial={false}>
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="pt-1 pb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Nama Lengkap / Panggilan
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required={!isLogin}
                      placeholder="Masukkan namamu"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
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
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all"
              />
            </div>
          </div>

          {/* Tombol Submit Interaktif */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold text-sm transition-colors shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>
              {loading
                ? 'Memproses...'
                : isLogin
                ? 'Masuk ke Space'
                : 'Gabung Sekarang'}
            </span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}