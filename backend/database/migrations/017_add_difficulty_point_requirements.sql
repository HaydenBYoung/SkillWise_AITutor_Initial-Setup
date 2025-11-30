-- Migration 017: Add point requirements for goal difficulty levels

-- Add column to track points earned towards goal completion
ALTER TABLE goals ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;

-- Add column to track required points based on difficulty
ALTER TABLE goals ADD COLUMN IF NOT EXISTS points_required INTEGER DEFAULT 100;

-- Set default point requirements based on difficulty level
UPDATE goals SET points_required = CASE 
  WHEN difficulty_level = 'easy' THEN 20
  WHEN difficulty_level = 'medium' THEN 50
  WHEN difficulty_level = 'hard' THEN 80
  ELSE 50
END WHERE points_required = 100;

-- Create index for points tracking
CREATE INDEX IF NOT EXISTS idx_goals_points_earned ON goals(points_earned);
