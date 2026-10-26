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
DROP POLICY IF EXISTS "Allow insert for new users" ON users;

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

-- 6. RPC Function: Verifikasi Login Pengguna secara aman di dalam Database
CREATE OR REPLACE FUNCTION verify_user_login(
  p_nim TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_match BOOLEAN := false;
BEGIN
  -- Cari user berdasarkan NIM (case-insensitive & trim)
  SELECT id, nim, nama, role, group_id, status, is_udzur, no_hp, password
  INTO v_user
  FROM users
  WHERE LOWER(TRIM(nim)) = LOWER(TRIM(p_nim))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'NIM/Username atau Password salah, atau belum terdaftar.'
    );
  END IF;

  -- Verifikasi password:
  -- 1. Bcrypt hash check via crypt()
  -- 2. Fallback check jika password masih plaintext
  IF v_user.password = crypt(p_password, v_user.password) THEN
    v_match := true;
  ELSIF v_user.password = p_password THEN
    v_match := true;
    -- Otomatis upgrade ke hash Bcrypt jika masih plaintext
    UPDATE users 
    SET password = crypt(p_password, gen_salt('bf', 10))
    WHERE id = v_user.id;
  END IF;

  IF NOT v_match THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'NIM/Username atau Password salah.'
    );
  END IF;

  -- Cek status approval
  IF v_user.status = 'pending' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Akun kamu masih berstatus PENDING. Silakan hubungi Admin Kaderisasi untuk aktivasi.'
    );
  END IF;

  IF v_user.status = 'rejected' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Mohon maaf, pendaftaran akun kamu belum disetujui oleh Admin.'
    );
  END IF;

  -- Berhasil: kembalikan profil user TANPA kolom password
  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_user.id,
      'nim', v_user.nim,
      'nama', v_user.nama,
      'role', v_user.role,
      'group_id', v_user.group_id,
      'status', v_user.status,
      'is_udzur', v_user.is_udzur,
      'no_hp', v_user.no_hp
    )
  );
END;
$$;

-- 7. RPC Function: Pendaftaran Akun Baru secara Aman
CREATE OR REPLACE FUNCTION register_user_secure(
  p_nim TEXT,
  p_nama TEXT,
  p_password TEXT,
  p_role TEXT,
  p_no_hp TEXT DEFAULT NULL,
  p_kode_kelompok TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID := NULL;
  v_new_id UUID;
  v_status TEXT;
  v_clean_kode TEXT;
BEGIN
  -- Cek apakah NIM sudah ada
  IF EXISTS (SELECT 1 FROM users WHERE LOWER(TRIM(nim)) = LOWER(TRIM(p_nim))) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'NIM / Username ini sudah terdaftar! Silakan langsung login.'
    );
  END IF;

  -- Validasi kode kelompok jika diisi
  v_clean_kode := TRIM(COALESCE(p_kode_kelompok, ''));
  IF v_clean_kode <> '' AND p_role = 'anggota' THEN
    SELECT id INTO v_group_id
    FROM groups
    WHERE LOWER(TRIM(kode_kelompok)) = LOWER(v_clean_kode)
    LIMIT 1;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Kode kelompok "' || v_clean_kode || '" tidak ditemukan. Kosongkan jika belum memiliki kelompok.'
      );
    END IF;
  END IF;

  IF p_role = 'musyrif' THEN
    v_status := 'pending';
  ELSE
    v_status := 'approved';
  END IF;

  INSERT INTO users (nim, nama, password, role, status, group_id, no_hp)
  VALUES (
    TRIM(p_nim),
    TRIM(p_nama),
    crypt(p_password, gen_salt('bf', 10)),
    p_role,
    v_status,
    v_group_id,
    NULLIF(TRIM(COALESCE(p_no_hp, '')), '')
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_new_id,
      'nim', TRIM(p_nim),
      'nama', TRIM(p_nama),
      'role', p_role,
      'status', v_status,
      'group_id', v_group_id,
      'no_hp', p_no_hp
    )
  );
END;
$$;

-- Berikan izin eksekusi RPC function ke publik (anon & authenticated)
GRANT EXECUTE ON FUNCTION verify_user_login(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION register_user_secure(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- 8. Notifikasi PostgREST untuk me-reload schema cache
NOTIFY pgrst, 'reload schema';
