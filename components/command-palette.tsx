"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog";
import { 
  Search, 
  Plus, 
  Wallet, 
  ArrowLeftRight, 
  TrendingDown, 
  TrendingUp, 
  Kanban, 
  PieChart, 
  Settings as SettingsIcon,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

const COMMANDS = [
  { name: "Overview", href: "/overview", icon: Search, category: "Navigation" },
  { name: "Accounts", href: "/accounts", icon: Wallet, category: "Navigation" },
  { name: "Transactions", href: "/transactions", icon: ArrowLeftRight, category: "Navigation" },
  { name: "Debts", href: "/debts", icon: TrendingDown, category: "Navigation" },
  { name: "Income", href: "/income", icon: TrendingUp, category: "Navigation" },
  { name: "Pipeline", href: "/pipeline", icon: Kanban, category: "Navigation" },
  { name: "Budget", href: "/budget", icon: PieChart, category: "Navigation" },
  { name: "AI Advisor", href: "/ai", icon: Bot, category: "Navigation" },
  { name: "Settings", href: "/settings", icon: SettingsIcon, category: "System" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const filteredCommands = COMMANDS.filter((command) =>
    command.name.toLowerCase().includes(query.toLowerCase())
  );

  const onSelect = (href: string) => {
    router.push(href);
    setOpen(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden glass border-white/20 shadow-2xl">
        <DialogHeader className="p-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              placeholder="Search for a page or action..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground"
              autoFocus
            />
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/50 text-[10px] font-bold text-muted-foreground border border-white/5 uppercase">
              ESC to close
            </div>
          </div>
        </DialogHeader>
        <div className="max-h-[350px] overflow-y-auto p-2 space-y-4">
          {filteredCommands.length > 0 ? (
            <div className="space-y-1">
              <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Jump to Page
              </div>
              {filteredCommands.map((command) => (
                <button
                  key={command.href}
                  onClick={() => onSelect(command.href)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-all group"
                >
                  <command.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  {command.name}
                  <span className="ml-auto text-[10px] opacity-0 group-hover:opacity-60 transition-opacity font-bold uppercase tracking-widest">
                    Enter
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No results found for &quot;{query}&quot;</p>
            </div>
          )}
        </div>
        <div className="p-3 border-t border-white/10 bg-black/10 flex justify-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <div className="flex items-center gap-1">
            <span className="px-1 py-0.5 rounded bg-secondary">↑↓</span>
            Navigate
          </div>
          <div className="flex items-center gap-1">
            <span className="px-1 py-0.5 rounded bg-secondary">↵</span>
            Select
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
