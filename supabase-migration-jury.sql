-- Run this in Supabase Dashboard > SQL Editor if you get:
-- "Could not find the 'is_jury_mode' column of 'dispute_rooms' in the schema cache"
-- This adds the jury columns and tables to an existing JudgeAI database.

-- 1. Add missing columns to dispute_rooms
ALTER TABLE dispute_rooms ADD COLUMN IF NOT EXISTS is_jury_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE dispute_rooms ADD COLUMN IF NOT EXISTS questioning_round INTEGER DEFAULT 0;
ALTER TABLE dispute_rooms ADD COLUMN IF NOT EXISTS max_questioning_rounds INTEGER DEFAULT 2;

-- 2. Create jury enum (ignore if already exists)
DO $$ BEGIN
  CREATE TYPE jury_vote_type AS ENUM ('user_a', 'user_b', 'abstain');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Create jury_members table (skip if already exists)
CREATE TABLE IF NOT EXISTS jury_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES dispute_rooms(id) ON DELETE CASCADE,
  member_index INTEGER NOT NULL CHECK (member_index >= 0 AND member_index < 12),
  display_name VARCHAR(50) DEFAULT 'Juri Uyesi',
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  vote jury_vote_type,
  vote_reason TEXT,
  has_voted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, member_index)
);

-- 4. Create jury_settings table (skip if already exists)
CREATE TABLE IF NOT EXISTS jury_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID UNIQUE REFERENCES dispute_rooms(id) ON DELETE CASCADE,
  consensus_required BOOLEAN DEFAULT TRUE,
  consensus_threshold INTEGER DEFAULT 12 CHECK (consensus_threshold >= 1 AND consensus_threshold <= 12),
  voting_deadline TIMESTAMP WITH TIME ZONE,
  allow_revote BOOLEAN DEFAULT TRUE,
  voting_visible BOOLEAN DEFAULT FALSE,
  anonymous_voting BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_jury_members_room_id ON jury_members(room_id);
CREATE INDEX IF NOT EXISTS idx_jury_members_token ON jury_members(token);

-- 6. RLS (only create if tables were just created; policies may need to be added manually if missing)
ALTER TABLE jury_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE jury_settings ENABLE ROW LEVEL SECURITY;

-- Policies for jury_members (ignore errors if already exist)
DO $$ BEGIN
  CREATE POLICY "Public read for completed jury members"
    ON jury_members FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM dispute_rooms
        WHERE dispute_rooms.id = jury_members.room_id AND dispute_rooms.status = 'completed'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Anyone can insert jury members" ON jury_members FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Update own jury vote" ON jury_members FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read for jury settings"
    ON jury_settings FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM dispute_rooms
        WHERE dispute_rooms.id = jury_settings.room_id AND dispute_rooms.status = 'completed'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Anyone can insert jury settings" ON jury_settings FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Update jury settings" ON jury_settings FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. Real-time (ignore if already in publication)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE jury_members;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE jury_settings;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
