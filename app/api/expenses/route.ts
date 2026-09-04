import {insert,list,mapBudget} from '@/lib/finance-api'; export const GET=()=>list('budgets','name'); export const POST=async(r:Request)=>insert('budgets',mapBudget(await r.json()));
