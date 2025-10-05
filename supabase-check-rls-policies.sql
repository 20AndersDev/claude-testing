-- Check existing RLS policies on posts table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'posts';

-- You might need to update the UPDATE policy for posts
-- Here's what the policy should look like:

-- Drop existing UPDATE policy if it's too restrictive
DROP POLICY IF EXISTS "Users can update own posts" ON posts;

-- Create a new UPDATE policy that allows users to update their own posts
CREATE POLICY "Users can update own posts"
  ON posts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- OR if you want to allow anyone to update posts (for likes/comments from other users)
-- you might need a more permissive policy:

DROP POLICY IF EXISTS "Users can update own posts" ON posts;

CREATE POLICY "Anyone can update posts for interactions"
  ON posts
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Note: The second option is less secure but allows any authenticated user
-- to update any post (which is needed for likes and comments from other users)
