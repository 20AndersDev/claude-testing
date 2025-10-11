# Private Profile Feature Setup

This document explains how to set up the private profile feature for your application.

## Database Migration

You need to run the SQL migration to add the `is_private` column to your profiles table.

### Steps:

1. **Open your Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to the SQL Editor

2. **Run the migration**
   - Open the file `add_profile_privacy.sql`
   - Copy the SQL content
   - Paste it into the Supabase SQL Editor
   - Click "Run" to execute the migration

3. **Verify the migration**
   - Go to the Table Editor
   - Select the `profiles` table
   - Verify that the `is_private` column exists (BOOLEAN type, default: FALSE)

## Feature Overview

### What it does:
- Users can toggle their profile to be private in their profile settings
- When a profile is private:
  - Only followers can see posts and stats
  - Non-followers see a message: "This Account is Private - Follow this account to see their posts and stats"
  - The profile picture, name, and username are still visible
  - Non-followers can still follow the account

### How to use:
1. Go to your profile
2. Click "Edit Profile"
3. Toggle the "Private Profile" switch
4. Click "Save Changes"

### Privacy Rules:
- ✅ Own profile: Always visible (you can see your own content)
- ✅ Followers: Can see all posts and stats when profile is private
- ❌ Non-followers: Cannot see posts/stats when profile is private
- 🔓 Public profiles: Everyone can see posts and stats

## Files Modified

- `src/Profile.js` - Added privacy toggle, private profile view logic
- `src/Profile.css` - Added styling for privacy toggle and private profile notice
- `add_profile_privacy.sql` - Database migration file

## Notes

- The feature is fully responsive and works on all devices
- Privacy setting is stored per user in the database
- When a user follows a private account, they immediately gain access to the content
