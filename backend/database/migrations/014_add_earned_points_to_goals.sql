-- Migration 014: Add earned_points column to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS earned_points INTEGER DEFAULT 0;