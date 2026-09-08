import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError } from '@/lib/api-auth';

export type AppRole = 'user' | 'admin' | 'super_admin';
export type AdminIdentity = { id:string; email:string|null; role:Exclude<AppRole,'user'>; fullName:string; };

async function getIdentity() {
  const session = await createClient();
  const { data:{ user }, error } = await session.auth.getUser();
  if (error || !user) return { kind:'logged_out' as const };
  const db = createAdminClient();
  const { data:profile } = await db.from('profiles').select('id,full_name,display_name,email,role,status').eq('id',user.id).maybeSingle();
  if (!profile || profile.status !== 'active') return { kind:'forbidden' as const };
  return { kind:'authenticated' as const, db, identity:{ id:user.id, email:profile.email ?? user.email ?? null, role:profile.role as AppRole, fullName:profile.full_name ?? profile.display_name ?? 'Admin' } };
}

export async function requireAuthenticatedUser() {
  const result = await getIdentity();
  if (result.kind === 'logged_out') redirect('/auth?next=/admin');
  if (result.kind === 'forbidden') redirect('/auth?error=account');
  return result;
}
export async function requireAdmin():Promise<{db:ReturnType<typeof createAdminClient>;identity:AdminIdentity}> {
  const result = await getIdentity();
  if (result.kind === 'logged_out') redirect('/auth?next=/admin');
  if (result.kind !== 'authenticated' || !['admin','super_admin'].includes(result.identity.role)) redirect('/overview');
  return { db:result.db, identity:result.identity as AdminIdentity };
}
export async function requireSuperAdmin() {
  const result = await requireAdmin();
  if (result.identity.role !== 'super_admin') redirect('/admin');
  return result;
}
export async function requireAdminApi(superAdmin=false) {
  const result = await getIdentity();
  if (result.kind === 'logged_out') return { response:apiError('Authentication required',401) } as const;
  if (result.kind !== 'authenticated' || !['admin','super_admin'].includes(result.identity.role) || (superAdmin && result.identity.role !== 'super_admin')) return { response:apiError('Forbidden',403) } as const;
  return { db:result.db, identity:result.identity as AdminIdentity } as const;
}
