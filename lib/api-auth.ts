import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const apiError = (message: string, status = 400) => NextResponse.json({ error: { message } }, { status });
export async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { response: apiError('Authentication required', 401) } as const;
  return { supabase, user } as const;
}
