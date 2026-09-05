import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import manifest from "../app/manifest";

const source=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
describe("ZeroDebt public experience",()=>{
  it("keeps the root landing page public and protects app routes",()=>{const middleware=source("lib/supabase/middleware.ts");expect(middleware).toContain("path === '/'");expect(middleware).toContain("url.pathname = '/auth'")});
  it("connects landing calls to action to authentication",()=>{const landing=source("app/page.tsx");expect(landing).toContain('href="/auth"');expect(landing).toContain("Start Your Debt-Free Journey")});
  it("ships installable standalone metadata without API caching",()=>{const value=manifest();expect(value.name).toBe("ZeroDebt");expect(value.display).toBe("standalone");expect(value.start_url).toBe("/overview");expect(source("app/manifest.ts")).not.toMatch(/serviceWorker|api\/workspace/i)});
  it("hides Google sign-in unless explicitly configured",()=>{expect(source("app/auth/auth-form.tsx")).toContain("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED==='true'")});
  it("keeps valid currency out of onboarding",()=>{expect(source("app/onboarding/page.tsx")).not.toMatch(/select default currency|base currency/i)});
});
