import {insert,list,mapAccount} from '@/lib/finance-api'; export const GET=()=>list('accounts','name'); export const POST=async(r:Request)=>insert('accounts',mapAccount(await r.json()));
