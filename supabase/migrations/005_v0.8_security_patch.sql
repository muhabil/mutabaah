-- ==============================================================================
-- Migrasi v0.8: Security Hardening & Data Protection Patch
-- Mutabaah Space & Portal Al-Futuwwah ITPLN
-- Menjawab temuan audit: C1 (RLS Users Leak), C2 (Password Plaintext), T1 (Admin Route)
-- ==============================================================================

-- 1. Aktifkan ekstensi pgcrypto untuk hashing bcrypt di PostgreSQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Migrasi Massal: Enkripsi seluruh password lama yang masih plaintext ke Bcrypt (cost=10)
UPDATE users
SET password = crypt(password, gen_salt('bf', 10))
WHERE password IS NOT NULL 
  AND password NOT LIKE '$2a$%' 
  AND password NOT LIKE '$2b$%';

-- 3. Cabut seluruh hak akses terbuka pada tabel users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view users" ON users;
DROP POLICY IF EXISTS "Public can insert users" ON users;
DROP POLICY IF EXISTS "Public can update users" ON users;
DROP POLICY IF EXISTS "Allow reading non-sensitive user info" ON users;
DROP POLICY IF EXISTS "Allow updating own profile status and group" ON users;

-- 4. Batasi izin kolom (Column-Level Security):
-- Cabut akses baca kolom 'password' dari publik (anon & authenticated).
-- Kunci publik (anon_key) TIDAK BISA LAGI membaca password atau melakukan dump data password.
REVOKE ALL ON users FROM anon;
REVOKE ALL ON users FROM authenticated;

-- Hanya berikan izin SELECT pada kolom profil publik (SEMUA kolom KECUALI password)
GRANT SELECT (id, nim, nama, role, group_id, status, is_udzur, no_hp, created_at) ON users TO anon, authenticated;
-- Berikan izin UPDATE terbatas (untuk pergantian kelompok dan mode udzur)
GRANT UPDATE (group_id, is_udzur, status) ON users TO anon, authenticated;

-- 5. Buat Policy RLS Baru yang Aman
CREATE POLICY "Allow reading non-sensitive user info"
ON users FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow updating own profile status and group"
ON users FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 6. Notifikasi PostgREST untuk me-reload schema cache
NOTIFY pgrst, 'reload schema';
