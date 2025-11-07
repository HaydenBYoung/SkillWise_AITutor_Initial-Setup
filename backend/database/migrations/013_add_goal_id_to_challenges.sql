-- Migration 013: Add goal_id to challenges table to link challenges with goals
-- This migration adds optional linking between challenges and goals

-- Add goal_id column to challenges table (nullable to allow independent challenges)
ALTER TABLE challenges 
ADD COLUMN goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_challenges_goal_id ON challenges(goal_id);

-- Add comment for documentation
COMMENT ON COLUMN challenges.goal_id IS 'Optional reference to associated goal. NULL means challenge is independent.';