import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarNav } from "@/components/sidebar-nav";
import { ClientProvider } from "@/components/client-provider";
import { cn } from "@/lib/utils";
import { ThemeManager } from "@/components/theme-manager";
import { APP_URL } from "@/lib/app-url";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: "ZeroDebt",
  title: { default: "ZeroDebt — A clear path to debt freedom", template: "%s · ZeroDebt" },
  description: "Track your debts, understand your monthly payoff power, and know what to focus on next.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "ZeroDebt", statusBarStyle: "default" },
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
          <div className="flex">
            <SidebarNav />
            <main className="app-main flex-1 min-h-screen relative pb-28 lg:pb-8 pt-[calc(4rem+env(safe-area-inset-top))] lg:pt-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.05)_0%,transparent_50%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(139,92,246,0.05)_0%,transparent_50%)] pointer-events-none" />
              <div className="relative z-10 p-4 lg:p-8 max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
          <CommandPalette />
        </ClientProvider>
      </body>
    </html>
  );
}
