import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { requireAdmin } from '@/lib/admin-auth';
import { getAnalyticsReport } from '@/lib/admin-data';
import { DateRangeFilter } from '@/components/admin/date-range-filter';
import { FeatureAdoption, Funnel, MetricCard, RecentRegistrations, RetentionTable, TrendChart } from '@/components/admin/dashboard-ui';

export const dynamic = 'force-dynamic';
type Params = { preset?:string; from?:string; to?:string };
const rate = (value:number,total:number) => total ? value / total * 100 : 0;

export default async function AdminOverview({searchParams}:{searchParams:Promise<Params>}) {
  const params=await searchParams,{db}=await requireAdmin(),{range,report}=await getAnalyticsReport(db,params);
  const r=report.registration,a=report.active,signup=report.funnel[0]?.users??0,completed=report.funnel[1]?.users??0;
  return <div className="space-y-8">
    <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><h1 className="text-3xl font-bold tracking-tight">Business overview</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Decision-ready registration, engagement, and product adoption. All internal dates use UTC.</p></div><DateRangeFilter range={range}/></header>
    {!report.historicalDataComplete&&<div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/><p>First-party event history begins {report.analyticsStartedAt?new Date(report.analyticsStartedAt).toLocaleDateString('en',{timeZone:'UTC'}):'after some registrations'}. Event-based metrics may understate older behavior.</p></div>}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Total users" value={r.total} help="Non-deleted profiles in the database."/><MetricCard label="New registrations" value={r.current} previous={r.previous} help="Profiles created during the selected UTC date range."/><MetricCard label="Active users" value={a.selected} previous={a.previous_selected} help="Distinct authenticated users with at least one qualifying product action in the selected period."/><MetricCard label="Signup conversion" value={rate(completed,signup)} format="percent" help="Distinct signup completions divided by distinct signup starts; event coverage may affect this."/></section>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="DAU" value={a.dau} help="Distinct authenticated qualifying users today (UTC)."/><MetricCard label="WAU" value={a.wau} help="Distinct authenticated qualifying users in the trailing 7 days."/><MetricCard label="MAU" value={a.mau} help="Distinct authenticated qualifying users in the trailing 30 days."/><MetricCard label="DAU / MAU stickiness" value={rate(a.dau,a.mau)} format="percent" help="DAU divided by MAU; a directional engagement ratio, not retention."/></section>
    <section className="grid gap-4 xl:grid-cols-2"><Panel title="Registration trend" note={`${range.grouping} default · database source of truth`}><TrendChart data={report.registrationTrend} series={[{key:'registered',label:'Registered',color:'#7c3aed'},{key:'verified',label:'Verified',color:'#10b981'}]} label="Registration trend"/></Panel><Panel title="Cumulative user growth" note="Registered, verified, and premium profiles"><TrendChart data={report.registrationTrend} series={[{key:'total',label:'Total',color:'#7c3aed'},{key:'totalVerified',label:'Verified',color:'#10b981'},{key:'premium',label:'Premium',color:'#f59e0b'}]} label="Cumulative user growth"/></Panel></section>
    <Panel title="Registration and onboarding funnel" note="Distinct people; database fallbacks are used where reliable"><Funnel stages={report.funnel}/></Panel>
    <section className="grid gap-4 xl:grid-cols-2"><Panel title="Feature adoption" note="Unique users and action volume; no financial values"><FeatureAdoption rows={report.featureAdoption} activeUsers={a.selected}/></Panel><Panel title="30-day active-user trend" note="Distinct qualifying users per UTC day"><TrendChart data={report.activeTrend} series={[{key:'users',label:'Active users',color:'#7c3aed'}]} label="Active-user trend"/></Panel></section>
    <Panel title="Weekly retention cohorts" note="Retained on or after each milestone; immature cohorts are not scored"><RetentionTable rows={report.retention}/></Panel>
    <Panel title="Recent registrations" note="Latest 10 profiles"><RecentRegistrations rows={report.recentRegistrations}/><Link href="/admin/users" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">View all users</Link></Panel>
  </div>
}
function Panel({title,note,children}:{title:string;note:string;children:React.ReactNode}){return <article className="min-w-0 rounded-2xl bg-card p-5 shadow-sm"><div className="mb-5"><h2 className="text-lg font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{note}</p></div>{children}</article>}
