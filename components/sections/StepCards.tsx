import type { ReactNode } from "react";

export interface StepCard {
  marker: ReactNode;
  title: ReactNode;
  body: ReactNode;
}

export function StepCards({ items }: { items: StepCard[] }) {
  return (
    <div className="steps-grid">
      {items.map((item, i) => (
        <div className="step-card" key={i}>
          <div className="step-num">{item.marker}</div>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </div>
      ))}
    </div>
  );
}
