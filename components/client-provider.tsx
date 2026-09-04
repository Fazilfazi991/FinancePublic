"use client";

import { useEffect, useState } from "react";
import { useFinanceStore } from "@/lib/store";
import { clearDemoWorkspace, readDemoWorkspace } from "@/lib/demo-data";

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const hydrate = useFinanceStore((s) => s.hydrate);

  useEffect(() => {
    async function loadData() {
      try {
        const savedTheme = localStorage.getItem('finance-theme');
        // Init tables (idempotent)
        await fetch('/api/init-db');

        // Fetch all data in parallel
        const [debts, accounts, transactions, incomes, goals, expenses, settings] = await Promise.all([
          fetch('/api/debts').then(r => r.json()),
          fetch('/api/accounts').then(r => r.json()),
          fetch('/api/transactions').then(r => r.json()),
          fetch('/api/incomes').then(r => r.json()),
          fetch('/api/goals').then(r => r.json()),
          fetch('/api/expenses').then(r => r.json()),
          fetch('/api/settings').then(r => r.json()),
        ]);

        const hasRealData = [debts, accounts, transactions, incomes, goals, expenses].some(items => Array.isArray(items) && items.length);
        const storedDemo = readDemoWorkspace();
        if (storedDemo && !hasRealData) {
          hydrate({ ...storedDemo.workspace, demoMode: true,
            settings: { ...useFinanceStore.getState().settings, ...settings, currency: 'USD',
              ...(savedTheme && ['system', 'light', 'dark'].includes(savedTheme) ? { theme: savedTheme as 'system' | 'light' | 'dark' } : {}) } });
          setMounted(true);
          return;
        }
        if (storedDemo && hasRealData) clearDemoWorkspace();
        hydrate({ debts, accounts, transactions, incomes, goals, expenses, demoMode: false,
          settings: { ...useFinanceStore.getState().settings, ...settings,
            ...(savedTheme && ['system', 'light', 'dark'].includes(savedTheme) ? { theme: savedTheme as 'system' | 'light' | 'dark' } : {}) } });
      } catch (error) {
        console.error('Failed to load data from DB:', error);
      }
      setMounted(true);
    }

    loadData();
  }, [hydrate]);

  return (
    <div className={mounted ? "opacity-100 transition-opacity duration-300" : "opacity-0"}>
      {children}
    </div>
  );
}
