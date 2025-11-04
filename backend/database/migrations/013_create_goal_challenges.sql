-- Migration 013: Create goal_challenges junction table
-- Links challenges to specific user goals

CREATE TABLE IF NOT EXISTS goal_challenges (
  id SERIAL PRIMARY KEY,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'paused')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  submission_text TEXT,
  submission_url VARCHAR(500),
  feedback TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(goal_id, challenge_id, user_id)
);

-- Create indexes
CREATE INDEX idx_goal_challenges_goal_id ON goal_challenges(goal_id);
CREATE INDEX idx_goal_challenges_challenge_id ON goal_challenges(challenge_id);
CREATE INDEX idx_goal_challenges_user_id ON goal_challenges(user_id);
CREATE INDEX idx_goal_challenges_status ON goal_challenges(status);
CREATE INDEX idx_goal_challenges_completed_at ON goal_challenges(completed_at);

-- Create trigger for updated_at
CREATE TRIGGER update_goal_challenges_updated_at BEFORE UPDATE ON goal_challenges
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update goal progress when challenge status changes
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update goal progress percentage based on completed challenges
  UPDATE goals 
  SET progress_percentage = (
    SELECT COALESCE(ROUND(
      (COUNT(*) FILTER (WHERE gc.status = 'completed') * 100.0) / 
      NULLIF(COUNT(*), 0)
    ), 0)
    FROM goal_challenges gc 
    WHERE gc.goal_id = COALESCE(NEW.goal_id, OLD.goal_id)
  ),
  updated_at = CURRENT_TIMESTAMP
  WHERE id = COALESCE(NEW.goal_id, OLD.goal_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update goal progress
CREATE TRIGGER trigger_update_goal_progress
  AFTER INSERT OR UPDATE OR DELETE ON goal_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress();