-- ==============================================================================
-- Migrasi v0.2: Multi-Tenancy, Group Expansion & Role-Based Approval
-- Mutabaah Space & Portal Al-Futuwwah
-- ==============================================================================

-- 1. Buat Tabel Groups (Kelompok Halaqah/Mentoring)
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_kelompok TEXT NOT NULL,
  kode_kelompok TEXT UNIQUE NOT NULL,
  musyrif_nim TEXT,
  kategori TEXT DEFAULT 'kampus', -- 'kampus' | 'umum'
  deskripsi TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indeks untuk pencarian cepat via kode_kelompok
CREATE INDEX IF NOT EXISTS idx_groups_kode ON groups(kode_kelompok);

-- 2. Update Tabel Users
-- Menambahkan kolom group_id, status approval, dan pastikan role mengakomodasi 'admin'
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved', -- 'pending' | 'approved' | 'rejected'
ADD COLUMN IF NOT EXISTS no_hp TEXT;

-- Pastikan relasi foreign key musyrif_nim ke users (opsional/informasional)
-- ALTER TABLE groups ADD CONSTRAINT fk_musyrif FOREIGN KEY (musyrif_nim) REFERENCES users(nim) ON DELETE SET NULL;

-- 3. Inisialisasi Kelompok Percontohan / Default (Opsional jika migrasi dari v0.1)
-- Agar user lama tidak orphan, buat 1 grup default jika belum ada
DO $$
DECLARE
  default_group_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM groups WHERE kode_kelompok = 'FUTUWWAH-01') THEN
    INSERT INTO groups (nama_kelompok, kode_kelompok, kategori, deskripsi)
    VALUES ('Halaqah Al-Futuwwah Awwal', 'FUTUWWAH-01', 'kampus', 'Kelompok mentoring percontohan')
    RETURNING id INTO default_group_id;

    -- Hubungkan user v0.1 yang belum memiliki group_id ke grup default
    UPDATE users SET group_id = default_group_id WHERE group_id IS NULL;
  END IF;
END $$;
