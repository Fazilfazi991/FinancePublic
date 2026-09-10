"use client";
import { Coffee, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEventSafely } from '@/lib/analytics/client';
export default function SupportPage() {
  return <main className="mobile-page"><header><h1 className="text-3xl font-bold tracking-tight">Support ZeroDebt</h1></header>
    <section className="mobile-card max-w-xl p-6 sm:p-8">
      <Coffee aria-hidden="true" className="mb-6 h-10 w-10 text-primary"/>
      <div className="space-y-5 leading-relaxed"><p>Debt is stressful enough without having to pay for the software that helps you track it.</p>
        <p className="text-xl font-semibold">ZeroDebt will always be free.</p>
        <p className="text-muted-foreground">If ZeroDebt has helped you save money, stay organized, or gain a little peace of mind, consider fueling the next release.</p></div>
      <Button asChild className="mt-7 min-h-11 w-full sm:w-auto"><a href="https://buymeacoffee.com/thameemar" target="_blank" rel="noopener noreferrer" onClick={()=>trackEventSafely('support_zero_debt_clicked')}>Buy Me a Coffee<ExternalLink aria-hidden="true" className="ml-2 h-4 w-4"/><span className="sr-only"> (opens in a new tab)</span></a></Button>
    </section></main>;
}
