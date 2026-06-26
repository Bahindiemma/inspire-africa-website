import type { ReactNode } from "react";

export interface FeatureItem {
  title: ReactNode;
  body: ReactNode;
  /** symbol displayed in the bullet. Omit to render the item with no bullet. */
  marker?: string;
  bad?: boolean;
}

export function FeatureList({ items }: { items: FeatureItem[] }) {
  return (
    <ul className="feature-list">
      {items.map((item, i) => (
        <li key={i} className={item.marker ? undefined : "no-marker"}>
          {item.marker ? (
            <span className={`bullet${item.bad ? " is-bad" : ""}`}>{item.marker}</span>
          ) : null}
          <div>
            <h3>{item.title}</h3>
            <p className="feature-body">{item.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
