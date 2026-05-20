"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";

const OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx={12} cy={12} r={4} />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
function SystemIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x={2} y={3} width={20} height={14} rx={2} ry={2} />
      <line x1={8} y1={21} x2={16} y2={21} />
      <line x1={12} y1={17} x2={12} y2={21} />
    </svg>
  );
}

function IconFor({ value }: { value: string }) {
  if (value === "dark") return <MoonIcon />;
  if (value === "system") return <SystemIcon />;
  return <SunIcon />;
}

export function ThemeSwitch() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const active = mounted ? theme ?? "system" : "light";
  const displayed = active === "system" ? (resolvedTheme ?? "light") : active;

  return (
    <div ref={wrapRef} className={`theme-switch${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="theme-switch-trigger"
        aria-label="Change theme"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <IconFor value={displayed} />
      </button>
      <div className="theme-switch-menu" role="menu">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className="theme-switch-option"
            role="menuitemradio"
            aria-checked={active === o.value}
            onClick={() => {
              setTheme(o.value);
              setOpen(false);
            }}
          >
            <IconFor value={o.value} />
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
