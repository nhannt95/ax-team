"use client";

import { createContext, useContext, useSyncExternalStore, useCallback } from "react";

interface PublicModeContextValue {
  enabled: boolean;
  toggle: () => void;
}

const PublicModeContext = createContext<PublicModeContextValue | null>(null);

const KEY = "ax-public-mode";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("ax-public-mode-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("ax-public-mode-change", callback);
  };
}

function getSnapshot(): boolean {
  return localStorage.getItem(KEY) === "true";
}

function getServerSnapshot(): boolean {
  return false;
}

export function PublicModeProvider({ children }: { children: React.ReactNode }) {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = !enabled;
    localStorage.setItem(KEY, String(next));
    window.dispatchEvent(new Event("ax-public-mode-change"));
  }, [enabled]);

  return (
    <PublicModeContext.Provider value={{ enabled, toggle }}>
      {children}
    </PublicModeContext.Provider>
  );
}

export function usePublicMode() {
  const ctx = useContext(PublicModeContext);
  if (!ctx) throw new Error("usePublicMode must be used within PublicModeProvider");
  return ctx;
}
