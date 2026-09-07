import Link from "next/link";
import { BrandMark } from "@/components/brand-logo";
import { SITE_CONFIG } from "@/lib/site-config";

export type LegalSection = {
  id: string;
  title: string;
  content: React.ReactNode;
};

export function LegalPage({ title, summary, updated, sections }: { title: string; summary: string; updated: string; sections: LegalSection[] }) {
  return (
    <main className="landing-shell -m-4 min-h-dvh bg-background lg:-m-8">
      <header className="border-b border-border bg-card/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" aria-label="ZeroDebt home" className="tap-target flex items-center gap-2.5 font-bold">
            <BrandMark className="h-9 w-9" />
            <span>ZeroDebt</span>
          </Link>
          <Link href="/auth" className="tap-target inline-flex items-center rounded-xl border border-border bg-background px-4 text-sm font-semibold">
            Sign in
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <p className="text-sm font-medium text-muted-foreground">Last updated {updated}</p>
          <nav aria-label={`${title} sections`} className="mt-6 hidden lg:block">
            <p className="text-sm font-semibold text-foreground">On this page</p>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              {sections.map((section) => (
                <li key={section.id}><a className="rounded-sm underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`#${section.id}`}>{section.title}</a></li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="min-w-0 max-w-3xl">
          <h1 className="text-balance text-4xl font-bold tracking-[-.03em] sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{summary}</p>
          <div className="mt-12 space-y-12">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-8">
                <h2 className="text-2xl font-bold tracking-[-.02em]">{section.title}</h2>
                <div className="legal-copy mt-4 space-y-4 leading-7 text-muted-foreground">{section.content}</div>
              </section>
            ))}
          </div>
        </article>
      </div>

      <footer className="border-t border-border bg-card px-5 py-8 text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ZeroDebt</p>
          <nav aria-label="Legal" className="flex gap-5">
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/privacy">Privacy</Link>
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/terms">Terms</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

export function ContactCopy() {
  return SITE_CONFIG.supportEmail ? (
    <p>Questions or requests can be sent to <a className="font-medium text-foreground underline underline-offset-4" href={`mailto:${SITE_CONFIG.supportEmail}`}>{SITE_CONFIG.supportEmail}</a>.</p>
  ) : (
    <p>A public support address has not yet been configured. ZeroDebt will publish the contact address here before broad public launch.</p>
  );
}
