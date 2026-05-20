import type { ReactNode } from "react";

export interface ProcessItem {
  title: ReactNode;
  body: ReactNode;
}

export function ProcessList({ items }: { items: ProcessItem[] }) {
  return (
    <ol className="process-list">
      {items.map((item, i) => (
        <li key={i}>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </li>
      ))}
    </ol>
  );
}
