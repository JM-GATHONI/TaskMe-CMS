import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
// Replace these with your actual Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper to get the current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper to get the current session
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// Storage bucket names
export const STORAGE_BUCKETS = {
  PROFILES: 'profiles',
  PROPERTIES: 'properties',
  DOCUMENTS: 'documents',
  INVOICES: 'invoices',
  MAINTENANCE: 'maintenance'
} as const;
