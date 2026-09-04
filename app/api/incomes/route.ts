import {insert,list,mapIncome} from '@/lib/finance-api'; export const GET=()=>list('incomes','name'); export const POST=async(r:Request)=>insert('incomes',mapIncome(await r.json()));
