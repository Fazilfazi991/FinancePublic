import {NextResponse} from 'next/server'; import {apiError,requireUser} from '@/lib/api-auth';
async function run(reset:boolean){const a=await requireUser();if('response'in a)return a.response;const{error}=await a.supabase.rpc('load_demo_workspace',{p_reset:reset});if(error)return apiError(error.message.includes('workspace_not_empty')?'Sample data is only available in an empty workspace.':'Unable to prepare sample data.',409);return NextResponse.json({ok:true})}
export const POST=()=>run(false); export const PUT=()=>run(true);
export async function DELETE(){const a=await requireUser();if('response'in a)return a.response;const{error}=await a.supabase.rpc('remove_demo_workspace');return error?apiError('Unable to remove sample data.',400):NextResponse.json({ok:true})}
