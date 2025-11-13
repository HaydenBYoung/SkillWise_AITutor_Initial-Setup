-- Migration 015: Add goal_id to challenges

ALTER TABLE IF EXISTS challenges
ADD COLUMN IF NOT EXISTS goal_id INTEGER;

-- Add foreign key constraint referencing goals(id). Use SET NULL on delete to keep challenges when goals are removed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'challenges' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'goal_id'
  ) THEN
    ALTER TABLE challenges
    ADD CONSTRAINT fk_challenges_goal_id
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Create index for faster lookups by goal_id
CREATE INDEX IF NOT EXISTS idx_challenges_goal_id ON challenges(goal_id);
