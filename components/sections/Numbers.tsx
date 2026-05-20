export interface Stat {
  value: string;
  label: string;
}

export function Numbers({ stats }: { stats: Stat[] }) {
  return (
    <div className="numbers">
      {stats.map((s) => (
        <div className="number" key={s.label}>
          <div className="number-value">{s.value}</div>
          <div className="number-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
