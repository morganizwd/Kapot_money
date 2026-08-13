"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggleTheme() {
    const isDark = document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const nextTheme = isDark ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("kapot-theme", nextTheme);
  }

  return <button type="button" onClick={toggleTheme} className="grid size-11 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Переключить тему"><Sun aria-hidden className="theme-sun size-5" /><Moon aria-hidden className="theme-moon size-5" /></button>;
}
