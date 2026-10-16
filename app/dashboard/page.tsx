'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogOut,
  CheckCircle2,
  Circle,
  BookOpen,
  Sparkles,
  Users,
  Send,
  Calendar,
  Award,
  Plus,
  Minus,
} from 'lucide-react';

interface UserData {
  nim: string;
  nama: string;
  role: string;
}

export default function DashboardAnggota() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'mutabaah' | 'setoran'>('mutabaah');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // State Mutabaah Hari Ini (new Date() dipindah ke dalam useEffect agar aman di Next.js 16)
  const [today, setToday] = useState('');
  const [shalatJamaah, setShalatJamaah] = useState(0);
  const [tilawahHalaman, setTilawahHalaman] = useState(0);
  const [qiyamulLail, setQiyamulLail] = useState(false);
  const [dhuha, setDhuha] = useState(false);
  const [almatsurat, setAlmatsurat] = useState(false);

  // State Setoran Peer-to-Peer
  const [temanList, setTemanList] = useState<UserData[]>([]);
  const [penyimakNim, setPenyimakNim] = useState('');
  const [surah, setSurah] = useState('');
  const [ayat, setAyat] = useState('');
  const [jenisSetoran, setJenisSetoran] = useState<'ziyadah' | 'murajaah'>('ziyadah');
  const [riwayatSetoran, setRiwayatSetoran] = useState<any[]>([]);

  useEffect(() => {
    // Ambil tanggal hari ini sesuai waktu lokal (YYYY-MM-DD) di dalam useEffect
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setToday(localDate);

    const saved = localStorage.getItem('mutabaah_user');
    if (!saved) {
      router.push('/');
      return;
    }
    const parsedUser: UserData = JSON.parse(saved);
    setUser(parsedUser);
    fetchInitialData(parsedUser.nim, localDate);
  }, [router]);

  const fetchInitialData = async (nim: string, currentDate: string) => {
    setLoading(true);
    try {
      // 1. Ambil data mutabaah hari ini jika sudah pernah isi
      const { data: mutabaahData } = await supabase
        .from('mutabaah_logs')
        .select('*')
        .eq('user_nim', nim)
        .eq('tanggal', currentDate)
        .single();

      if (mutabaahData) {
        setShalatJamaah(mutabaahData.shalat_jamaah || 0);
        setTilawahHalaman(mutabaahData.tilawah_halaman || 0);
        setQiyamulLail(mutabaahData.qiyamul_lail || false);
        setDhuha(mutabaahData.dhuha || false);
        setAlmatsurat(mutabaahData.almatsurat || false);
      }

      // 2. Ambil daftar anggota lain untuk dropdown penyimak peer-to-peer
      const { data: usersData } = await supabase
        .from('users')
        .select('nim, nama, role')
        .neq('nim', nim);

      if (usersData) setTemanList(usersData);

      // 3. Ambil riwayat setoran user ini
      const { data: setoranData } = await supabase
        .from('setoran_logs')
        .select('*, penyimak:users!setoran_logs_penyimak_nim_fkey(nama)')
        .eq('penyetor_nim', nim)
        .order('created_at', { ascending: false })
        .limit(5);

      if (setoranData) setRiwayatSetoran(setoranData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Simpan / Update Mutabaah Harian
  const handleSaveMutabaah = async () => {
    if (!user || !today) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('mutabaah_logs').upsert(
        {
          user_nim: user.nim,
          tanggal: today,
          shalat_jamaah: shalatJamaah,
          tilawah_halaman: tilawahHalaman,
          qiyamul_lail: qiyamulLail,
          dhuha: dhuha,
          almatsurat: almatsurat,
        },
        { onConflict: 'user_nim,tanggal' }
      );

      if (error) throw error;
      showToast('Alhamdulillah, Mutabaah hari ini tersimpan! ✨');
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Simpan Setoran Peer-to-Peer
  const handleSubmitSetoran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !penyimakNim || !surah || !ayat || !today) return;
    setSaving(true);

    try {
      const { error } = await supabase.from('setoran_logs').insert([
        {
          penyetor_nim: user.nim,
          penyimak_nim: penyimakNim,
          surah: surah.trim(),
          ayat: ayat.trim(),
          jenis: jenisSetoran,
          tanggal: today,
        },
      ]);

      if (error) throw error;

      setSurah('');
      setAyat('');
      showToast('Mantap! Setoran berhasil dicatat 📖');
      fetchInitialData(user.nim, today);
    } catch (err: any) {
      alert('Gagal mencatat setoran: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mutabaah_user');
    router.push('/');
  };

  // Hitung persentase progress bar hari ini (5 indikator)
  const calculateProgress = () => {
    let score = 0;
    if (shalatJamaah >= 3) score += 20;
    if (tilawahHalaman >= 1) score += 20;
    if (qiyamulLail) score += 20;
    if (dhuha) score += 20;
    if (almatsurat) score += 20;
    return score;
  };

  const progress = calculateProgress();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-stone-500 text-sm animate-pulse">Memuat Space kamu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 pb-12">
      {/* Toast Notification Animatif */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-800 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {today}
            </p>
            <h1 className="text-lg font-bold text-stone-800">
              Ahlan, {user?.nama}! 👋
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-600 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 space-y-5">
        {/* Kartu Progress Spiritual Hari Ini */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-lg shadow-emerald-600/15"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-100 font-semibold">
                Daily Spiritual Glow Up
              </span>
              <h2 className="text-2xl font-bold mt-0.5">{progress}% Tuntas</h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Award className="w-6 h-6 text-emerald-100" />
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.8 }}
              className="h-full bg-emerald-300 rounded-full"
            />
          </div>
          <p className="text-xs text-emerald-100 mt-2.5">
            {progress === 100
              ? 'MasyaAllah, target harianmu penuh hari ini! 🔥'
              : 'Pelan-pelan asal istiqamah, yuk lengkapi amalanmu.'}
          </p>
        </motion.div>

        {/* Navigasi Tab (Mutabaah vs Setoran) */}
        <div className="relative flex bg-stone-200/80 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('mutabaah')}
            className={`relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'mutabaah' ? 'text-emerald-800' : 'text-stone-500'
            }`}
          >
            {activeTab === 'mutabaah' && (
              <motion.div
                layoutId="dashboardTab"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
              />
            )}
            <CheckCircle2 className="w-4 h-4" />
            <span>Amal Yaumi</span>
          </button>

          <button
            onClick={() => setActiveTab('setoran')}
            className={`relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'setoran' ? 'text-emerald-800' : 'text-stone-500'
            }`}
          >
            {activeTab === 'setoran' && (
              <motion.div
                layoutId="dashboardTab"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
              />
            )}
            <BookOpen className="w-4 h-4" />
            <span>Setoran Qur&apos;an</span>
          </button>
        </div>

        {/* Konten Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'mutabaah' ? (
            <motion.div
              key="mutabaah"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* Counter Shalat Berjamaah */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-stone-800 text-sm">
                    Shalat Wajib Tepat Waktu / Jamaah
                  </h3>
                  <p className="text-xs text-stone-400">Target minimal 3-5 kali sehari</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShalatJamaah(Math.max(0, shalatJamaah - 1))}
                    className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-stone-800 w-5 text-center">
                    {shalatJamaah}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShalatJamaah(Math.min(5, shalatJamaah + 1))}
                    className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 hover:bg-emerald-200 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Counter Tilawah */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-stone-800 text-sm">
                    Tilawah Al-Qur&apos;an
                  </h3>
                  <p className="text-xs text-stone-400">Jumlah halaman hari ini</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTilawahHalaman(Math.max(0, tilawahHalaman - 1))}
                    className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-stone-800 w-5 text-center">
                    {tilawahHalaman}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTilawahHalaman(tilawahHalaman + 1)}
                    className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 hover:bg-emerald-200 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Toggle Checklist Sunnah */}
              {[
                {
                  label: 'Qiyamul Lail / Tahajud',
                  desc: 'Bangun sepertiga malam walau 2 rakaat',
                  val: qiyamulLail,
                  setVal: setQiyamulLail,
                },
                {
                  label: 'Shalat Dhuha',
                  desc: 'Sedekah untuk seluruh persendian tubuh',
                  val: dhuha,
                  setVal: setDhuha,
                },
                {
                  label: "Dzikir Al-Ma'tsurat",
                  desc: 'Perlindungan pagi atau petang',
                  val: almatsurat,
                  setVal: setAlmatsurat,
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => item.setVal(!item.val)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    item.val
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'bg-white border-stone-200'
                  }`}
                >
                  <div>
                    <h3
                      className={`font-semibold text-sm ${
                        item.val ? 'text-emerald-900' : 'text-stone-800'
                      }`}
                    >
                      {item.label}
                    </h3>
                    <p className="text-xs text-stone-400">{item.desc}</p>
                  </div>
                  {item.val ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-6 h-6 text-stone-300 shrink-0" />
                  )}
                </motion.div>
              ))}

              {/* Tombol Simpan Mutabaah */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSaveMutabaah}
                disabled={saving}
                className="w-full py-3.5 mt-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {saving ? 'Menyimpan...' : 'Simpan Mutabaah Hari Ini'}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="setoran"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Form Setoran Peer-to-Peer */}
              <form
                onSubmit={handleSubmitSetoran}
                className="bg-white p-5 rounded-3xl border border-stone-200 space-y-4"
              >
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <Users className="w-4 h-4" />
                  <span>Catat Setoran Berpasangan (Peer-to-Peer)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                    Disimak Oleh Teman Liqo
                  </label>
                  <select
                    required
                    value={penyimakNim}
                    onChange={(e) => setPenyimakNim(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Pilih Teman Penyimak --</option>
                    {temanList.map((t) => (
                      <option key={t.nim} value={t.nim}>
                        {t.nama} ({t.role === 'musyrif' ? 'Musyrif' : t.nim})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                      Nama Surah
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Misal: An-Naba"
                      value={surah}
                      onChange={(e) => setSurah(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                      Ayat
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Misal: 1 - 20"
                      value={ayat}
                      onChange={(e) => setAyat(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                    Jenis Setoran
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['ziyadah', 'murajaah'] as const).map((j) => (
                      <button
                        key={j}
                        type="button"
                        onClick={() => setJenisSetoran(j)}
                        className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition cursor-pointer ${
                          jenisSetoran === j
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                            : 'bg-stone-50 border-stone-200 text-stone-500'
                        }`}
                      >
                        {j === 'ziyadah' ? '🌱 Hafalan Baru' : '🔄 Murajaah'}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Simpan Catatan Setoran</span>
                </motion.button>
              </form>

              {/* Riwayat Setoran Terakhir */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 px-1">
                  Riwayat Setoranmu
                </h4>
                {riwayatSetoran.length === 0 ? (
                  <div className="bg-white p-4 rounded-2xl border border-stone-200 text-center text-xs text-stone-400">
                    Belum ada riwayat setoran. Yuk mulai setor ke temanmu!
                  </div>
                ) : (
                  riwayatSetoran.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-3.5 rounded-2xl border border-stone-200 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-stone-800 text-sm">
                          QS. {item.surah} : {item.ayat}
                        </span>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Disimak oleh:{' '}
                          <strong className="text-stone-600">
                            {item.penyimak?.nama || item.penyimak_nim}
                          </strong>
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                          item.jenis === 'ziyadah'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {item.jenis}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}