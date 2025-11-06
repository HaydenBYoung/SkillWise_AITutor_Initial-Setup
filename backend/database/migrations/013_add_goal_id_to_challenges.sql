-- Add goal_id to challenges and create FK to goals(id)
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS goal_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_challenges_goal_id'
  ) THEN
    ALTER TABLE challenges
    ADD CONSTRAINT fk_challenges_goal_id FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- Index to speed up lookups by goal
CREATE INDEX IF NOT EXISTS idx_challenges_goal_id ON challenges(goal_id);
