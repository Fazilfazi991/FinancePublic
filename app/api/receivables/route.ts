import { NextResponse } from 'next/server';
import { apiError, requireUser } from '@/lib/api-auth';
import { receivableMutationSchema } from '@/lib/receivables';

export async function GET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { data, error } = await auth.supabase.from('receivables')
    .select('*, receivable_payments(*)').eq('user_id', auth.user.id).order('created_at', { ascending: false });
  if (error) return apiError('Money to Receive could not be loaded. Please try again.', 503);
  return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const parsed = receivableMutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid details.', 400);
  const v = parsed.data;
  const { data, error } = await auth.supabase.rpc('mutate_owned_receivable', {
    p_action: v.action, p_id: v.id, p_receivable_id: v.receivableId ?? null,
    p_person_name: v.personName ?? null, p_amount: v.amount ?? null, p_account_id: v.accountId ?? null,
    p_date: v.date ?? null, p_due_date: v.dueDate ?? null, p_notes: v.notes,
  });
  if (error) {
    // Only explicit business-rule messages are safe to return; hide SQL details.
    return apiError(['P0001','P0002'].includes(error.code) ? error.message : 'The change could not be saved. Refresh and try again.', error.code === 'P0002' ? 404 : 400);
  }
  return NextResponse.json(data);
}
