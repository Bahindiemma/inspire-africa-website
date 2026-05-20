import type { ReactNode } from "react";

export interface FeatureItem {
  title: ReactNode;
  body: ReactNode;
  /** symbol displayed in the bullet — defaults to the 1-indexed step. */
  marker?: string;
  bad?: boolean;
}

export function FeatureList({ items }: { items: FeatureItem[] }) {
  return (
    <ul className="feature-list">
      {items.map((item, i) => (
        <li key={i}>
          <span className={`bullet${item.bad ? " is-bad" : ""}`}>
            {item.marker ?? String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <h3>{item.title}</h3>
            <p className="feature-body">{item.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
