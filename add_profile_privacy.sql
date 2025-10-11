-- Migration: Add privacy settings to profiles
-- Run this SQL in your Supabase SQL Editor

-- Add is_private column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.is_private IS 'When true, only followers can view the user''s posts and profile statistics';
