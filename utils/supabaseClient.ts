import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or anon key missing — required for production');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// ── Session cache ────────────────────────────────────────────────────────────
// Supabase's auth.getSession() acquires a Web Lock for token refresh. When
// 38+ useSupabaseBackedState hooks call it simultaneously on mount, we get:
//   "Lock was not released within 5000ms" and AbortError: Lock broken.
//
// Fix: all callers share ONE promise for 30 seconds. Only the first call
// acquires the lock; the rest await the same result with zero contention.
let _sessionPromise: Promise<Session | null> | null = null;
let _sessionCacheExpiry = 0;

export async function getSupabaseSession(): Promise<Session | null> {
  if (_sessionPromise && Date.now() < _sessionCacheExpiry) {
    return _sessionPromise;
  }
  _sessionCacheExpiry = Date.now() + 30_000; // tokens last ~3600s; 30s cache is safe
  _sessionPromise = supabase.auth.getSession().then(({ data: { session } }) => session);
  return _sessionPromise;
}

// Call after sign-in or sign-out so the next getSupabaseSession() gets a fresh token.
export function bustSessionCache(): void {
  _sessionPromise = null;
  _sessionCacheExpiry = 0;
}

