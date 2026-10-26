'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogOut,
  Users,
  LayoutDashboard,
  Shield,
  Layers,
  ChevronRight,
  PlusCircle,
  Plus,
  ExternalLink,
  XCircle,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

interface UserData {
  nim: string;
  nama: string;
  role: string;
  group_id?: string;
}

interface GroupItem {
  id: string;
  nama_kelompok: string;
  kode_kelompok: string;
  kategori: string;
  musyrif_nim: string | null;
  total_members?: number;
}

export default function MusyrifHubPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [musyrif, setMusyrif] = useState<UserData | null>(null);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);

  // State Modal Buat Kelompok Baru oleh Musyrif
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [namaKelompok, setNamaKelompok] = useState('');
  const [kodeKelompok, setKodeKelompok] = useState('');
  const [kategori, setKategori] = useState<'kampus' | 'umum'>('kampus');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mutabaah_user');
    if (!saved) {
      router.push('/login');
      return;
    }
    const user: UserData = JSON.parse(saved);
    if (user.role !== 'musyrif' && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setMusyrif(user);
    loadMusyrifGroups(user);
  }, [router]);

  const loadMusyrifGroups = async (user: UserData) => {
    setLoading(true);
    try {
      let query = supabase.from('groups').select('*');

      // Jika role adalah musyrif biasa (bukan admin), tampilkan kelompok yang diampu atau yang group_id nya cocok
      if (user.role === 'musyrif') {
        query = query.or(`musyrif_nim.eq.${user.nim},id.eq.${user.group_id || '00000000-0000-0000-0000-000000000000'}`);
      }

      const { data: groupList } = await query.order('created_at', { ascending: false });

      if (groupList) {
        // Ambil hitungan anggota tiap grup
        const { data: usersData } = await supabase.from('users').select('group_id');
        const countMap: Record<string, number> = {};
        if (usersData) {
          usersData.forEach((u) => {
            if (u.group_id) {
              countMap[u.group_id] = (countMap[u.group_id] || 0) + 1;
            }
          });
        }

        const enriched = groupList.map((g) => ({
          ...g,
          total_members: countMap[g.id] || 0,
        }));

        setGroups(enriched);
      }
    } catch (err) {
      console.error('Error fetching musyrif groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!musyrif) return;

    setFormError('');
    setSubmitting(true);

    try {
      const cleanKode = kodeKelompok.trim().toUpperCase();
      if (!cleanKode || !namaKelompok.trim()) {
        setFormError('Nama dan Kode kelompok wajib diisi.');
        setSubmitting(false);
        return;
      }

      // Cek apakah kode sudah dipakai
      const { data: existing } = await supabase
        .from('groups')
        .select('id')
        .eq('kode_kelompok', cleanKode)
        .single();

      if (existing) {
        setFormError(`Kode kelompok "${cleanKode}" sudah digunakan! Buat kode lain.`);
        setSubmitting(false);
        return;
      }

      // Insert grup baru dengan musyrif_nim adalah musyrif saat ini
      const { data: newGroup, error } = await supabase
        .from('groups')
        .insert([
          {
            nama_kelompok: namaKelompok.trim(),
            kode_kelompok: cleanKode,
            kategori: kategori,
            musyrif_nim: musyrif.nim,
          },
        ])
        .select()
        .single();

      if (error) {
        setFormError('Gagal membuat kelompok: ' + error.message);
        setSubmitting(false);
        return;
      }

      // Update group_id musyrif jika belum punya
      if (!musyrif.group_id) {
        await supabase
          .from('users')
          .update({ group_id: newGroup.id })
          .eq('nim', musyrif.nim);

        const updated = { ...musyrif, group_id: newGroup.id };
        setMusyrif(updated);
        localStorage.setItem('mutabaah_user', JSON.stringify(updated));
      }

      setIsCreateModalOpen(false);
      setNamaKelompok('');
      setKodeKelompok('');
      loadMusyrifGroups(musyrif);
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('mutabaah_user');
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              Musyrif Command Hub
            </span>
            <h1 className="text-base sm:text-lg font-bold text-stone-800 dark:text-stone-100 mt-1">
              Ahlan wa Sahlan, {musyrif?.nama}!
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition cursor-pointer"
              title="Ganti Tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>

            {musyrif?.role === 'admin' && (
              <button
                onClick={() => router.push('/admin')}
                className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>Panel Admin</span>
              </button>
            )}

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

      <div className="max-w-4xl mx-auto px-4 pt-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">Pilih Kelompok Binaan</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Pilih kelompok mentoring untuk memantau rekap mutabaah harian & live feed setoran Qur&apos;an.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Kelompok Baru</span>
          </button>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-stone-900 p-12 rounded-3xl border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-400">
            Memuat data kelompok...
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 p-10 rounded-3xl border border-stone-200 dark:border-stone-800 text-center space-y-4">
            <Layers className="w-10 h-10 text-stone-300 mx-auto" />
            <div>
              <h3 className="font-bold text-stone-700 dark:text-stone-200 text-base">Belum Ada Kelompok Binaan</h3>
              <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1">
                Kamu belum memiliki kelompok binaan. Yuk buat kelompok mentoring baru sekarang untuk mendapatkan kode kelompok!
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Kelompok Pertamamu</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((g) => (
              <motion.div
                key={g.id}
                whileHover={{ y: -3 }}
                onClick={() => router.push(`/musyrif/${g.id}`)}
                className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 hover:border-emerald-300 shadow-sm cursor-pointer transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        g.kategori === 'kampus'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {g.kategori === 'kampus' ? '🏛️ Kampus' : '🕌 Halaqah Umum'}
                    </span>
                    <span className="text-xs font-mono font-bold bg-stone-100 dark:bg-stone-950 text-stone-700 dark:text-stone-200 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-stone-800">
                      {g.kode_kelompok}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-stone-800 dark:text-stone-100 mt-3">
                    {g.nama_kelompok}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-2">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    <span>{g.total_members} Anggota Terdaftar</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-850 flex items-center justify-between text-xs font-semibold text-emerald-600">
                  <span>Masuk Kontrol Panel</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Buat Kelompok Baru oleh Musyrif */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 dark:border-stone-850 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-850">
                <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100">Buat Kelompok Baru</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:text-stone-300 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateGroup} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Nama Kelompok Mentoring
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Halaqah Salman Al-Farisi"
                    value={namaKelompok}
                    onChange={(e) => setNamaKelompok(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-xs font-semibold text-stone-800 dark:text-stone-100 focus:bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Kode Kelompok (Unik untuk Anggota)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: FARISI-01 atau BINAAN-01"
                    value={kodeKelompok}
                    onChange={(e) => setKodeKelompok(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-xs font-mono font-bold uppercase text-stone-800 dark:text-stone-100 focus:bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Kode ini yang akan kamu bagikan ke anggota kelompok kamu.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Kategori Kelompok
                  </label>
                  <select
                    value={kategori}
                    onChange={(e: any) => setKategori(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-xs font-semibold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="kampus">🏛️ Kader / Mahasiswa Internal Kampus</option>
                    <option value="umum">🕌 Kelompok Pengajian Eksternal / Halaqah Umum</option>
                  </select>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-stone-500 hover:bg-stone-100 dark:bg-stone-950 text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:bg-emerald-400"
                  >
                    {submitting ? 'Membuat Kelompok...' : 'Buat Kelompok'}
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
