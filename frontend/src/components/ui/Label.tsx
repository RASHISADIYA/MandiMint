import type { LabelHTMLAttributes, ReactNode } from "react";
import "./label.css";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  hint?: ReactNode;
  required?: boolean;
}

export function Label({
  children,
  hint,
  required,
  className = "",
  ...rest
}: LabelProps) {
  return (
    <label className={["mm-label", className].filter(Boolean).join(" ")} {...rest}>
      {children}
      {required && (
        <span className="mm-label__required" aria-hidden="true">
          *
        </span>
      )}
      {required && <span className="visually-hidden"> (required)</span>}
      {hint && <span className="mm-label__hint">{hint}</span>}
    </label>
  );
}
