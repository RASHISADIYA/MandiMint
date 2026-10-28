import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { Label } from "./Label";
import "./input.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, required, id: idProp, className = "", ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="mm-field">
      <Label htmlFor={id} hint={hint} required={required}>
        {label}
      </Label>
      <input
        ref={ref}
        id={id}
        className={["mm-input", error ? "mm-input--error" : "", className]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        required={required}
        {...rest}
      />
      {error && (
        <p id={errorId} className="mm-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
