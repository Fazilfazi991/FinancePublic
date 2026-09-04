export type Strategy = 'avalanche' | 'snowball';
export type EngineDebt = { id:string; balance:number; apr:number|null|undefined; minimumPayment:number|null|undefined; createdAt?:string };
export type PayoffResult = { status:'ok'|'debt_free'|'insufficient_data'|'minimum_shortfall'|'unpayable'; freedomNumber:number; shortfall:number; months:number|null; debtFreeDate:string|null; totalInterest:number; order:string[]; payoffDates:Record<string,string>; estimateQuality:'complete'|'missing_apr'; message?:string };
const cents=(n:number)=>Math.round((Number.isFinite(n)?n:0)*100), money=(n:number)=>Math.round(n)/100;
export const freedomNumber=(debts:Pick<EngineDebt,'balance'>[])=>money(debts.reduce((s,d)=>s+Math.max(0,cents(d.balance)),0));
export function orderDebts(debts:EngineDebt[],strategy:Strategy){
 return debts.filter(d=>cents(d.balance)>0).slice().sort((a,b)=>strategy==='snowball'
  ? cents(a.balance)-cents(b.balance)||((b.apr??-1)-(a.apr??-1))||a.id.localeCompare(b.id)
  : (a.apr==null?1:0)-(b.apr==null?1:0)||((b.apr??-1)-(a.apr??-1))||cents(b.balance)-cents(a.balance)||a.id.localeCompare(b.id));
}
export function calculatePayoff(debts:EngineDebt[],monthlyPower:number,strategy:Strategy,start=new Date()):PayoffResult{
 const active=orderDebts(debts,strategy), freedom=freedomNumber(active), unknown=active.filter(d=>d.apr==null).length;
 const quality=unknown?'missing_apr':'complete';
 if(!active.length)return{status:'debt_free',freedomNumber:0,shortfall:0,months:0,debtFreeDate:start.toISOString().slice(0,10),totalInterest:0,order:[],payoffDates:{},estimateQuality:quality};
 if(!Number.isFinite(monthlyPower))return{status:'insufficient_data',freedomNumber:freedom,shortfall:0,months:null,debtFreeDate:null,totalInterest:0,order:active.map(d=>d.id),payoffDates:{},estimateQuality:quality};
 const budget=cents(monthlyPower), minimums=active.reduce((s,d)=>s+cents(d.minimumPayment??0),0);
 if(budget<minimums)return{status:'minimum_shortfall',freedomNumber:freedom,shortfall:money(minimums-budget),months:null,debtFreeDate:null,totalInterest:0,order:active.map(d=>d.id),payoffDates:{},estimateQuality:quality,message:'Your current monthly debt budget is below your required minimum payments.'};
 if(budget<=0)return{status:'unpayable',freedomNumber:freedom,shortfall:0,months:null,debtFreeDate:null,totalInterest:0,order:active.map(d=>d.id),payoffDates:{},estimateQuality:quality};
 const balances=new Map(active.map(d=>[d.id,cents(d.balance)])), payoffDates:Record<string,string>={}; let interest=0,month=0;
 for(;month<1200&&Array.from(balances.values()).some(v=>v>0);month++){
  for(const d of active){const bal=balances.get(d.id)!;if(bal<=0)continue;const i=Math.round(bal*((d.apr??0)/100/12));balances.set(d.id,bal+i);interest+=i;}
  let remaining=budget;
  for(const d of active){const bal=balances.get(d.id)!;if(bal<=0)continue;const p=Math.min(bal,cents(d.minimumPayment??0),remaining);balances.set(d.id,bal-p);remaining-=p;}
  for(const d of orderDebts(active.filter(x=>(balances.get(x.id)??0)>0),strategy)){if(remaining<=0)break;const bal=balances.get(d.id)!;const p=Math.min(bal,remaining);balances.set(d.id,bal-p);remaining-=p;}
  for(const d of active)if((balances.get(d.id)??0)===0&&!payoffDates[d.id]){const dt=new Date(start);dt.setMonth(dt.getMonth()+month+1);payoffDates[d.id]=dt.toISOString().slice(0,10);}
 }
 if(month>=1200)return{status:'unpayable',freedomNumber:freedom,shortfall:0,months:null,debtFreeDate:null,totalInterest:money(interest),order:active.map(d=>d.id),payoffDates,estimateQuality:quality};
 const end=new Date(start);end.setMonth(end.getMonth()+month);
 return{status:'ok',freedomNumber:freedom,shortfall:0,months:month,debtFreeDate:end.toISOString().slice(0,10),totalInterest:money(interest),order:active.map(d=>d.id),payoffDates,estimateQuality:quality,message:unknown?`Estimate excludes interest for ${unknown} debt${unknown===1?'':'s'} with no APR.`:undefined};
}
