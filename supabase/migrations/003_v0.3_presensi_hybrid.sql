-- ==============================================================================
-- Migrasi v0.3: Presensi Liqo & Laporan Evaluasi Pekanan (Hybrid Habit & Safe Space)
-- Mutabaah Space & Portal Al-Futuwwah
-- ==============================================================================

-- 1. Tabel Pertemuan Liqo / Mentoring
CREATE TABLE IF NOT EXISTS liqo_meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  musyrif_nim TEXT,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  judul_materi TEXT NOT NULL,
  deskripsi TEXT,
  tempat TEXT DEFAULT 'Masjid Kampus / Offline',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indeks query pertemuan per grup
CREATE INDEX IF NOT EXISTS idx_meetings_group ON liqo_meetings(group_id);

-- 2. Tabel Presensi Kehadiran Liqo
CREATE TABLE IF NOT EXISTS liqo_presensi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES liqo_meetings(id) ON DELETE CASCADE,
  user_nim TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'hadir', -- 'hadir' | 'izin' | 'sakit' | 'alpa'
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_meeting_user UNIQUE (meeting_id, user_nim)
);

CREATE INDEX IF NOT EXISTS idx_presensi_meeting ON liqo_presensi(meeting_id);
CREATE INDEX IF NOT EXISTS idx_presensi_user ON liqo_presensi(user_nim);

-- 3. Tabel Laporan Evaluasi Pekanan (Kelompok)
CREATE TABLE IF NOT EXISTS mutabaah_pekanan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_nim TEXT NOT NULL,
  pekan_ke INT DEFAULT 1,
  tanggal_lapor DATE DEFAULT CURRENT_DATE,
  rata_jamaah NUMERIC(3,1) DEFAULT 0, -- rata-rata shalat jamaah (misal: 3.5 dari 5)
  total_tilawah_halaman INT DEFAULT 0, -- total halaman tilawah sepekan
  total_qiyamul_lail INT DEFAULT 0, -- frekuensi tahajud dalam sepekan (0-7)
  total_dhuha INT DEFAULT 0, -- frekuensi dhuha dalam sepekan (0-7)
  total_almatsurat INT DEFAULT 0, -- frekuensi matsurat sepekan (0-7)
  catatan_evaluasi TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_pekan_user UNIQUE (group_id, user_nim, pekan_ke, tanggal_lapor)
);

-- 4. Aktifkan Row-Level Security (RLS) dan Policies
ALTER TABLE liqo_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE liqo_presensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutabaah_pekanan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access liqo_meetings" ON liqo_meetings;
CREATE POLICY "Public access liqo_meetings" ON liqo_meetings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access liqo_presensi" ON liqo_presensi;
CREATE POLICY "Public access liqo_presensi" ON liqo_presensi FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access mutabaah_pekanan" ON mutabaah_pekanan;
CREATE POLICY "Public access mutabaah_pekanan" ON mutabaah_pekanan FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
