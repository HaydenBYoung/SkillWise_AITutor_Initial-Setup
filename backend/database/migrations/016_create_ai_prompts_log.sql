-- Migration: Create AI prompts log table for storing prompts and model responses

CREATE TABLE IF NOT EXISTS ai_prompts_log (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  prompt_text TEXT NOT NULL,
  response_json JSONB,
  ai_model VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_prompts_log_user_id ON ai_prompts_log(user_id);
CREATE INDEX idx_ai_prompts_log_created_at ON ai_prompts_log(created_at);
