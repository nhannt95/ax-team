"use client";

import { useSyncExternalStore, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY = "ax-theme";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("ax-theme-change", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("ax-theme-change", cb);
  };
}

function getSnapshot(): boolean {
  const stored = localStorage.getItem(KEY);
  return stored ? stored === "dark" : true;
}

function getServerSnapshot(): boolean {
  return true;
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  function toggle() {
    const next = !isDark;
    localStorage.setItem(KEY, next ? "dark" : "light");
    window.dispatchEvent(new Event("ax-theme-change"));
  }

  return (
    <button
      onClick={toggle}
      className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
      aria-label="Toggle theme"
    >
      <Sun
        className={cn(
          "h-4 w-4 absolute transition-all",
          isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        )}
      />
      <Moon
        className={cn(
          "h-4 w-4 transition-all",
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        )}
      />
    </button>
  );
}
