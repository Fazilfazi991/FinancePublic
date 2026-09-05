"use client";

import { useFinanceStore } from "@/lib/store";
import { User, Database, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { InstallZeroDebt } from "@/components/install-zero-debt";

export default function SettingsPage() {
  const { settings, setSettings, rates, demoMode, removeDemoData, resetDemoData } = useFinanceStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleUpdate = (key: string, value: any) => {
    setSettings(key === 'currency' ? { currency: value, currencySetupComplete: true } : { [key]: value });
  };

  const handleExportData = () => {
    const data = localStorage.getItem('financeOS_data');
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeOS_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Personalize your ZeroDebt experience.</p>
      </div>

      <div className="space-y-6">
        <InstallZeroDebt />
        {/* Profile Section */}
        <div className="glass p-8 rounded-[2.5rem]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profile
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Display Name</label>
              <input 
                type="text" 
                value={settings.name}
                onChange={(e) => handleUpdate('name', e.target.value)}
                className="w-full bg-secondary/50 border border-border/50 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Financial Settings */}
        <div className="glass p-8 rounded-[2.5rem]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Financial Defaults
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Base Currency</label>
              <select 
                value={settings.currency}
                onChange={(e) => handleUpdate('currency', e.target.value)}
                className="w-full bg-secondary/50 border border-border/50 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
              >
                {!settings.currencySetupComplete&&<option value="" disabled>Select default currency</option>}
                {SUPPORTED_CURRENCIES.filter(c => c in rates.rates).map(c => (
                  <option key={c} value={c}>{c === 'INR' ? 'INR — Indian Rupee' : c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Theme</label>
              <select 
                value={settings.theme}
                onChange={(e) => handleUpdate('theme', e.target.value)}
                className="w-full bg-secondary/50 border border-border/50 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
              >
                <option value="dark">Dark Mode</option>
                <option value="light">Light Mode</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sample data is isolated from real-data controls. */}
        <div className="glass p-8 rounded-[2.5rem]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-destructive" />
            Sample Data
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleExportData}
              className="flex-1 py-4 bg-secondary text-foreground rounded-2xl font-bold hover:bg-secondary/80 transition-all"
            >
              Export JSON
            </button>
            {demoMode&&<><button onClick={resetDemoData} className="flex-1 py-4 bg-secondary text-foreground rounded-2xl font-bold hover:bg-secondary/80 transition-all">Reset sample data</button><button onClick={()=>{if(confirm('Remove only the fictional sample records?'))removeDemoData()}} className="flex-1 py-4 bg-destructive/10 text-destructive rounded-2xl font-bold hover:bg-destructive/20 transition-all">Remove sample data</button></>}
          </div>
          {demoMode&&<p className="mt-3 text-sm text-muted-foreground">Sample records are securely stored in your ZeroDebt workspace and remain separate from real finance records.</p>}
        </div>
      </div>
    </div>
  );
}
