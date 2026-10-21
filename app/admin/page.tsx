'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  LogOut,
  Sparkles,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  Phone,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

interface GroupData {
  id: string;
  nama_kelompok: string;
  kode_kelompok: string;
  kategori: string;
  musyrif_nim: string | null;
  deskripsi: string | null;
  created_at: string;
  musyrif?: {
    nama: string;
  };
  total_members?: number;
}

interface PendingMusyrif {
  nim: string;
  nama: string;
  role: string;
  status: string;
  no_hp?: string;
  created_at?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'groups'>('pending');
  const [loading, setLoading] = useState(true);

  // Data states
  const [pendingList, setPendingList] = useState<PendingMusyrif[]>([]);
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [musyrifOptions, setMusyrifOptions] = useState<{ nim: string; nama: string }[]>([]);

  // Modal / Form Tambah Kelompok
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNamaKelompok, setNewNamaKelompok] = useState('');
  const [newKodeKelompok, setNewKodeKelompok] = useState('');
  const [newKategori, setNewKategori] = useState<'kampus' | 'umum'>('kampus');
  const [newMusyrifNim, setNewMusyrifNim] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mutabaah_user');
    if (!saved) {
      router.push('/');
      return;
    }
    const user = JSON.parse(saved);
    if (user.role !== 'admin') {
      router.push('/');
      return;
    }
    setCurrentUser(user);
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Ambil musyrif yang pending
      const { data: pendingUsers } = await supabase
        .from('users')
        .select('nim, nama, role, status, no_hp, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingUsers) setPendingList(pendingUsers);

      // 2. Ambil daftar musyrif yang sudah approved untuk assign kelompok
      const { data: approvedMusyrifs } = await supabase
        .from('users')
        .select('nim, nama')
        .eq('role', 'musyrif')
        .eq('status', 'approved');

      if (approvedMusyrifs) setMusyrifOptions(approvedMusyrifs);

      // 3. Ambil daftar kelompok beserta jumlah anggota
      const { data: groupData } = await supabase
        .from('groups')
        .select(`
          *,
          musyrif:users!groups_musyrif_nim_fkey(nama)
        `)
        .order('created_at', { ascending: false });

      if (groupData) {
        // Ambil jumlah anggota per group
        const { data: allUsers } = await supabase.from('users').select('group_id');
        const countMap: Record<string, number> = {};
        if (allUsers) {
          allUsers.forEach((u) => {
            if (u.group_id) {
              countMap[u.group_id] = (countMap[u.group_id] || 0) + 1;
            }
          });
        }

        const enrichedGroups = groupData.map((g) => ({
          ...g,
          total_members: countMap[g.id] || 0,
        }));
        setGroups(enrichedGroups);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (nim: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'approved' })
        .eq('nim', nim);

      if (!error) {
        setPendingList((prev) => prev.filter((p) => p.nim !== nim));
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (nim: string) => {
    if (!confirm(`Tolak pendaftaran musyrif NIM/Username: ${nim}?`)) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'rejected' })
        .eq('nim', nim);

      if (!error) {
        setPendingList((prev) => prev.filter((p) => p.nim !== nim));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const cleanKode = newKodeKelompok.trim().toUpperCase();
      if (!cleanKode || !newNamaKelompok.trim()) {
        setFormError('Nama dan Kode kelompok wajib diisi.');
        setSubmitting(false);
        return;
      }

      // Cek apakah kode sudah ada
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

      const { data: newGroup, error } = await supabase
        .from('groups')
        .insert([
          {
            nama_kelompok: newNamaKelompok.trim(),
            kode_kelompok: cleanKode,
            kategori: newKategori,
            musyrif_nim: newMusyrifNim || null,
          },
        ])
        .select()
        .single();

      if (error) {
        setFormError('Gagal membuat kelompok: ' + error.message);
        setSubmitting(false);
        return;
      }

      // Jika musyrif dipilih, update group_id musyrif bersangkutan jika belum
      if (newMusyrifNim) {
        await supabase
          .from('users')
          .update({ group_id: newGroup.id })
          .eq('nim', newMusyrifNim);
      }

      setIsModalOpen(false);
      setNewNamaKelompok('');
      setNewKodeKelompok('');
      setNewMusyrifNim('');
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mutabaah_user');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 pb-16">
      {/* Header Admin */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                Divisi Kaderisasi & Edukasi
              </span>
              <h1 className="text-base sm:text-lg font-bold text-stone-800 dark:text-stone-100 mt-0.5">
                Admin Center • Al-Futuwwah
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
              onClick={() => router.push('/musyrif')}
              className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-950 hover:bg-stone-200 text-stone-700 dark:text-stone-200 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <span>Ruang Musyrif</span>
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
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-3 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="relative flex bg-stone-100 dark:bg-stone-950 p-1 rounded-xl sm:w-96">
            <button
              onClick={() => setActiveTab('pending')}
              className={`relative z-10 flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'pending' ? 'text-indigo-900' : 'text-stone-500'
              }`}
            >
              {activeTab === 'pending' && (
                <motion.div
                  layoutId="adminTab"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  className="absolute inset-0 bg-white dark:bg-stone-900 rounded-lg shadow-sm -z-10"
                />
              )}
              <span>Verifikasi Musyrif</span>
              {pendingList.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                  {pendingList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('groups')}
              className={`relative z-10 flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'groups' ? 'text-indigo-900' : 'text-stone-500'
              }`}
            >
              {activeTab === 'groups' && (
                <motion.div
                  layoutId="adminTab"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  className="absolute inset-0 bg-white dark:bg-stone-900 rounded-lg shadow-sm -z-10"
                />
              )}
              <Layers className="w-4 h-4" />
              <span>Kelola Kelompok ({groups.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'groups' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Kelompok Baru</span>
              </button>
            )}
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-950 hover:bg-stone-200 text-stone-600 dark:text-stone-300 transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab 1: Verifikasi Musyrif Pending */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-800">
              <span className="font-bold">Info Approval:</span> Musyrif yang mendaftar secara mandiri tidak dapat login ke sistem sebelum diaktifkan oleh Admin Kaderisasi di halaman ini.
            </div>

            {pendingList.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 p-12 rounded-3xl border border-stone-200 dark:border-stone-800 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-stone-700 dark:text-stone-200">Semua Terverifikasi</h3>
                <p className="text-xs text-stone-400">Tidak ada pengajuan akun Musyrif yang menunggu persetujuan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingList.map((musyrif) => (
                  <div
                    key={musyrif.nim}
                    className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                            Menunggu Persetujuan
                          </span>
                          <h3 className="font-bold text-base text-stone-800 dark:text-stone-100 mt-2">
                            {musyrif.nama}
                          </h3>
                          <p className="text-xs text-stone-500 font-medium">NIM/ID: {musyrif.nim}</p>
                        </div>
                      </div>

                      {musyrif.no_hp && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/60 p-2 rounded-xl">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp: {musyrif.no_hp}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-stone-100 dark:border-stone-850">
                      <button
                        onClick={() => handleApprove(musyrif.nim)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Aktivasi Musyrif</span>
                      </button>
                      <button
                        onClick={() => handleReject(musyrif.nim)}
                        className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Tolak</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Kelola Kelompok */}
        {activeTab === 'groups' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        group.kategori === 'kampus'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {group.kategori === 'kampus' ? '🏛️ Kampus' : '🕌 Halaqah Umum'}
                    </span>
                    <span className="text-xs font-mono font-bold bg-stone-100 dark:bg-stone-950 text-stone-700 dark:text-stone-200 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-stone-800">
                      {group.kode_kelompok}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-stone-800 dark:text-stone-100 mt-3">
                    {group.nama_kelompok}
                  </h3>

                  <div className="mt-3 space-y-1 text-xs text-stone-500">
                    <p className="flex items-center gap-1.5">
                      <span className="font-semibold text-stone-700 dark:text-stone-200">Musyrif:</span>{' '}
                      {group.musyrif?.nama || group.musyrif_nim || 'Belum ditugaskan'}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="font-semibold text-stone-700 dark:text-stone-200">Total Anggota:</span>{' '}
                      {group.total_members} Orang
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-850 flex items-center justify-between">
                  <button
                    onClick={() => router.push(`/musyrif/${group.id}`)}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>Masuk Ruang Kelompok</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tambah Kelompok Baru */}
      <AnimatePresence>
        {isModalOpen && (
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
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:text-stone-300"
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
                    Nama Kelompok
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Halaqah Utsman bin Affan"
                    value={newNamaKelompok}
                    onChange={(e) => setNewNamaKelompok(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-xs font-semibold text-stone-800 dark:text-stone-100 focus:bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Kode Kelompok (Unik untuk Pendaftaran Anggota)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: KADER-02 atau ABI-01"
                    value={newKodeKelompok}
                    onChange={(e) => setNewKodeKelompok(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-xs font-mono font-bold uppercase text-stone-800 dark:text-stone-100 focus:bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Kategori Kelompok
                  </label>
                  <select
                    value={newKategori}
                    onChange={(e: any) => setNewKategori(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-xs font-semibold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="kampus">🏛️ Mahasiswa / Kader Internal Kampus</option>
                    <option value="umum">🕌 Pengajian Eksternal / Halaqah Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Musyrif Pembina (Opsional)
                  </label>
                  <select
                    value={newMusyrifNim}
                    onChange={(e) => setNewMusyrifNim(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-xs font-semibold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Pilih Musyrif --</option>
                    {musyrifOptions.map((m) => (
                      <option key={m.nim} value={m.nim}>
                        {m.nama} ({m.nim})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-stone-500 hover:bg-stone-100 dark:bg-stone-950 text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan Kelompok'}
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
