-- Add visited_countries column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS visited_countries TEXT[] DEFAULT '{}';

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_visited_countries
ON profiles USING GIN (visited_countries);
