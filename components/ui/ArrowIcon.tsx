export function ArrowIcon({ className = "arrow", size = 14 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
