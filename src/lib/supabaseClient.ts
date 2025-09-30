import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types'; // Import the generated types

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key in .env.local');
}

// Use the generated 'Database' type for a fully typed client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);