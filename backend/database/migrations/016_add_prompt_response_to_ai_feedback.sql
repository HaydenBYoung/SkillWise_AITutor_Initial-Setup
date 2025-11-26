-- Migration to add prompt and response columns to ai_feedback table
-- Story 3.6: Ensure table has submission_id, prompt, response

ALTER TABLE ai_feedback 
ADD COLUMN IF NOT EXISTS prompt TEXT,
ADD COLUMN IF NOT EXISTS response TEXT;

-- Update existing records to populate response from feedback_text
UPDATE ai_feedback 
SET response = feedback_text 
WHERE response IS NULL;
