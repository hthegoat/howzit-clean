-- User favorite spots
CREATE TABLE IF NOT EXISTS user_spots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  spot_id uuid REFERENCES spots(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, spot_id)
);

-- RLS
ALTER TABLE user_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own favorites" ON user_spots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" ON user_spots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites" ON user_spots
  FOR DELETE USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_user_spots_user_id ON user_spots(user_id);
CREATE INDEX idx_user_spots_spot_id ON user_spots(spot_id);
