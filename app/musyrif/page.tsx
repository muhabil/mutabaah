'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogOut,
  Users,
  BookOpen,
  CheckCircle2,
  Calendar,
  Award,
  Sparkles,
  RefreshCw,
  UserCheck,
  Clock,
  LayoutDashboard,
} from 'lucide-react';

interface UserData {
  nim: string;
  nama: string;
  role: string;
}

export default function DashboardMusyrif() {
  const router = useRouter();
  const [musyrif, setMusyrif] = useState<UserData | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [activeTab, setActiveTab] = useState<'mutabaah' | 'setoran'>('mutabaah');
  const [loading, setLoading] = useState(true);

  // State Data Kelompok
  const [anggotaList, setAnggotaList] = useState<UserData[]>([]);
  const [mutabaahMap, setMutabaahMap] = useState<Record<string, any>>({});
  const [setoranList, setSetoranList] = useState<any[]>([]);

  useEffect(() => {
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setSelectedDate(localDate);

    const saved = localStorage.getItem('mutabaah_user');
    if (!saved) {
      router.push('/');
      return;
    }
    const parsedUser: UserData = JSON.parse(saved);
    if (parsedUser.role !== 'musyrif') {
      router.push('/dashboard');
      return;
    }
    setMusyrif(parsedUser);
    fetchGroupData(localDate);
  }, [router]);

  const fetchGroupData = async (dateToFetch: string) => {
    setLoading(true);
    try {
      // 1. Ambil semua daftar anggota (termasuk musyrif jika ingin dipantau, atau khusus anggota)
      const { data: usersData } = await supabase
        .from('users')
        .select('nim, nama, role')
        .order('role', { ascending: true })
        .order('nama', { ascending: true });

      if (usersData) setAnggotaList(usersData);

      // 2. Ambil log mutabaah pada tanggal yang dipilih
      const { data: mutabaahData } = await supabase
        .from('mutabaah_logs')
        .select('*')
        .eq('tanggal', dateToFetch);

      const map: Record<string, any> = {};
      if (mutabaahData) {
        mutabaahData.forEach((log) => {
          map[log.user_nim] = log;
        });
      }
      setMutabaahMap(map);

      // 3. Ambil semua log setoran terbaru
      const { data: setoranData } = await supabase
        .from('setoran_logs')
        .select(`
          *,
          penyetor:users!setoran_logs_penyetor_nim_fkey(nama),
          penyimak:users!setoran_logs_penyimak_nim_fkey(nama)
        `)
        .order('created_at', { ascending: false })
        .limit(30);

      if (setoranData) setSetoranList(setoranData);
    } catch (error) {
      console.error('Gagal mengambil data kelompok:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    fetchGroupData(newDate);
  };

  const handleLogout = () => {
    localStorage.removeItem('mutabaah_user');
    router.push('/');
  };

  // Hitung skor per anggota
  const calculateMemberScore = (log: any) => {
    if (!log) return 0;
    let score = 0;
    if (log.shalat_jamaah >= 3) score += 20;
    if (log.tilawah_halaman >= 1) score += 20;
    if (log.qiyamul_lail) score += 20;
    if (log.dhuha) score += 20;
    if (log.almatsurat) score += 20;
    return score;
  };

  const sudahIsiCount = Object.keys(mutabaahMap).length;

  return (
    <div className="min-h-screen bg-stone-100 pb-14">
      {/* Header Navbar */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                Musyrif Control Room
              </span>
              <h1 className="text-lg font-bold text-stone-800 mt-0.5">
                Halo Musyrif, {musyrif?.nama}!
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tombol ke Dashboard Pribadi agar Musyrif juga bisa isi mutabaah */}
            <button
              onClick={() => router.push('/dashboard')}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Isi Mutabaahku</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-600 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Konten Utama Lebar Responsif */}
      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Ringkasan Statistik (3 Kartu) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Total Anggota Liqo
              </p>
              <h2 className="text-2xl font-bold text-stone-800 mt-1">
                {anggotaList.length} Orang
              </h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Sudah Mengisi ({selectedDate})
              </p>
              <h2 className="text-2xl font-bold text-emerald-600 mt-1">
                {sudahIsiCount} / {anggotaList.length}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Total Setoran Masuk
              </p>
              <h2 className="text-2xl font-bold text-stone-800 mt-1">
                {setoranList.length} Catatan
              </h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </motion.div>
        </div>

        {/* Baris Kontrol: Tab Switcher & Filter Tanggal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-stone-200">
          {/* Sliding Pill Tabs */}
          <div className="relative flex bg-stone-100 p-1 rounded-xl sm:w-80">
            <button
              onClick={() => setActiveTab('mutabaah')}
              className={`relative z-10 flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'mutabaah' ? 'text-emerald-800' : 'text-stone-500'
              }`}
            >
              {activeTab === 'mutabaah' && (
                <motion.div
                  layoutId="musyrifTab"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10"
                />
              )}
              <CheckCircle2 className="w-4 h-4" />
              <span>Rekap Mutabaah</span>
            </button>

            <button
              onClick={() => setActiveTab('setoran')}
              className={`relative z-10 flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'setoran' ? 'text-emerald-800' : 'text-stone-500'
              }`}
            >
              {activeTab === 'setoran' && (
                <motion.div
                  layoutId="musyrifTab"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10"
                />
              )}
              <BookOpen className="w-4 h-4" />
              <span>Log Setoran</span>
            </button>
          </div>

          {/* Filter Tanggal & Tombol Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={() => fetchGroupData(selectedDate)}
              className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Isi Konten Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'mutabaah' ? (
            <motion.div
              key="rekap-mutabaah"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {anggotaList.map((member) => {
                const log = mutabaahMap[member.nim];
                const score = calculateMemberScore(log);

                return (
                  <div
                    key={member.nim}
                    className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-stone-800">
                              {member.nama}
                            </h3>
                            {member.role === 'musyrif' && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                Musyrif
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-400">NIM: {member.nim}</p>
                        </div>

                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            log
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          {log ? `${score}% Tuntas` : 'Belum Isi'}
                        </span>
                      </div>

                      {/* Progress Bar Mini */}
                      <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden mt-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Rincian Indikator Ibadah */}
                    {log ? (
                      <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-stone-100 text-center">
                        <div className="p-2 rounded-xl bg-stone-50">
                          <p className="text-[10px] text-stone-400 font-semibold">
                            Jamaah
                          </p>
                          <p className="text-xs font-bold text-stone-800 mt-0.5">
                            {log.shalat_jamaah}/5
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-stone-50">
                          <p className="text-[10px] text-stone-400 font-semibold">
                            Tilawah
                          </p>
                          <p className="text-xs font-bold text-stone-800 mt-0.5">
                            {log.tilawah_halaman} hal
                          </p>
                        </div>
                        <div
                          className={`p-2 rounded-xl ${
                            log.qiyamul_lail
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-stone-50 text-stone-300'
                          }`}
                        >
                          <p className="text-[10px] font-semibold">Tahajud</p>
                          <p className="text-xs font-bold mt-0.5">
                            {log.qiyamul_lail ? '✓' : '—'}
                          </p>
                        </div>
                        <div
                          className={`p-2 rounded-xl ${
                            log.dhuha
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-stone-50 text-stone-300'
                          }`}
                        >
                          <p className="text-[10px] font-semibold">Dhuha</p>
                          <p className="text-xs font-bold mt-0.5">
                            {log.dhuha ? '✓' : '—'}
                          </p>
                        </div>
                        <div
                          className={`p-2 rounded-xl ${
                            log.almatsurat
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-stone-50 text-stone-300'
                          }`}
                        >
                          <p className="text-[10px] font-semibold">Matsurat</p>
                          <p className="text-xs font-bold mt-0.5">
                            {log.almatsurat ? '✓' : '—'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-stone-100 text-xs text-stone-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Belum ada laporan masuk pada tanggal ini.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="log-setoran"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {setoranList.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl border border-stone-200 text-center text-sm text-stone-400">
                  Belum ada catatan setoran Al-Qur&apos;an dari anggota kelompok.
                </div>
              ) : (
                setoranList.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-800 text-sm">
                          {item.penyetor?.nama || item.penyetor_nim}
                        </span>
                        <span className="text-xs text-stone-400">menyetor ke</span>
                        <span className="font-semibold text-emerald-700 text-sm">
                          {item.penyimak?.nama || item.penyimak_nim}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-stone-700">
                        📖 QS. {item.surah} : Ayat {item.ayat}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100">
                      <span className="text-xs text-stone-400">{item.tanggal}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${
                          item.jenis === 'ziyadah'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.jenis === 'ziyadah' ? '🌱 Ziyadah' : '🔄 Murajaah'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}