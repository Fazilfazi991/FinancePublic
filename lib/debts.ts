import type {Debt} from "./store";

const finite=(value:unknown,fallback=0)=>{const number=Number(value);return Number.isFinite(number)?number:fallback};

export function normalizeDebtRecord(row:Record<string,unknown>,fallback:Partial<Debt>={}):Debt{
 const balance=Math.max(0,finite(row.balance,fallback.balance??0));
 return {id:String(row.id??fallback.id??""),name:String(row.name??fallback.name??"Debt"),total:Math.max(balance,finite(row.original_amount??row.total,fallback.total??balance)),balance,rate:Math.max(0,finite(row.apr??row.rate,fallback.rate??0)),minPayment:Math.max(0,finite(row.minimum_payment??row.minPayment,fallback.minPayment??0)),notes:String(row.notes??fallback.notes??""),color:String(row.color??fallback.color??"#E24B4A")};
}
