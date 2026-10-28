import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MinusCircle,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import "./status-badge.css";

export type StatusBadgeVariant =
  | "success"
  | "pending"
  | "warning"
  | "error"
  | "neutral";

const ICONS: Record<StatusBadgeVariant, LucideIcon> = {
  success: CheckCircle2,
  pending: Clock,
  warning: AlertTriangle,
  error: AlertCircle,
  neutral: MinusCircle,
};

export interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  children: ReactNode;
}

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  const Icon = ICONS[variant];

  return (
    <span className={`mm-badge mm-badge--${variant}`}>
      <Icon aria-hidden="true" />
      {children}
    </span>
  );
}
