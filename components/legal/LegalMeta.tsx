import type { ReactNode } from "react";

export interface LegalMetaItem {
  label: string;
  value: ReactNode;
}

export function LegalMeta({ items }: { items: LegalMetaItem[] }) {
  return (
    <div className="legal-meta">
      <div className="container">
        {items.map((item) => (
          <div className="legal-meta-item" key={item.label}>
            <strong>{item.label}</strong>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
