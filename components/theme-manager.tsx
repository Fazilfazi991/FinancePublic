"use client";

import { useEffect } from "react";
import { useFinanceStore } from "@/lib/store";

export function ThemeManager() {
  const theme = useFinanceStore((state) => state.settings.theme);

  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", theme === "dark" || (theme === "system" && systemDark));
    localStorage.setItem("finance-theme", theme);
  }, [theme]);

  return null;
}
