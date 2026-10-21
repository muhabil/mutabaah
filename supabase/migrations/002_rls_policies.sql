-- ==============================================================================
-- Policy RLS untuk Tabel Groups & Users (Mutabaah Space)
-- ==============================================================================

-- 1. Enable RLS pada tabel groups jika belum
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- 2. Drop policy lama jika ada untuk menghindari konflik
DROP POLICY IF EXISTS "Public can view groups" ON groups;
DROP POLICY IF EXISTS "Authenticated can insert groups" ON groups;
DROP POLICY IF EXISTS "Public can insert groups" ON groups;
DROP POLICY IF EXISTS "Musyrif and Admin can update groups" ON groups;

-- 3. Policy SELECT: Siapa pun (anon/authenticated) bisa membaca data grup
-- (Dibutuhkan saat pendaftaran anggota untuk validasi kode_kelompok dan pencarian grup)
CREATE POLICY "Public can view groups"
ON groups
FOR SELECT
TO anon, authenticated
USING (true);

-- 4. Policy INSERT: Izinkan insert ke groups (Musyrif & Admin membuat kelompok)
CREATE POLICY "Public can insert groups"
ON groups
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 5. Policy UPDATE: Izinkan update kelompok (mengubah nama/musyrif_nim)
CREATE POLICY "Public can update groups"
ON groups
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 6. Pastikan tabel users juga mengizinkan update group_id
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view users" ON users;
DROP POLICY IF EXISTS "Public can insert users" ON users;
DROP POLICY IF EXISTS "Public can update users" ON users;

CREATE POLICY "Public can view users"
ON users
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public can insert users"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public can update users"
ON users
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
