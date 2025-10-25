import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('REACT_APP_SUPABASE_URL:', supabaseUrl ? 'Present' : 'MISSING');
  console.error('REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'MISSING');
  throw new Error('Supabase configuration is missing. Please check your .env file and restart the development server.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
