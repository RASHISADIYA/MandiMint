import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import "./empty-state.css";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="mm-empty">
      <div className="mm-empty__icon" aria-hidden="true">
        <Icon />
      </div>
      <h3 className="mm-empty__title">{title}</h3>
      <p className="mm-empty__text">{description}</p>
      {action}
    </div>
  );
}
