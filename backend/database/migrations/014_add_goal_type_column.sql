-- Migration 014: Add `type` column to `goals` table
-- Purpose: Align Goal model usage with DB schema by ensuring a `type` column exists.
-- Related task: Sync DB schema with Goal model (priority 1)

-- Up: add the column if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='goals' AND column_name='type'
    ) THEN
        ALTER TABLE goals ADD COLUMN type VARCHAR(50);
    END IF;
END$$;

-- Down: remove the column (if needed)
-- Note: dropping column in production may remove data; review before applying down migration.
-- ALTER TABLE goals DROP COLUMN IF EXISTS type;
