import {insert,list,mapGoal} from '@/lib/finance-api'; export const GET=()=>list('goals','name'); export const POST=async(r:Request)=>insert('goals',mapGoal(await r.json()));
