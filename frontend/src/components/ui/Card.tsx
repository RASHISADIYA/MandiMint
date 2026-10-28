import type { ReactNode } from "react";
import "./card.css";

export interface CardProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function Card({
  title,
  description,
  icon,
  children,
  actions,
  className = "",
}: CardProps) {
  return (
    <article className={["mm-card", className].filter(Boolean).join(" ")}>
      {(icon || title || description) && (
        <header className="mm-card__header">
          {icon && <div className="mm-card__icon-wrap">{icon}</div>}
          {title && <h3 className="mm-card__title">{title}</h3>}
          {description && <p className="mm-card__description">{description}</p>}
        </header>
      )}
      {children && <div className="mm-card__body">{children}</div>}
      {actions && <footer className="mm-card__actions">{actions}</footer>}
    </article>
  );
}
