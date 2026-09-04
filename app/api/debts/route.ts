import {insert,list,mapDebt} from '@/lib/finance-api'; export const GET=()=>list('debts','balance'); export const POST=async(r:Request)=>insert('debts',mapDebt(await r.json()));
