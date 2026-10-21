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
  Sparkles,
  RefreshCw,
  UserCheck,
  Clock,
  LayoutDashboard,
  Shield,
  Layers,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
  TrendingUp,
  Plus,
  XCircle,
  MapPin,
  FileText,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import React from 'react';

interface UserData {
  nim: string;
  nama: string;
  role: string;
  group_id?: string;
}

interface GroupInfo {
  id: string;
  nama_kelompok: string;
  kode_kelompok: string;
  kategori: string;
  musyrif_nim: string | null;
}

export default function DynamicGroupMusyrifPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [unwrappedParams, setUnwrappedParams] = useState<{ groupId: string } | null>(null);

  const [musyrif, setMusyrif] = useState<UserData | null>(null);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'pekanan' | 'presensi' | 'setoran'>('pekanan');
  const [loading, setLoading] = useState(true);

  // State Data Kelompok
  const [anggotaList, setAnggotaList] = useState<UserData[]>([]);
  const [pekananList, setPekananList] = useState<any[]>([]);
  const [meetingsList, setMeetingsList] = useState<any[]>([]);
  const [setoranList, setSetoranList] = useState<any[]>([]);
  const [copiedKode, setCopiedKode] = useState(false);

  // Filter Berdasarkan Anggota
  const [selectedMemberNim, setSelectedMemberNim] = useState<string>('all');

  // Modal Buat Pertemuan Liqo & Presensi
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingTanggal, setMeetingTanggal] = useState('');
  const [meetingJudul, setMeetingJudul] = useState('');
  const [meetingTempat, setMeetingTempat] = useState('Masjid Kampus');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'hadir' | 'izin' | 'sakit' | 'alpa'>>({});
  const [savingMeeting, setSavingMeeting] = useState(false);

  useEffect(() => {
    params.then((res) => {
      setUnwrappedParams(res);
    });
  }, [params]);

  useEffect(() => {
    if (!unwrappedParams) return;

    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setMeetingTanggal(localDate);

    const saved = localStorage.getItem('mutabaah_user');
    if (!saved) {
      router.push('/');
      return;
    }
    const parsedUser: UserData = JSON.parse(saved);
    if (parsedUser.role !== 'musyrif' && parsedUser.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setMusyrif(parsedUser);
    fetchGroupData(unwrappedParams.groupId);
  }, [unwrappedParams, router]);

  const fetchGroupData = async (targetGroupId: string) => {
    setLoading(true);
    try {
      // 1. Ambil detail grup
      const { data: gData } = await supabase
        .from('groups')
        .select('*')
        .eq('id', targetGroupId)
        .single();

      if (gData) setGroupInfo(gData);

      // 2. Ambil anggota dalam grup ini
      const { data: usersData } = await supabase
        .from('users')
        .select('nim, nama, role, group_id')
        .eq('group_id', targetGroupId)
        .order('role', { ascending: true })
        .order('nama', { ascending: true });

      const members = usersData || [];
      setAnggotaList(members);

      // Inisialisasi default hadir pada presensi
      const initialAtt: Record<string, 'hadir' | 'izin' | 'sakit' | 'alpa'> = {};
      members.forEach((m) => {
        initialAtt[m.nim] = 'hadir';
      });
      setAttendanceMap(initialAtt);

      const memberNims = members.map((m) => m.nim);

      if (memberNims.length > 0) {
        // 3. Ambil laporan evaluasi pekanan kelompok (tanpa foreign key join agar anti-gagal)
        const { data: pData, error: pErr } = await supabase
          .from('mutabaah_pekanan')
          .select('*')
          .eq('group_id', targetGroupId)
          .order('created_at', { ascending: false });

        if (pErr) console.error('Error fetch pekanan:', pErr);

        if (pData) {
          // Petakan nama user secara lokal dari daftar anggota
          const enrichedPekanan = pData.map((item) => {
            const memberObj = members.find((m) => m.nim === item.user_nim);
            return {
              ...item,
              user: {
                nama: memberObj?.nama || item.user_nim,
              },
            };
          });
          setPekananList(enrichedPekanan);
        }

        // 4. Ambil pertemuan liqo & presensi kelompok
        const { data: mData } = await supabase
          .from('liqo_meetings')
          .select(`
            *,
            presensi:liqo_presensi(user_nim, status, catatan)
          `)
          .eq('group_id', targetGroupId)
          .order('tanggal', { ascending: false });

        if (mData) setMeetingsList(mData);

        // 5. Ambil log setoran Qur'an anggota grup
        const { data: sData } = await supabase
          .from('setoran_logs')
          .select(`
            *,
            penyetor:users!setoran_logs_penyetor_nim_fkey(nama),
            penyimak:users!setoran_logs_penyimak_nim_fkey(nama)
          `)
          .in('penyetor_nim', memberNims)
          .order('created_at', { ascending: false })
          .limit(40);

        if (sData) setSetoranList(sData);
      }
    } catch (error) {
      console.error('Gagal mengambil data kelompok:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKode = () => {
    if (!groupInfo?.kode_kelompok) return;
    navigator.clipboard.writeText(groupInfo.kode_kelompok);
    setCopiedKode(true);
    setTimeout(() => setCopiedKode(false), 2000);
  };

  // Simpan Pertemuan Liqo & Absensi Baru
  const handleSaveMeetingAndAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unwrappedParams || !musyrif || !meetingJudul.trim()) return;

    setSavingMeeting(true);
    try {
      // 1. Buat pertemuan liqo
      const { data: meeting, error: mErr } = await supabase
        .from('liqo_meetings')
        .insert([
          {
            group_id: unwrappedParams.groupId,
            musyrif_nim: musyrif.nim,
            tanggal: meetingTanggal,
            judul_materi: meetingJudul.trim(),
            tempat: meetingTempat.trim() || 'Masjid Kampus',
          },
        ])
        .select()
        .single();

      if (mErr || !meeting) throw mErr;

      // 2. Buat record presensi untuk seluruh anggota
      const presensiRows = anggotaList.map((m) => ({
        meeting_id: meeting.id,
        user_nim: m.nim,
        status: attendanceMap[m.nim] || 'hadir',
      }));

      if (presensiRows.length > 0) {
        const { error: pErr } = await supabase.from('liqo_presensi').insert(presensiRows);
        if (pErr) throw pErr;
      }

      setIsMeetingModalOpen(false);
      setMeetingJudul('');
      fetchGroupData(unwrappedParams.groupId);
    } catch (err: any) {
      alert('Gagal mencatat pertemuan: ' + err.message);
    } finally {
      setSavingMeeting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mutabaah_user');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 pb-16">
      {/* Header Navbar */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/musyrif')}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-950 hover:bg-stone-200 text-stone-600 dark:text-stone-300 transition cursor-pointer"
              title="Kembali ke Ruang Musyrif"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {groupInfo?.kategori === 'umum' ? 'Halaqah Umum' : 'Mentoring Kampus'}
                </span>
                <button
                  onClick={handleCopyKode}
                  className="flex items-center gap-1.5 text-xs font-mono font-bold bg-stone-100 dark:bg-stone-950 hover:bg-stone-200 px-2 py-0.5 rounded-md text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-800 transition cursor-pointer"
                  title="Klik untuk salin kode kelompok"
                >
                  <span>{groupInfo?.kode_kelompok}</span>
                  {copiedKode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-stone-400" />
                  )}
                </button>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-stone-800 dark:text-stone-100 mt-1">
                {groupInfo?.nama_kelompok || 'Memuat Kelompok...'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition cursor-pointer"
              title="Ganti Tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Isi Mutabaahku</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-950 hover:bg-red-50 text-stone-600 dark:text-stone-300 hover:text-red-600 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Ringkasan Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Anggota Halaqah
              </p>
              <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mt-1">
                {anggotaList.length} Orang
              </h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Sesi Liqo Terlaksana
              </p>
              <h2 className="text-2xl font-bold text-emerald-600 mt-1">
                {meetingsList.length} Pertemuan
              </h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Laporan Pekanan Masuk
              </p>
              <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mt-1">
                {pekananList.length} Laporan
              </h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Controls v0.3: Evaluasi Pekanan | Presensi Sesi Liqo | Setoran Qur'an */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-3 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="relative flex bg-stone-100 dark:bg-stone-950 p-1 rounded-xl sm:w-[420px]">
            <button
              onClick={() => setActiveTab('pekanan')}
              className={`relative z-10 flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'pekanan' ? 'text-emerald-800' : 'text-stone-500'
              }`}
            >
              {activeTab === 'pekanan' && (
                <motion.div
                  layoutId="groupMusyrifTab"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  className="absolute inset-0 bg-white dark:bg-stone-900 rounded-lg shadow-sm -z-10"
                />
              )}
              <TrendingUp className="w-4 h-4" />
              <span>Evaluasi Pekanan</span>
            </button>

            <button
              onClick={() => setActiveTab('presensi')}
              className={`relative z-10 flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'presensi' ? 'text-emerald-800' : 'text-stone-500'
              }`}
            >
              {activeTab === 'presensi' && (
                <motion.div
                  layoutId="groupMusyrifTab"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  className="absolute inset-0 bg-white dark:bg-stone-900 rounded-lg shadow-sm -z-10"
                />
              )}
              <UserCheck className="w-4 h-4" />
              <span>Presensi Liqo</span>
            </button>

            <button
              onClick={() => setActiveTab('setoran')}
              className={`relative z-10 flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'setoran' ? 'text-emerald-800' : 'text-stone-500'
              }`}
            >
              {activeTab === 'setoran' && (
                <motion.div
                  layoutId="groupMusyrifTab"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  className="absolute inset-0 bg-white dark:bg-stone-900 rounded-lg shadow-sm -z-10"
                />
              )}
              <BookOpen className="w-4 h-4" />
              <span>Log Setoran</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Dropdown Anggota */}
            <div className="relative">
              <select
                value={selectedMemberNim}
                onChange={(e) => setSelectedMemberNim(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-xs font-semibold text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">Semua Anggota ({anggotaList.length})</option>
                {anggotaList.map((m) => (
                  <option key={m.nim} value={m.nim}>
                    {m.nama}
                  </option>
                ))}
              </select>
            </div>

            {activeTab === 'presensi' && (
              <button
                onClick={() => setIsMeetingModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Input Sesi Liqo</span>
              </button>
            )}
            <button
              onClick={() => unwrappedParams && fetchGroupData(unwrappedParams.groupId)}
              className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-950 hover:bg-stone-200 text-stone-600 dark:text-stone-300 transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Isi Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'pekanan' ? (
            /* TAB 1: Evaluasi Pekanan Kelompok */
            <motion.div
              key="group-pekanan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="bg-emerald-50 border border-emerald-200/80 p-3.5 rounded-2xl text-xs text-emerald-800 flex items-center justify-between">
                <span>
                  🛡️ <strong>Safe Space Activated:</strong> Menjaga keikhlasan & privasi amalan pribadi mentee. Musyrif mengevaluasi laporan progres agregat mingguan.
                </span>
              </div>

              {(() => {
                const filteredPekanan = selectedMemberNim === 'all'
                  ? pekananList
                  : pekananList.filter((p) => p.user_nim === selectedMemberNim);

                if (filteredPekanan.length === 0) {
                  return (
                    <div className="bg-white dark:bg-stone-900 p-10 rounded-3xl border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-400">
                      {selectedMemberNim === 'all'
                        ? 'Belum ada laporan evaluasi pekanan yang dikirim oleh anggota kelompok ini.'
                        : 'Belum ada laporan evaluasi pekanan dari anggota yang dipilih.'}
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPekanan.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-950 text-stone-600 dark:text-stone-300">
                              {item.tanggal_lapor}
                            </span>
                            <h3 className="font-bold text-base text-stone-800 dark:text-stone-100 mt-1.5">
                              {item.user?.nama || item.user_nim}
                            </h3>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5 text-center text-xs pt-1">
                          <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                            <span className="text-[10px] text-stone-400 font-semibold block">Jamaah</span>
                            <span className="font-bold text-stone-800 dark:text-stone-100 mt-0.5 block">{item.rata_jamaah}/5</span>
                          </div>
                          <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                            <span className="text-[10px] text-stone-400 font-semibold block">Tilawah</span>
                            <span className="font-bold text-stone-800 dark:text-stone-100 mt-0.5 block">{item.total_tilawah_halaman} hal</span>
                          </div>
                          <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                            <span className="text-[10px] text-stone-400 font-semibold block">Tahajud</span>
                            <span className="font-bold text-stone-800 dark:text-stone-100 mt-0.5 block">{item.total_qiyamul_lail}x</span>
                          </div>
                          <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                            <span className="text-[10px] text-stone-400 font-semibold block">Dhuha</span>
                            <span className="font-bold text-stone-800 dark:text-stone-100 mt-0.5 block">{item.total_dhuha}x</span>
                          </div>
                        </div>

                        {item.catatan_evaluasi && (
                          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-850 text-xs text-stone-600 dark:text-stone-300 italic">
                            &ldquo;{item.catatan_evaluasi}&rdquo;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </motion.div>
          ) : activeTab === 'presensi' ? (
            /* TAB 2: Presensi Sesi Liqo */
            <motion.div
              key="group-presensi"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {meetingsList.length === 0 ? (
                <div className="bg-white dark:bg-stone-900 p-10 rounded-3xl border border-stone-200 dark:border-stone-800 text-center space-y-3">
                  <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
                  <p className="text-xs text-stone-400">Belum ada riwayat sesi pertemuan liqo yang dicatat.</p>
                  <button
                    onClick={() => setIsMeetingModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Sesi Liqo Pertama</span>
                  </button>
                </div>
              ) : (
                meetingsList.map((m) => {
                  const hadirCount = m.presensi?.filter((p: any) => p.status === 'hadir').length || 0;
                  const total = m.presensi?.length || 0;

                  return (
                    <div
                      key={m.id}
                      className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100 dark:border-stone-850">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {m.tanggal}
                            </span>
                            <span className="text-xs text-stone-400 font-medium">📍 {m.tempat}</span>
                          </div>
                          <h3 className="font-bold text-base text-stone-800 dark:text-stone-100 mt-1">{m.judul_materi}</h3>
                        </div>

                        <span className="text-xs font-bold px-3 py-1 bg-stone-100 dark:bg-stone-950 text-stone-700 dark:text-stone-200 rounded-full self-start sm:self-auto">
                          Kehadiran: {hadirCount} / {total} Anggota
                        </span>
                      </div>

                      {/* Detail Status Anggota */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {m.presensi?.map((p: any) => {
                          const userObj = anggotaList.find((a) => a.nim === p.user_nim);
                          return (
                            <div
                              key={p.user_nim}
                              className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-850 flex items-center justify-between gap-2"
                            >
                              <span className="text-xs font-semibold text-stone-800 dark:text-stone-100 truncate">
                                {userObj?.nama || p.user_nim}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shrink-0 ${
                                  p.status === 'hadir'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : p.status === 'izin'
                                    ? 'bg-blue-100 text-blue-800'
                                    : p.status === 'sakit'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {p.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          ) : (
            /* TAB 3: Setoran Qur'an */
            <motion.div
              key="group-setoran"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {(() => {
                const filteredSetoran = selectedMemberNim === 'all'
                  ? setoranList
                  : setoranList.filter(
                      (s) => s.penyetor_nim === selectedMemberNim || s.penyimak_nim === selectedMemberNim
                    );

                if (filteredSetoran.length === 0) {
                  return (
                    <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 text-center text-sm text-stone-400">
                      {selectedMemberNim === 'all'
                        ? 'Belum ada catatan setoran Al-Qur\'an di kelompok ini.'
                        : 'Belum ada catatan setoran dari/ke anggota yang dipilih.'}
                    </div>
                  );
                }

                return filteredSetoran.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-800 dark:text-stone-100 text-sm">
                          {item.penyetor?.nama || item.penyetor_nim}
                        </span>
                        <span className="text-xs text-stone-400">menyetor ke</span>
                        <span className="font-semibold text-emerald-700 text-sm">
                          {item.penyimak?.nama || item.penyimak_nim}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                        📖 QS. {item.surah} : Ayat {item.ayat}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100 dark:border-stone-850">
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
                ));
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal Input Pertemuan Liqo & Absensi */}
      <AnimatePresence>
        {isMeetingModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-100 dark:border-stone-850 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-850">
                <h3 className="font-bold text-base text-stone-800 dark:text-stone-100">
                  Input Sesi Liqo & Presensi Kehadiran
                </h3>
                <button
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="text-stone-400 hover:text-stone-600 dark:text-stone-300 font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveMeetingAndAttendance} className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                      Tanggal Sesi
                    </label>
                    <input
                      type="date"
                      required
                      value={meetingTanggal}
                      onChange={(e) => setMeetingTanggal(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 font-semibold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                      Lokasi / Tempat
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Serambi Masjid"
                      value={meetingTempat}
                      onChange={(e) => setMeetingTempat(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 font-semibold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                    Judul Materi / Bahasan Pekanan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Urgensi Menuntut Ilmu & Adab Liqo"
                    value={meetingJudul}
                    onChange={(e) => setMeetingJudul(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Checklist Presensi Anggota */}
                <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-850">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Status Kehadiran Anggota ({anggotaList.length} orang)
                  </label>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {anggotaList.map((m) => (
                      <div
                        key={m.nim}
                        className="bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl flex items-center justify-between gap-2 border border-stone-200 dark:border-stone-800"
                      >
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-100 truncate">
                          {m.nama}
                        </span>

                        <div className="flex gap-1 shrink-0">
                          {(['hadir', 'izin', 'sakit', 'alpa'] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() =>
                                setAttendanceMap((prev) => ({ ...prev, [m.nim]: st }))
                              }
                              className={`px-2 py-1 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                                (attendanceMap[m.nim] || 'hadir') === st
                                  ? st === 'hadir'
                                    ? 'bg-emerald-600 text-white'
                                    : st === 'izin'
                                    ? 'bg-blue-600 text-white'
                                    : st === 'sakit'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-red-600 text-white'
                                  : 'bg-white dark:bg-stone-900 text-stone-500 border border-stone-200 dark:border-stone-800'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsMeetingModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-stone-500 hover:bg-stone-100 dark:bg-stone-950 text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingMeeting}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    {savingMeeting ? 'Menyimpan Sesi...' : 'Simpan Presensi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
