"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: Resolved;
  setTheme: (t: Theme) => void;
}

const STORAGE_KEY = "inspire-theme";
const MQ_DARK = "(prefers-color-scheme: dark)";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readSystem(): Resolved {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia(MQ_DARK).matches ? "dark" : "light";
}

function readStored(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {}
  return "light";
}

function apply(resolved: Resolved) {
  document.documentElement.setAttribute("data-theme", resolved);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolved, setResolved] = useState<Resolved>("light");

  // Hydrate from localStorage on mount.
  useEffect(() => {
    const stored = readStored();
    const next = stored === "system" ? readSystem() : stored;
    setThemeState(stored);
    setResolved(next);
    apply(next);
  }, []);

  // Track the OS preference only while the user has picked "system".
  // Uses the modern addEventListener API (no MediaQueryList.addListener).
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(MQ_DARK);
    const handler = (e: MediaQueryListEvent) => {
      const next: Resolved = e.matches ? "dark" : "light";
      setResolved(next);
      apply(next);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  // Mirror cross-tab theme changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      const v = e.newValue as Theme;
      const next = v === "system" ? readSystem() : v;
      setThemeState(v);
      setResolved(next);
      apply(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    const next = t === "system" ? readSystem() : t;
    setThemeState(t);
    setResolved(next);
    apply(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, t);
    } catch {}
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme: resolved, setTheme }),
    [theme, resolved, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { theme: "light", resolvedTheme: "light", setTheme: () => {} };
  }
  return ctx;
}
