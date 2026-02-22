-- Create custom types
CREATE TYPE room_status AS ENUM ('waiting', 'ready', 'judging', 'completed');
CREATE TYPE user_type AS ENUM ('user_a', 'user_b');
CREATE TYPE interaction_type AS ENUM ('like', 'view');

-- Create dispute_rooms table
CREATE TABLE dispute_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status room_status DEFAULT 'waiting',
  user_a_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  user_b_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  user_a_submitted BOOLEAN DEFAULT FALSE,
  user_b_submitted BOOLEAN DEFAULT FALSE,
  verdict_json JSONB,
  engagement_score INTEGER DEFAULT 0,
  title TEXT
);

-- Create submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES dispute_rooms(id) ON DELETE CASCADE,
  user_type user_type NOT NULL,
  story TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create engagement_interactions table
CREATE TABLE engagement_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES dispute_rooms(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  interaction_type interaction_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, ip_address, interaction_type)
);

-- Create indexes for performance
CREATE INDEX idx_dispute_rooms_status ON dispute_rooms(status);
CREATE INDEX idx_dispute_rooms_engagement ON dispute_rooms(engagement_score DESC);
CREATE INDEX idx_submissions_room_id ON submissions(room_id);
CREATE INDEX idx_documents_submission_id ON documents(submission_id);
CREATE INDEX idx_engagement_room_id ON engagement_interactions(room_id);

-- Enable Row Level Security
ALTER TABLE dispute_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dispute_rooms
-- Allow public read access for completed disputes (for feed)
CREATE POLICY "Public read access for completed disputes"
  ON dispute_rooms FOR SELECT
  USING (status = 'completed');

-- Allow anyone to insert new rooms
CREATE POLICY "Anyone can create rooms"
  ON dispute_rooms FOR INSERT
  WITH CHECK (true);

-- Allow updates only with valid token (will be enforced in API)
CREATE POLICY "Update with valid token"
  ON dispute_rooms FOR UPDATE
  USING (true);

-- RLS Policies for submissions
-- Allow public read for submissions of completed disputes
CREATE POLICY "Public read for completed dispute submissions"
  ON submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dispute_rooms
      WHERE dispute_rooms.id = submissions.room_id
      AND dispute_rooms.status = 'completed'
    )
  );

-- Allow insert for any room
CREATE POLICY "Anyone can insert submissions"
  ON submissions FOR INSERT
  WITH CHECK (true);

-- RLS Policies for documents
-- Allow public read for documents of completed disputes
CREATE POLICY "Public read for completed dispute documents"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM submissions
      JOIN dispute_rooms ON dispute_rooms.id = submissions.room_id
      WHERE submissions.id = documents.submission_id
      AND dispute_rooms.status = 'completed'
    )
  );

-- Allow insert for any submission
CREATE POLICY "Anyone can insert documents"
  ON documents FOR INSERT
  WITH CHECK (true);

-- RLS Policies for engagement_interactions
-- Allow public read
CREATE POLICY "Public read for engagement"
  ON engagement_interactions FOR SELECT
  USING (true);

-- Allow insert for anyone
CREATE POLICY "Anyone can engage"
  ON engagement_interactions FOR INSERT
  WITH CHECK (true);

-- Enable real-time for tables
ALTER PUBLICATION supabase_realtime ADD TABLE dispute_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
