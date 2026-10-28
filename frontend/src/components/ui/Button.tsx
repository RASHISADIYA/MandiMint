import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./button.css";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  leadingIcon?: ReactNode;
}

export function Button({
  variant = "primary",
  loading = false,
  leadingIcon,
  className = "",
  disabled,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={[
        "mm-btn",
        `mm-btn--${variant}`,
        loading ? "mm-btn--loading" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className="mm-btn__spinner" aria-hidden="true" />
      ) : (
        leadingIcon && <span className="mm-btn__icon">{leadingIcon}</span>
      )}
      <span aria-hidden={loading ? true : undefined}>{children}</span>
    </button>
  );
}
