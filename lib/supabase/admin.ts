import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';

export function createAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error('Server integration is not configured');
  return createClient(getSupabaseConfig().url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}
