-- ==============================================================================
-- Migrasi v0.4: Gamifikasi Spiritual (Milestone Badges & Streak Freeze)
-- Mutabaah Space & Portal Al-Futuwwah
-- ==============================================================================

-- 1. Tambah kolom mode udzur syar'i pada tabel users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_udzur BOOLEAN DEFAULT FALSE;

-- 2. Tabel Badges yang diraih pengguna
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_nim TEXT NOT NULL,
  badge_id TEXT NOT NULL, -- e.g. 'first_step', 'jamaah_champion', 'tahajud_warrior'
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_user_badge UNIQUE (user_nim, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_badges_user ON user_badges(user_nim);

-- 3. Policy RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access user_badges" ON user_badges;
CREATE POLICY "Public access user_badges" 
ON user_badges FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
