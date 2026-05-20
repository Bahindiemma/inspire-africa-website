import type { ReactNode, CSSProperties } from "react";

interface Props {
  eyebrow: ReactNode;
  heading: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
  secondary?: ReactNode;
  style?: CSSProperties;
}

export function FinalCta({ eyebrow, heading, lede, children, secondary, style }: Props) {
  return (
    <section className="final" style={style}>
      <div className="container">
        <div className="final-content">
          <span className="final-eyebrow">{eyebrow}</span>
          <h2>{heading}</h2>
          {lede ? <p className="final-lede">{lede}</p> : null}
          {children ? <div className="final-ctas">{children}</div> : null}
          {secondary ? <div className="final-secondary">{secondary}</div> : null}
        </div>
      </div>
    </section>
  );
}
