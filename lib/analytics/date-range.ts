export const ANALYTICS_TIME_ZONE = 'UTC' as const;
export const RANGE_PRESETS = ['today','yesterday','7d','28d','30d','90d','this_month','previous_month','custom'] as const;
export type RangePreset = typeof RANGE_PRESETS[number];
export type AnalyticsRange = { preset:RangePreset; from:string; to:string; previousFrom:string; previousTo:string; days:number; label:string; grouping:'day'|'week'|'month' };
const DAY=86_400_000;
const iso=(date:Date)=>date.toISOString().slice(0,10);
const utcDate=(value:string)=>new Date(`${value}T00:00:00.000Z`);
const validDate=(value?:string)=>Boolean(value&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(utcDate(value).getTime()));
export function resolveAnalyticsRange(input:{preset?:string;from?:string;to?:string},now=new Date()):AnalyticsRange{
 const today=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));let preset=(RANGE_PRESETS.includes(input.preset as RangePreset)?input.preset:'30d') as RangePreset,from:Date,to:Date;
 if(validDate(input.from)&&validDate(input.to)){preset='custom';from=utcDate(input.from!);to=utcDate(input.to!);if(from>to)[from,to]=[to,from]}
 else if(preset==='today'){from=today;to=today}else if(preset==='yesterday'){from=new Date(today.getTime()-DAY);to=from}else if(preset==='this_month'){from=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),1));to=today}else if(preset==='previous_month'){from=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth()-1,1));to=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),0))}else{const days=Number(preset.slice(0,-1))||30;to=today;from=new Date(today.getTime()-(days-1)*DAY)}
 const days=Math.round((to.getTime()-from.getTime())/DAY)+1,previousTo=new Date(from.getTime()-DAY),previousFrom=new Date(previousTo.getTime()-(days-1)*DAY),grouping=days<=45?'day':days<=180?'week':'month';
 return{preset,from:iso(from),to:iso(to),previousFrom:iso(previousFrom),previousTo:iso(previousTo),days,label:from.getTime()===to.getTime()?from.toLocaleDateString('en',{timeZone:'UTC',month:'short',day:'numeric',year:'numeric'}):`${from.toLocaleDateString('en',{timeZone:'UTC',month:'short',day:'numeric'})} – ${to.toLocaleDateString('en',{timeZone:'UTC',month:'short',day:'numeric',year:'numeric'})}`,grouping};
}
export function comparison(current:number,previous:number){if(previous===0)return current===0?{percent:null,label:'No change',direction:'flat' as const}:{percent:null,label:'New',direction:'up' as const};const percent=(current-previous)/previous*100;if(Math.abs(percent)<.05)return{percent:0,label:'No change',direction:'flat' as const};return{percent,label:`${percent>0?'+':''}${percent.toFixed(1)}%`,direction:percent>0?'up' as const:'down' as const}}
export function rangeQuery(range:AnalyticsRange){return new URLSearchParams({preset:range.preset,from:range.from,to:range.to}).toString()}
