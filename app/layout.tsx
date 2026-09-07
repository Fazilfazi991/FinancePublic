import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarNav } from "@/components/sidebar-nav";
import { ClientProvider } from "@/components/client-provider";
import { cn } from "@/lib/utils";
import { ThemeManager } from "@/components/theme-manager";
import { APP_URL } from "@/lib/app-url";
import { ZeroDebtAssistant } from "@/components/assistant/zero-debt-assistant";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: "ZeroDebt",
  title: { default: "ZeroDebt", template: "%s · ZeroDebt" },
  description: "A brighter tomorrow starts at zero. Track debt, build a payoff plan, and make steady progress toward debt freedom.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "ZeroDebt", statusBarStyle: "default" },
  alternates: { canonical: "/" },
  openGraph: { title: "ZeroDebt", description: "A brighter tomorrow starts at zero. Track debt, build a payoff plan, and make steady progress toward debt freedom.", url: "/", siteName: "ZeroDebt", type: "website", images: [{ url: "/brand/zerodebt-app-icon.png", width: 1254, height: 1254, alt: "ZeroDebt" }] },
  twitter: { card: "summary", title: "ZeroDebt", description: "A brighter tomorrow starts at zero.", images: ["/brand/zerodebt-app-icon.png"] },
  icons: { icon: [{url:"/brand/favicon-16.png",sizes:"16x16",type:"image/png"},{url:"/brand/favicon-32.png",sizes:"32x32",type:"image/png"}], apple: "/brand/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0f141c" },
  ],
};

import { CommandPalette } from "@/components/command-palette";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, "bg-background min-h-screen")}>
        <ThemeManager />
        <ClientProvider>
          <div className="flex min-w-0 w-full overflow-x-clip">
            <SidebarNav />
            <main className="app-main relative min-h-screen min-w-0 w-full flex-1 pb-28 pt-[calc(4rem+env(safe-area-inset-top))] lg:pb-8 lg:pt-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.05)_0%,transparent_50%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(114,211,167,0.06)_0%,transparent_50%)] pointer-events-none" />
              <div className="relative z-10 p-4 lg:p-8 max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
          <ZeroDebtAssistant />
          <CommandPalette />
        </ClientProvider>
      </body>
    </html>
  );
}
