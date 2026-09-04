"use client";

import { useEffect, useState } from "react";
import { useFinanceStore } from "@/lib/store";
import { usePathname } from "next/navigation";

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const hydrate = useFinanceStore((s) => s.hydrate);
  const pathname = usePathname();

  useEffect(() => {
    async function loadData() {
      if (pathname.startsWith('/auth')) { useFinanceStore.setState({accounts:[],transactions:[],debts:[],goals:[],expenses:[],incomes:[],projects:[],loaded:false,demoMode:false}); setMounted(true); return; }
      try {
        const savedTheme = localStorage.getItem('finance-theme');
        const [workspaceResponse, settingsResponse] = await Promise.all([fetch('/api/workspace'),fetch('/api/settings')]);
        if (!workspaceResponse.ok || !settingsResponse.ok) throw new Error('Workspace request failed');
        const workspace = await workspaceResponse.json(), settings = await settingsResponse.json();
        const demoMode = [...workspace.debts,...workspace.accounts,...workspace.transactions,...workspace.incomes,...workspace.goals,...workspace.expenses].some((item:any)=>item.isDemo);
        hydrate({ ...workspace, demoMode,
          settings: { ...useFinanceStore.getState().settings, ...settings,
            ...(savedTheme && ['system', 'light', 'dark'].includes(savedTheme) ? { theme: savedTheme as 'system' | 'light' | 'dark' } : {}) } });
      } catch (error) {
        console.error('Failed to load data from DB:', error);
      }
      setMounted(true);
    }

    loadData();
  }, [hydrate, pathname]);

  return (
    <div className={mounted ? "opacity-100 transition-opacity duration-300" : "opacity-0"}>
      {children}
    </div>
  );
}
