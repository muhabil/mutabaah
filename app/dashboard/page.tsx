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
  KeyRound,
  ArrowRight,
  Shield,
  Layers,
  Lock,
  TrendingUp,
  UserCheck,
  Calculator,
  User,
  Flame,
  Moon,
  Sun,
  Heart,
  Snowflake,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];
const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ahd'];
import { useTheme } from '@/lib/ThemeContext';

interface UserData {
  nim: string;
  nama: string;
  role: string;
  group_id?: string;
  is_udzur?: boolean;
}

interface GroupDetail {
  id: string;
  nama_kelompok: string;
  kode_kelompok: string;
  kategori: string;
  musyrif?: any;
}

export default function DashboardAnggota() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<UserData | null>(null);

  // Bottom Nav Bar State: 'kelompok' | 'amal' | 'profil'
  const [bottomNav, setBottomNav] = useState<'amal' | 'kelompok' | 'profil'>('amal');

  // Sub-tab di dalam Menu 1 (Kelompok): 'anggota' | 'pekanan' | 'setoran'
  const [kelompokSubTab, setKelompokSubTab] = useState<'anggota' | 'pekanan' | 'setoran'>('anggota');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // State Mutabaah Hari Ini (Ranah Privat - Menu 2)
  const [today, setToday] = useState('');
  const [shalatJamaah, setShalatJamaah] = useState(0);
  const [tilawahHalaman, setTilawahHalaman] = useState(0);
  const [qiyamulLail, setQiyamulLail] = useState(false);
  const [dhuha, setDhuha] = useState(false);
  const [almatsurat, setAlmatsurat] = useState(false);

  // State Gamifikasi (v0.4): Streak, Freeze Udzur, & Badges
  const [streakDays, setStreakDays] = useState(0);
  const [isUdzur, setIsUdzur] = useState(false);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [pekanRataJamaah, setPekanRataJamaah] = useState('0');
  const [pekanTilawah, setPekanTilawah] = useState('0');
  const [pekanTahajud, setPekanTahajud] = useState('0');
  const [pekanDhuha, setPekanDhuha] = useState('0');
  const [pekanMatsurat, setPekanMatsurat] = useState('0');
  const [pekanCatatan, setPekanCatatan] = useState('');
  const [calculatingPekan, setCalculatingPekan] = useState(false);
  const [riwayatPekanan, setRiwayatPekanan] = useState<any[]>([]);

  // State Kelompok & Rekan Liqo
  const [myGroup, setMyGroup] = useState<GroupDetail | null>(null);
  const [groupMembers, setGroupMembers] = useState<UserData[]>([]);
  const [groupMeetings, setGroupMeetings] = useState<any[]>([]);
  const [inputKodeKelompok, setInputKodeKelompok] = useState('');
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [groupError, setGroupError] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  // State Setoran Peer-to-Peer (Menu 1)
  const [temanList, setTemanList] = useState<UserData[]>([]);
  const [penyimakNim, setPenyimakNim] = useState('');
  const [surah, setSurah] = useState('');
  const [ayat, setAyat] = useState('');
  const [jenisSetoran, setJenisSetoran] = useState<'ziyadah' | 'murajaah'>('ziyadah');
  const [riwayatSetoran, setRiwayatSetoran] = useState<any[]>([]);

  // State Kalender Riwayat Keaktifan (v0.8)
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(9); // 0-indexed
  const [selectedCalDay, setSelectedCalDay] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setToday(localDate);
    setCalendarYear(now.getFullYear());
    setCalendarMonth(now.getMonth());
    setSelectedCalDay(localDate);

    const saved = localStorage.getItem('mutabaah_user');
    if (!saved) {
      router.push('/login');
      return;
    }
    const parsedUser: UserData = JSON.parse(saved);
    setUser(parsedUser);
    fetchInitialData(parsedUser.nim, localDate);
  }, [router]);

  const fetchInitialData = async (nim: string, currentDate: string) => {
    setLoading(true);
    try {
      // 1. Mutabaah harian pribadi
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

      // 1b. Cek user & kelompok (Pilih kolom profil aman, hindari select * agar tidak memicu permission denied pada password)
      const { data: dbUser, error: userErr } = await supabase
        .from('users')
        .select('id, nim, nama, role, group_id, status, is_udzur')
        .eq('nim', nim)
        .maybeSingle();

      if (userErr) {
        console.warn('Gagal memuat profil dbUser:', userErr.message);
      }

      const savedUserStr = localStorage.getItem('mutabaah_user');
      const prevUser: UserData | null = savedUserStr ? JSON.parse(savedUserStr) : null;
      const activeUser: UserData = dbUser
        ? { ...prevUser, ...dbUser }
        : prevUser || { nim, nama: '', role: 'anggota' };

      if (dbUser) {
        localStorage.setItem('mutabaah_user', JSON.stringify(activeUser));
        setUser(activeUser);
        setIsUdzur(dbUser.is_udzur || false);
      }

      if (activeUser.group_id) {
        const { data: groupData } = await supabase
          .from('groups')
          .select('*')
          .eq('id', activeUser.group_id)
          .single();

        if (groupData) setMyGroup(groupData);

        // Anggota sekelompok
        const { data: usersData } = await supabase
          .from('users')
          .select('nim, nama, role, group_id')
          .eq('group_id', activeUser.group_id);

        if (usersData) {
          setGroupMembers(usersData);
          setTemanList(usersData.filter((u) => u.nim !== nim));
        }

        // Pertemuan liqo kelompok
        const { data: meetingsData } = await supabase
          .from('liqo_meetings')
          .select(`
            *,
            presensi:liqo_presensi(user_nim, status, catatan)
          `)
          .eq('group_id', activeUser.group_id)
          .order('tanggal', { ascending: false });

        if (meetingsData) setGroupMeetings(meetingsData);

        // Riwayat laporan pekanan user
        const { data: pekananData } = await supabase
          .from('mutabaah_pekanan')
          .select('*')
          .eq('user_nim', nim)
          .order('created_at', { ascending: false })
          .limit(6);

        if (pekananData) setRiwayatPekanan(pekananData);
      }

      // Riwayat setoran user
      const { data: setoranData } = await supabase
        .from('setoran_logs')
        .select('*, penyimak:users!setoran_logs_penyimak_nim_fkey(nama)')
        .eq('penyetor_nim', nim)
        .order('created_at', { ascending: false })
        .limit(5);

      if (setoranData) setRiwayatSetoran(setoranData);

      // 6. Hitung Streak & Muat Badges Gamifikasi (v0.4)
      await calculateStreakAndBadges(nim, mutabaahData, setoranData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Logika Hitung Streak & Evaluasi Badges (v0.4)
  const calculateStreakAndBadges = async (nim: string, todayLog: any, userSetorans: any[] | null) => {
    try {
      // Ambil riwayat log mutabaah untuk kalkulasi streak & kalender keaktifan
      const { data: logs } = await supabase
        .from('mutabaah_logs')
        .select('*')
        .eq('user_nim', nim)
        .order('tanggal', { ascending: false })
        .limit(180);

      if (logs) setAllLogs(logs);

      // 1. Hitung Streak Berturut-turut
      let streak = 0;
      if (logs && logs.length > 0) {
        const dateSet = new Set(logs.map((l) => l.tanggal));
        const checkDate = new Date();

        // Cek apakah hari ini sudah isi, jika belum mulai cek dari kemarin
        const todayStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (!dateSet.has(todayStr)) {
          checkDate.setDate(checkDate.getDate() - 1);
        }

        while (true) {
          const formatted = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
          if (dateSet.has(formatted)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
      setStreakDays(streak);

      // 2. Evaluasi Badges yang Berhak Dibuka
      const newUnlocked: string[] = [];

      // Badge: First Step (Pernah isi minimal 1 hari)
      if (logs && logs.length >= 1) newUnlocked.push('first_step');

      // Badge: Consistency Hero (Streak minimal 3 hari berturut-turut)
      if (streak >= 3) newUnlocked.push('streak_3');
      if (streak >= 7) newUnlocked.push('streak_7');

      // Badge: Jamaah Champion (Pernah 5 waktu jamaah dalam 1 hari)
      if (logs?.some((l) => (l.shalat_jamaah || 0) >= 5) || todayLog?.shalat_jamaah >= 5) {
        newUnlocked.push('jamaah_champion');
      }

      // Badge: Night Owl / Tahajud Warrior (Pernah tahajud)
      if (logs?.some((l) => l.qiyamul_lail) || todayLog?.qiyamul_lail) {
        newUnlocked.push('tahajud_warrior');
      }

      // Badge: Dhuha Seeker (Pernah dhuha)
      if (logs?.some((l) => l.dhuha) || todayLog?.dhuha) {
        newUnlocked.push('dhuha_seeker');
      }

      // Badge: Peer Tasmi' (Pernah setor Qur'an)
      if (userSetorans && userSetorans.length > 0) {
        newUnlocked.push('first_tasmi');
      }

      setUnlockedBadges(newUnlocked);
    } catch (e) {
      console.error('Error calculate streak:', e);
    }
  };

  // Toggle Mode Udzur Syar'i (Freeze Streak)
  const handleToggleUdzur = async () => {
    if (!user) return;
    const nextState = !isUdzur;
    setIsUdzur(nextState);

    try {
      await supabase
        .from('users')
        .update({ is_udzur: nextState })
        .eq('nim', user.nim);

      const updated = { ...user, is_udzur: nextState };
      setUser(updated);
      localStorage.setItem('mutabaah_user', JSON.stringify(updated));

      showToast(
        nextState
          ? 'Mode Udzur Syar&apos;i aktif. Streak kamu dibekukan (aman) ❄️'
          : 'Alhamdulillah, Mode Udzur dinonaktifkan kembali ✨'
      );
    } catch (e: any) {
      console.error(e);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Gabung Kelompok
  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inputKodeKelompok.trim()) return;

    setJoiningGroup(true);
    setGroupError('');

    try {
      const cleanKode = inputKodeKelompok.trim().toUpperCase();

      const { data: groupData, error: groupErr } = await supabase
        .from('groups')
        .select('*')
        .ilike('kode_kelompok', cleanKode)
        .single();

      if (groupErr || !groupData) {
        setGroupError(`Kode kelompok "${cleanKode}" tidak ditemukan! Mohon periksa kembali.`);
        setJoiningGroup(false);
        return;
      }

      const { error: updateErr } = await supabase
        .from('users')
        .update({ group_id: groupData.id })
        .eq('nim', user.nim);

      if (updateErr) {
        setGroupError('Gagal bergabung: ' + updateErr.message);
        setJoiningGroup(false);
        return;
      }

      const updatedUser = { ...user, group_id: groupData.id };
      setUser(updatedUser);
      localStorage.setItem('mutabaah_user', JSON.stringify(updatedUser));
      setMyGroup(groupData);
      setShowJoinModal(false);
      setInputKodeKelompok('');
      showToast(`Alhamdulillah! Berhasil bergabung ke ${groupData.nama_kelompok} 🎉`);
      fetchInitialData(user.nim, today);
    } catch (err: any) {
      setGroupError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setJoiningGroup(false);
    }
  };

  // Simpan Mutabaah Harian (Menu 2 - Pribadi)
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
      showToast('Alhamdulillah, Mutabaah hari ini tersimpan di ruang privatmu! 🔒✨');

      const newEntry = {
        user_nim: user.nim,
        tanggal: today,
        shalat_jamaah: shalatJamaah,
        tilawah_halaman: tilawahHalaman,
        qiyamul_lail: qiyamulLail,
        dhuha: dhuha,
        almatsurat: almatsurat,
      };
      setAllLogs((prev) => [newEntry, ...prev.filter((l) => l.tanggal !== today)]);
      calculateStreakAndBadges(user.nim, newEntry, riwayatSetoran);
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Magic Feature: Tarik Otomatis dari Mutabaah Harian 7 Hari Terakhir
  const handlePullFromDailyHabits = async () => {
    if (!user) return;
    setCalculatingPekan(true);

    try {
      const todayDate = new Date();
      const pastDate = new Date();
      pastDate.setDate(todayDate.getDate() - 7);

      const toStr = todayDate.toISOString().split('T')[0];
      const fromStr = pastDate.toISOString().split('T')[0];

      const { data: logs, error } = await supabase
        .from('mutabaah_logs')
        .select('*')
        .eq('user_nim', user.nim)
        .gte('tanggal', fromStr)
        .lte('tanggal', toStr);

      if (error) throw error;

      if (!logs || logs.length === 0) {
        alert('Belum ada catatan mutabaah harian selama 7 hari terakhir.');
        setCalculatingPekan(false);
        return;
      }

      let totalJamaah = 0;
      let totalTilawah = 0;
      let countTahajud = 0;
      let countDhuha = 0;
      let countMatsurat = 0;

      logs.forEach((log) => {
        totalJamaah += log.shalat_jamaah || 0;
        totalTilawah += log.tilawah_halaman || 0;
        if (log.qiyamul_lail) countTahajud++;
        if (log.dhuha) countDhuha++;
        if (log.almatsurat) countMatsurat++;
      });

      const avgJamaah = (totalJamaah / logs.length).toFixed(1);

      setPekanRataJamaah(avgJamaah);
      setPekanTilawah(String(totalTilawah));
      setPekanTahajud(String(countTahajud));
      setPekanDhuha(String(countDhuha));
      setPekanMatsurat(String(countMatsurat));

      showToast(`Berhasil menarik ringkasan dari ${logs.length} hari mutabaah harianmu! ⚡`);
    } catch (err: any) {
      alert('Gagal menghitung: ' + err.message);
    } finally {
      setCalculatingPekan(false);
    }
  };

  // Simpan Laporan Pekanan ke Mentor (tanpa input nomor pekan)
  const handleSubmitPekan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.group_id) return;

    setSaving(true);
    try {
      const payload = {
        group_id: user.group_id,
        user_nim: user.nim,
        pekan_ke: riwayatPekanan.length + 1,
        tanggal_lapor: today,
        rata_jamaah: parseFloat(pekanRataJamaah) || 0,
        total_tilawah_halaman: parseInt(pekanTilawah) || 0,
        total_qiyamul_lail: parseInt(pekanTahajud) || 0,
        total_dhuha: parseInt(pekanDhuha) || 0,
        total_almatsurat: parseInt(pekanMatsurat) || 0,
        catatan_evaluasi: pekanCatatan.trim() || null,
      };

      const { error } = await supabase.from('mutabaah_pekanan').insert([payload]);

      if (error) throw error;

      showToast(`Alhamdulillah! Laporan evaluasi berhasil dikirim ke Mentor! 🎉`);
      setPekanCatatan('');
      fetchInitialData(user.nim, today);
    } catch (err: any) {
      alert('Gagal mengirim laporan: ' + err.message);
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

      showToast('Alhamdulillah, setoran hafalan berhasil dicatat! ✨');
      setSurah('');
      setAyat('');
      fetchInitialData(user.nim, today);
    } catch (err: any) {
      alert('Gagal mencatat setoran: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('mutabaah_user');
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/login');
  };

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
      <div className="min-h-screen bg-stone-100 dark:bg-stone-800 dark:bg-stone-950 flex items-center justify-center">
        <div className="text-stone-500 dark:text-stone-400 text-sm animate-pulse">Memuat Space kamu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-800 dark:bg-stone-950 transition-colors duration-200 pb-28">
      {/* Toast Notification */}
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
      <div className="bg-white dark:bg-stone-900 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 dark:border-stone-800 sticky top-0 z-20 transition-colors">
        <div className="max-w-md mx-auto px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-stone-400 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {today}
            </p>
            <h1 className="text-base font-bold text-stone-800 dark:text-stone-100 dark:text-stone-100">
              Halo, {user?.nama}! 👋
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Tombol Dark Mode */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition cursor-pointer"
              title="Ganti Tema"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-stone-600" />}
            </button>

            {(user?.role === 'musyrif' || user?.role === 'admin') && (
              <button
                onClick={() => router.push('/musyrif')}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-emerald-200 dark:border-emerald-800"
              >
                <Shield className="w-4 h-4" />
                <span>Mode Musyrif</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-red-950 text-stone-600 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 transition flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Onboarding jika belum masuk kelompok */}
        {!myGroup && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 p-6 rounded-3xl shadow-sm text-center space-y-4 my-6"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <KeyRound className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-stone-800 dark:text-stone-100">
                Langkah Terakhir: Masuk ke Kelompok
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Fitur mutabaah dan setoran Qur&apos;an akan terbuka setelah kamu terhubung dengan kelompok mentoring.
              </p>
            </div>

            <form onSubmit={handleJoinGroup} className="space-y-3 pt-2 max-w-xs mx-auto">
              <input
                type="text"
                required
                placeholder="Masukkan Kode (e.g. FUTUWWAH-01)"
                value={inputKodeKelompok}
                onChange={(e) => setInputKodeKelompok(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 text-sm font-mono font-bold uppercase text-stone-800 dark:text-stone-100 text-center focus:bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {groupError && (
                <p className="text-xs text-red-600 font-medium">{groupError}</p>
              )}

              <button
                type="submit"
                disabled={joiningGroup}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer disabled:bg-emerald-400"
              >
                <span>{joiningGroup ? 'Menghubungkan...' : 'Gabung ke Kelompok'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* KONTEN DENGAN BOTTOM NAVBAR (Hanya jika sudah join group)     */}
        {/* ============================================================ */}
        {myGroup && (
          <>
            {/* ============================================================ */}
            {/* 1. MENU KELOMPOK: Anggota Liqo, Pekanan & Setoran            */}
            {/* ============================================================ */}
            {bottomNav === 'kelompok' && (
              <motion.div
                key="view-kelompok"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Header Info Kelompok */}
                <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {myGroup.kategori === 'umum' ? 'Halaqah Umum' : 'Mentoring Kampus'}
                    </span>
                    <button
                      onClick={() => setShowJoinModal(true)}
                      className="text-xs text-stone-500 hover:text-emerald-700 font-semibold cursor-pointer"
                    >
                      Ganti Kode
                    </button>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">
                      {myGroup.nama_kelompok}
                    </h2>
                    <p className="text-xs text-stone-400 font-mono mt-0.5">
                      Kode: <span className="font-bold text-stone-700 dark:text-stone-200">{myGroup.kode_kelompok}</span>
                    </p>
                  </div>
                </div>

                {/* Sub Tab Switcher di Menu Kelompok: Anggota & Presensi | Laporan Pekanan | Setoran */}
                <div className="relative flex bg-stone-200/80 dark:bg-stone-800 p-1.5 rounded-2xl">
                  <button
                    onClick={() => setKelompokSubTab('anggota')}
                    className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      kelompokSubTab === 'anggota' ? 'text-emerald-800' : 'text-stone-500'
                    }`}
                  >
                    {kelompokSubTab === 'anggota' && (
                      <motion.div
                        layoutId="kelompokTabPill"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                        className="absolute inset-0 bg-white dark:bg-stone-900 rounded-xl shadow-sm -z-10"
                      />
                    )}
                    <Users className="w-3.5 h-3.5" />
                    <span>Anggota</span>
                  </button>

                  <button
                    onClick={() => setKelompokSubTab('pekanan')}
                    className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      kelompokSubTab === 'pekanan' ? 'text-emerald-800' : 'text-stone-500'
                    }`}
                  >
                    {kelompokSubTab === 'pekanan' && (
                      <motion.div
                        layoutId="kelompokTabPill"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                        className="absolute inset-0 bg-white dark:bg-stone-900 rounded-xl shadow-sm -z-10"
                      />
                    )}
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Pekanan</span>
                  </button>

                  <button
                    onClick={() => setKelompokSubTab('setoran')}
                    className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      kelompokSubTab === 'setoran' ? 'text-emerald-800' : 'text-stone-500'
                    }`}
                  >
                    {kelompokSubTab === 'setoran' && (
                      <motion.div
                        layoutId="kelompokTabPill"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                        className="absolute inset-0 bg-white dark:bg-stone-900 rounded-xl shadow-sm -z-10"
                      />
                    )}
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Setoran</span>
                  </button>
                </div>

                {/* Sub Tab 1: Anggota & Pertemuan Liqo */}
                {kelompokSubTab === 'anggota' && (
                  <motion.div
                    key="sub-anggota"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    {/* Daftar Anggota */}
                    <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
                      <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        Daftar Anggota Liqo ({groupMembers.length})
                      </h3>

                      <div className="divide-y divide-stone-100">
                        {groupMembers.map((m) => (
                          <div key={m.nim} className="py-2.5 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-stone-800 dark:text-stone-100">
                                  {m.nama}
                                </span>
                                {m.nim === user?.nim && (
                                  <span className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-500 px-1.5 py-0.2 rounded font-medium">
                                    Kamu
                                  </span>
                                )}
                                {m.role === 'musyrif' && (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                                    Mentor
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-stone-400">NIM/ID: {m.nim}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Riwayat Sesi Liqo */}
                    <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
                      <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        Sesi Liqo & Kehadiran
                      </h3>

                      {groupMeetings.length === 0 ? (
                        <p className="text-xs text-stone-400 py-3 text-center">
                          Belum ada sesi pertemuan liqo yang tercatat dari Mentor.
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {groupMeetings.map((mt) => {
                            const myStatus = mt.presensi?.find((p: any) => p.user_nim === user?.nim)?.status || 'alpa';

                            return (
                              <div
                                key={mt.id}
                                className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-2"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <h4 className="text-xs font-bold text-stone-800 dark:text-stone-100">
                                      {mt.judul_materi}
                                    </h4>
                                    <p className="text-[10px] text-stone-400 mt-0.5">
                                      {mt.tanggal} • {mt.tempat}
                                    </p>
                                  </div>
                                  <span
                                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shrink-0 ${
                                      myStatus === 'hadir'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : myStatus === 'izin'
                                        ? 'bg-blue-100 text-blue-800'
                                        : myStatus === 'sakit'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {myStatus}
                                  </span>
                                </div>

                                {mt.deskripsi && (
                                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-300">
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 block text-[10px] mb-0.5">
                                      📌 Catatan Pertemuan &amp; Penugasan:
                                    </span>
                                    <p className="whitespace-pre-wrap">{mt.deskripsi}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Sub Tab 2: Laporan Pekanan ke Mentor (Input saat diminta mentor) */}
                {kelompokSubTab === 'pekanan' && (
                  <motion.div
                    key="sub-pekanan"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/50 p-4 rounded-3xl border border-emerald-200/80 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                            <Calculator className="w-4 h-4 text-emerald-700" />
                            Kalkulator Evaluasi Otomatis
                          </h3>
                          <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                            Tarik rata-rata amalan dari catatan pribadi 7 hari terakhir ke form laporan secara instan saat diminta mentor.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handlePullFromDailyHabits}
                          disabled={calculatingPekan}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-semibold shrink-0 shadow-sm transition flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{calculatingPekan ? '...' : 'Hitung'}</span>
                        </button>
                      </div>
                    </div>

                    <form onSubmit={handleSubmitPekan} className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
                      <div className="pb-2 border-b border-stone-100 dark:border-stone-800">
                        <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100">
                          Form Laporan Evaluasi Pekanan
                        </h3>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          Kirim ringkasan amalan pekanan saat diminta oleh musyrif kamu.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                            Rata2 Jamaah (0-5)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            value={pekanRataJamaah}
                            onChange={(e) => setPekanRataJamaah(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 font-semibold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                            Total Tilawah (Hal)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={pekanTilawah}
                            onChange={(e) => setPekanTilawah(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 font-semibold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                            Tahajud (kali)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="7"
                            value={pekanTahajud}
                            onChange={(e) => setPekanTahajud(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 font-semibold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                            Dhuha (kali)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="7"
                            value={pekanDhuha}
                            onChange={(e) => setPekanDhuha(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 font-semibold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                            Dzikir Al-Ma&apos;tsurat (kali)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="7"
                            value={pekanMatsurat}
                            onChange={(e) => setPekanMatsurat(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 font-semibold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                            Catatan Evaluasi / Kendala (Opsional)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Ceritakan kendala ibadah pekan ini untuk didiskusikan bersama mentor..."
                            value={pekanCatatan}
                            onChange={(e) => setPekanCatatan(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Laporan Pekanan ke Mentor</span>
                      </button>
                    </form>

                    {/* Riwayat Pekanan */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 px-1">
                        Riwayat Laporan Terakhir
                      </h4>
                      {riwayatPekanan.length === 0 ? (
                        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-400">
                          Belum ada laporan pekanan yang dikirim.
                        </div>
                      ) : (
                        riwayatPekanan.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-stone-800 dark:text-stone-100 text-xs">
                                Laporan Tanggal: {item.tanggal_lapor}
                              </span>
                              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                                Terkirim
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-1 text-center text-[10px] pt-1">
                              <div className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-800/60">
                                <span className="text-stone-400 block">Jamaah</span>
                                <span className="font-bold text-stone-700 dark:text-stone-200">{item.rata_jamaah}/5</span>
                              </div>
                              <div className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-800/60">
                                <span className="text-stone-400 block">Tilawah</span>
                                <span className="font-bold text-stone-700 dark:text-stone-200">{item.total_tilawah_halaman} hal</span>
                              </div>
                              <div className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-800/60">
                                <span className="text-stone-400 block">Tahajud</span>
                                <span className="font-bold text-stone-700 dark:text-stone-200">{item.total_qiyamul_lail}x</span>
                              </div>
                              <div className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-800/60">
                                <span className="text-stone-400 block">Dhuha</span>
                                <span className="font-bold text-stone-700 dark:text-stone-200">{item.total_dhuha}x</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Sub Tab 3: Setoran Hafalan Qur'an */}
                {kelompokSubTab === 'setoran' && (
                  <motion.div
                    key="sub-setoran"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <form onSubmit={handleSubmitSetoran} className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
                      <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        Setor Hafalan Al-Qur&apos;an
                      </h3>

                      <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                          Penyimak (Teman Sekelompok)
                        </label>
                        <select
                          required
                          value={penyimakNim}
                          onChange={(e) => setPenyimakNim(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                        >
                          <option value="">-- Pilih Rekan Liqo --</option>
                          {temanList.map((t) => (
                            <option key={t.nim} value={t.nim}>
                              {t.nama} ({t.nim})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                            Surah
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Misal: An-Naba"
                            value={surah}
                            onChange={(e) => setSurah(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                            Ayat
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Misal: 1 - 20"
                            value={ayat}
                            onChange={(e) => setAyat(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                          Jenis Setoran
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['ziyadah', 'murajaah'] as const).map((j) => (
                            <button
                              key={j}
                              type="button"
                              onClick={() => setJenisSetoran(j)}
                              className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                                jenisSetoran === j
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                                  : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-800 text-stone-600'
                              }`}
                            >
                              {j === 'ziyadah' ? '🌱 Hafalan Baru' : '🔄 Murajaah'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Simpan Catatan Setoran</span>
                      </button>
                    </form>

                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 px-1">
                        Riwayat Setoranmu
                      </h4>
                      {riwayatSetoran.length === 0 ? (
                        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-400">
                          Belum ada riwayat setoran. Yuk mulai setor ke temanmu!
                        </div>
                      ) : (
                        riwayatSetoran.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-stone-800 dark:text-stone-100 text-sm">
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
              </motion.div>
            )}

            {/* ============================================================ */}
            {/* 2. MENU AMAL YAUMI: Khusus Harian Pribadi & Progress         */}
            {/* ============================================================ */}
            {bottomNav === 'amal' && (
              <motion.div
                key="view-amal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Kartu Progress Harian */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-lg shadow-emerald-600/15">
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

                  <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-emerald-300 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-emerald-100 mt-2.5">
                    {progress === 100
                      ? 'MasyaAllah, target harianmu penuh hari ini! 🔥'
                      : 'Pelan-pelan asal istiqamah, yuk lengkapi amalanmu.'}
                  </p>
                </div>

                {/* Banner Streak Hero (Bisa Diklik -> Buka Kalender Keaktifan) */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCalDay(today);
                    setShowCalendarModal(true);
                  }}
                  className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100 flex items-center justify-between text-xs font-semibold cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      <Flame className="w-4 h-4 fill-white" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-stone-800 dark:text-stone-100">
                          {streakDays} Hari Streak
                        </span>
                        {isUdzur && (
                          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-1.5 py-0.2 rounded-md">
                            ❄️ Freeze
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">
                        Ketuk untuk melihat riwayat keaktifanmu
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1 bg-white/80 dark:bg-stone-900/80 px-2.5 py-1.5 rounded-xl border border-amber-200/60 dark:border-amber-800/60 shadow-2xs group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition">
                    <Calendar className="w-3.5 h-3.5" /> Kalender ↗
                  </span>
                </button>

                {/* Form Checklist Ibadah Pribadi */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Target Ibadah Hari Ini
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Ruang Privat
                    </span>
                  </div>

                  {/* Counter Shalat Berjamaah */}
                  <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-sm">
                        Shalat Wajib Berjamaah
                      </h3>
                      <p className="text-xs text-stone-400">Target minimal 3-5 kali sehari</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShalatJamaah(Math.max(0, shalatJamaah - 1))}
                        className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 hover:bg-stone-200 cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-stone-800 dark:text-stone-100 w-5 text-center">
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
                  <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-sm">Tilawah Al-Qur&apos;an</h3>
                      <p className="text-xs text-stone-400">Target minimal 1-2 lembar (halaman)</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setTilawahHalaman(Math.max(0, tilawahHalaman - 1))}
                        className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 hover:bg-stone-200 cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-stone-800 dark:text-stone-100 w-5 text-center">
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

                  {/* Checklist Sunnah */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setQiyamulLail(!qiyamulLail)}
                      className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        qiyamulLail
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200'
                      }`}
                    >
                      <div className="text-left">
                        <h4 className="font-semibold text-sm">Qiyamul Lail / Tahajud</h4>
                        <p className="text-xs text-stone-400">Minimal 2 rakaat penutup witir</p>
                      </div>
                      {qiyamulLail ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-stone-300" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDhuha(!dhuha)}
                      className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        dhuha
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200'
                      }`}
                    >
                      <div className="text-left">
                        <h4 className="font-semibold text-sm">Shalat Dhuha</h4>
                        <p className="text-xs text-stone-400">Sedekah seluruh persendian tubuh</p>
                      </div>
                      {dhuha ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-stone-300" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setAlmatsurat(!almatsurat)}
                      className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        almatsurat
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200'
                      }`}
                    >
                      <div className="text-left">
                        <h4 className="font-semibold text-sm">Dzikir Al-Ma&apos;tsurat</h4>
                        <p className="text-xs text-stone-400">Pagi atau petang hari</p>
                      </div>
                      {almatsurat ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-stone-300" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={handleSaveMutabaah}
                    disabled={saving}
                    className="w-full mt-3 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:bg-emerald-400"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{saving ? 'Menyimpan...' : 'Simpan Mutabaah Hari Ini'}</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ============================================================ */}
            {/* 3. MENU PROFIL: Spiritual Streak, Freeze & Milestone Badges  */}
            {/* ============================================================ */}
            {bottomNav === 'profil' && (
              <motion.div
                key="view-profil"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Kartu Profil Utama */}
                <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg shadow-inner">
                      {user?.nama?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-stone-800 dark:text-stone-100">{user?.nama}</h2>
                      <p className="text-xs font-mono font-medium text-stone-400">
                        {user?.nim}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600">
                        {user?.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kartu Gamifikasi: Spiritual Streak & Freeze Mode (Bisa Diklik -> Buka Kalender) */}
                <div
                  onClick={() => {
                    setSelectedCalDay(today);
                    setShowCalendarModal(true);
                  }}
                  className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-5 text-white shadow-lg shadow-orange-500/15 space-y-3 cursor-pointer hover:shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100">
                          Spiritual Consistency Streak
                        </span>
                        <span className="text-[9px] font-semibold bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1 group-hover:bg-white/30 transition">
                          <Calendar className="w-2.5 h-2.5" /> Kalender ↗
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <h3 className="text-3xl font-extrabold">{streakDays}</h3>
                        <span className="text-sm font-semibold text-amber-100">Hari Berturut-turut</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-amber-100 group-hover:scale-105 transition-transform">
                      <Flame className="w-7 h-7" />
                    </div>
                  </div>

                  <p className="text-xs text-amber-100/90 leading-relaxed">
                    {streakDays >= 7
                      ? 'MasyaAllah! Konsistensimu luar biasa, pertahankan amalan harianmu!'
                      : streakDays >= 3
                      ? 'Alhamdulillah, habit spiritualmu mulai terbentuk kokoh!'
                      : 'Yuk mulai bangun kebiasaan spiritual harianmu dari sekarang.'}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] font-medium text-amber-100/90 border-t border-white/15">
                    <span>👆 Ketuk kartu ini untuk melihat Kalender Keaktifan</span>
                    <ChevronRight className="w-4 h-4 text-amber-200" />
                  </div>

                  {/* Toggle Udzur Syar'i (Streak Freeze) */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="pt-2 border-t border-white/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Snowflake className={`w-4 h-4 ${isUdzur ? 'text-blue-200 animate-pulse' : 'text-amber-200'}`} />
                      <span className="text-xs font-semibold">Mode Udzur Syar&apos;i (Freeze Streak)</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleUdzur();
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        isUdzur ? 'bg-blue-600' : 'bg-black/25'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-stone-900 transition ${
                          isUdzur ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Section Milestone Badges (Lencana Pencapaian Privat) */}
                <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                    <div>
                      <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-600" />
                        Lencana Spiritual (Milestones)
                      </h3>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Pencapaian personal yang bersifat privat (hanya kamu).
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      {unlockedBadges.length} / 6 Terbuka
                    </span>
                  </div>

                  {/* Grid Lencana */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Badge 1: First Step */}
                    <div
                      className={`p-3.5 rounded-2xl border transition-all space-y-1.5 ${
                        unlockedBadges.includes('first_step')
                          ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                          : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-800 text-stone-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">🌱</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {unlockedBadges.includes('first_step') ? 'Terbuka' : 'Terkunci'}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs">First Step</h4>
                      <p className="text-[10px] leading-relaxed">
                        Memulai komitmen dengan mengisi mutabaah harian pertamamu.
                      </p>
                    </div>

                    {/* Badge 2: 3-Day Consistency */}
                    <div
                      className={`p-3.5 rounded-2xl border transition-all space-y-1.5 ${
                        unlockedBadges.includes('streak_3')
                          ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                          : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-800 text-stone-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">🔥</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {unlockedBadges.includes('streak_3') ? 'Terbuka' : 'Terkunci'}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs">Habit Builder</h4>
                      <p className="text-[10px] leading-relaxed">
                        Konsisten mengisi mutabaah 3 hari berturut-turut.
                      </p>
                    </div>

                    {/* Badge 3: Jamaah Champion */}
                    <div
                      className={`p-3.5 rounded-2xl border transition-all space-y-1.5 ${
                        unlockedBadges.includes('jamaah_champion')
                          ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                          : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-800 text-stone-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">⚔️</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {unlockedBadges.includes('jamaah_champion') ? 'Terbuka' : 'Terkunci'}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs">Jamaah Full</h4>
                      <p className="text-[10px] leading-relaxed">
                        Menuntaskan 5 waktu shalat wajib berjamaah dalam sehari.
                      </p>
                    </div>

                    {/* Badge 4: Tahajud Warrior */}
                    <div
                      className={`p-3.5 rounded-2xl border transition-all space-y-1.5 ${
                        unlockedBadges.includes('tahajud_warrior')
                          ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950'
                          : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-800 text-stone-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">🌙</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {unlockedBadges.includes('tahajud_warrior') ? 'Terbuka' : 'Terkunci'}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs">Night Seeker</h4>
                      <p className="text-[10px] leading-relaxed">
                        Bangun bermunajat di sepertiga malam (Qiyamul Lail).
                      </p>
                    </div>

                    {/* Badge 5: Dhuha Seeker */}
                    <div
                      className={`p-3.5 rounded-2xl border transition-all space-y-1.5 ${
                        unlockedBadges.includes('dhuha_seeker')
                          ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                          : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-800 text-stone-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">☀️</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {unlockedBadges.includes('dhuha_seeker') ? 'Terbuka' : 'Terkunci'}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs">Dhuha Warrior</h4>
                      <p className="text-[10px] leading-relaxed">
                        Melaksanakan shalat Dhuha sebagai sedekah persendian tubuh.
                      </p>
                    </div>

                    {/* Badge 6: Peer Tasmi' */}
                    <div
                      className={`p-3.5 rounded-2xl border transition-all space-y-1.5 ${
                        unlockedBadges.includes('first_tasmi')
                          ? 'bg-teal-50/70 border-teal-300 text-teal-950'
                          : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-800 text-stone-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">📖</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {unlockedBadges.includes('first_tasmi') ? 'Terbuka' : 'Terkunci'}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs">Peer Tasmi&apos;</h4>
                      <p className="text-[10px] leading-relaxed">
                        Berhasil menyetorkan hafalan Qur&apos;an ke rekan liqo.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* BOTTOM NAVIGATION BAR (Kelompok | Amal Yaumi | Profil)       */}
      {/* ============================================================ */}
      {myGroup && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 py-2">
          <div className="max-w-md mx-auto px-6 flex items-center justify-around">
            {/* 1. Kelompok */}
            <button
              onClick={() => setBottomNav('kelompok')}
              className={`flex flex-col items-center gap-1 transition cursor-pointer ${
                bottomNav === 'kelompok' ? 'text-emerald-700 font-bold' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <div className="relative">
                <Users className="w-5 h-5" />
                {bottomNav === 'kelompok' && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-600 rounded-full"
                  />
                )}
              </div>
              <span className="text-[11px]">Kelompok</span>
            </button>

            {/* 2. Amal Yaumi (Tengah) */}
            <button
              onClick={() => setBottomNav('amal')}
              className={`flex flex-col items-center gap-1 transition cursor-pointer ${
                bottomNav === 'amal' ? 'text-emerald-700 font-bold' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <div className="relative">
                <Sparkles className="w-5 h-5" />
                {bottomNav === 'amal' && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-600 rounded-full"
                  />
                )}
              </div>
              <span className="text-[11px]">Amal Yaumi</span>
            </button>

            {/* 3. Profil */}
            <button
              onClick={() => setBottomNav('profil')}
              className={`flex flex-col items-center gap-1 transition cursor-pointer ${
                bottomNav === 'profil' ? 'text-emerald-700 font-bold' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <div className="relative">
                <User className="w-5 h-5" />
                {bottomNav === 'profil' && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-600 rounded-full"
                  />
                )}
              </div>
              <span className="text-[11px]">Profil</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Join / Ganti Kelompok */}
      <AnimatePresence>
        {showJoinModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-100 dark:border-stone-800 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                <h3 className="font-bold text-base text-stone-800 dark:text-stone-100">
                  {myGroup ? 'Ganti Kelompok Mentoring' : 'Gabung Kelompok'}
                </h3>
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setGroupError('');
                  }}
                  className="text-stone-400 hover:text-stone-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                {myGroup
                  ? `Saat ini kamu berada di kelompok ${myGroup.nama_kelompok}. Masukkan kode baru jika ingin berpindah kelompok.`
                  : 'Masukkan kode kelompok yang diberikan oleh musyrif kamu.'}
              </p>

              {groupError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium">
                  {groupError}
                </div>
              )}

              <form onSubmit={handleJoinGroup} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Contoh: FUTUWWAH-01"
                  value={inputKodeKelompok}
                  onChange={(e) => setInputKodeKelompok(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-xs font-mono font-bold uppercase text-stone-800 dark:text-stone-100 focus:bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinModal(false);
                      setGroupError('');
                    }}
                    className="px-3.5 py-2 rounded-xl text-stone-500 hover:bg-stone-100 dark:bg-stone-800 text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={joiningGroup}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                  >
                    {joiningGroup ? 'Menghubungkan...' : 'Simpan & Gabung'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal Kalender Riwayat Keaktifan (v0.8) */}
      <AnimatePresence>
        {showCalendarModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 max-h-[92vh] overflow-y-auto"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-stone-800 dark:text-stone-100 leading-tight">
                      Kalender Keaktifan
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      Riwayat amalan harian &amp; streak kamu
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCalendarModal(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Ringkasan Performa Bulan Ini */}
              {(() => {
                const monthPrefix = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`;
                const logsInMonth = allLogs.filter((l) => l.tanggal && l.tanggal.startsWith(monthPrefix));
                const totalActiveDays = logsInMonth.length;
                const totalTilawah = logsInMonth.reduce((acc, l) => acc + (Number(l.tilawah_halaman) || 0), 0);

                return (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60">
                      <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">
                        Streak
                      </span>
                      <span className="text-base font-extrabold text-amber-900 dark:text-amber-100 mt-0.5 block">
                        {streakDays} Hari 🔥
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
                        Aktif Bulan Ini
                      </span>
                      <span className="text-base font-extrabold text-emerald-900 dark:text-emerald-100 mt-0.5 block">
                        {totalActiveDays} Hari 📅
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60">
                      <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400 block">
                        Total Tilawah
                      </span>
                      <span className="text-base font-extrabold text-teal-900 dark:text-teal-100 mt-0.5 block">
                        {totalTilawah} Hal 📖
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Navigasi Bulan */}
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => {
                    if (calendarMonth === 0) {
                      setCalendarMonth(11);
                      setCalendarYear((y) => y - 1);
                    } else {
                      setCalendarMonth((m) => m - 1);
                    }
                  }}
                  className="p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 cursor-pointer transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="font-bold text-sm text-stone-800 dark:text-stone-100">
                  {MONTH_NAMES[calendarMonth]} {calendarYear}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    if (calendarMonth === 11) {
                      setCalendarMonth(0);
                      setCalendarYear((y) => y + 1);
                    } else {
                      setCalendarMonth((m) => m + 1);
                    }
                  }}
                  className="p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 cursor-pointer transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Header Nama Hari */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {DAY_NAMES.map((dn, idx) => (
                  <span key={idx} className="text-[11px] font-bold text-stone-400 py-1">
                    {dn}
                  </span>
                ))}
              </div>

              {/* Grid Kalender */}
              {(() => {
                const firstDayIndex = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;
                const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                const blanks = Array.from({ length: firstDayIndex });
                const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

                return (
                  <div className="grid grid-cols-7 gap-1">
                    {blanks.map((_, i) => (
                      <div key={`blank-${i}`} className="h-9 sm:h-10" />
                    ))}

                    {daysArray.map((dayNum) => {
                      const dateString = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const log = allLogs.find((l) => l.tanggal === dateString);
                      const isSelected = selectedCalDay === dateString;
                      const isTodayDate = dateString === today;

                      // Hitung skor kelengkapan (0 sampai 5)
                      let score = 0;
                      if (log) {
                        if (log.shalat_jamaah > 0) score++;
                        if (log.tilawah_halaman > 0) score++;
                        if (log.qiyamul_lail) score++;
                        if (log.dhuha) score++;
                        if (log.almatsurat) score++;
                      }

                      const isFull = score === 5;
                      const isPartial = score > 0 && !isFull;

                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => setSelectedCalDay(dateString)}
                          className={`h-9 sm:h-10 rounded-xl flex flex-col items-center justify-center relative text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-emerald-500 scale-105 z-10'
                              : 'hover:scale-105'
                          } ${
                            isFull
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : isPartial
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200'
                              : 'bg-stone-100/70 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400'
                          } ${isTodayDate && !isSelected ? 'border border-emerald-500' : ''}`}
                        >
                          <span>{dayNum}</span>
                          {isFull && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 absolute bottom-1" />
                          )}
                          {isPartial && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute bottom-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Legend */}
              <div className="flex items-center justify-center gap-3 pt-1 text-[10px] text-stone-500 font-medium">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-md bg-emerald-600 inline-block" />
                  <span>Target Penuh</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-md bg-emerald-100 dark:bg-emerald-950 inline-block border border-emerald-300" />
                  <span>Diisi Sebagian</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-md bg-stone-100 dark:bg-stone-800 inline-block" />
                  <span>Kosong</span>
                </div>
              </div>

              {/* Detail Hari Terpilih */}
              {selectedCalDay && (() => {
                const selLog = allLogs.find((l) => l.tanggal === selectedCalDay);
                const isSelectedToday = selectedCalDay === today;

                return (
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-stone-200/60 dark:border-stone-700/60">
                      <span className="font-bold text-xs text-stone-800 dark:text-stone-100">
                        📅 Detail: {selectedCalDay} {isSelectedToday && '(Hari Ini)'}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        selLog ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                      }`}>
                        {selLog ? 'Tercatat' : 'Belum Ada Data'}
                      </span>
                    </div>

                    {selLog ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
                          <span className="text-[10px] text-stone-400 block">Shalat Jamaah</span>
                          <span className="font-bold text-stone-800 dark:text-stone-100">{selLog.shalat_jamaah} / 5 Waktu</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
                          <span className="text-[10px] text-stone-400 block">Tilawah Qur&apos;an</span>
                          <span className="font-bold text-stone-800 dark:text-stone-100">{selLog.tilawah_halaman} Halaman</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
                          <span className="text-[10px] text-stone-400 block">Qiyamul Lail</span>
                          <span className="font-bold text-stone-800 dark:text-stone-100">
                            {selLog.qiyamul_lail ? '✅ Tahajud' : '❌ Belum'}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
                          <span className="text-[10px] text-stone-400 block">Dhuha &amp; Ma&apos;tsurat</span>
                          <span className="font-bold text-stone-800 dark:text-stone-100">
                            {selLog.dhuha ? '✅ Dhuha' : '❌'}{' '}
                            {selLog.almatsurat ? '• ✅ Ma\'tsurat' : '• ❌'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 text-center text-xs text-stone-400 space-y-2">
                        <p>Tidak ada catatan mutabaah yang disimpan pada tanggal ini.</p>
                        {isSelectedToday && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowCalendarModal(false);
                              setBottomNav('amal');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Isi Target Hari Ini</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
