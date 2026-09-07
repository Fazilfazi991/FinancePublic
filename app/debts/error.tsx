"use client";
import Link from "next/link";

export default function DebtsError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <main className="mobile-page"><section className="mobile-card mx-auto max-w-lg p-6 text-center"><h1 className="text-xl font-bold">Something went wrong while loading your debts.</h1><p className="mt-2 text-sm text-muted-foreground">Your saved data has not been changed.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={reset} className="tap-target rounded-xl bg-primary px-4 font-semibold text-primary-foreground">Retry</button><Link href="/overview" className="tap-target grid place-items-center rounded-xl border border-border font-semibold">Go Home</Link></div></section></main>;
}
