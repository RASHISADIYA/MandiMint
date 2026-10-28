import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";
import "./error-banner.css";

export interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  actions?: ReactNode;
}

export function ErrorBanner({
  message,
  onRetry,
  retryLabel = "Try again",
  actions,
}: ErrorBannerProps) {
  return (
    <div className="mm-error-banner" role="alert">
      <AlertCircle className="mm-error-banner__icon" aria-hidden="true" />
      <div className="mm-error-banner__body">
        <p className="mm-error-banner__message">{message}</p>
      </div>
      {(onRetry || actions) && (
        <div className="mm-error-banner__actions">
          {onRetry && (
            <Button variant="outline" type="button" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}
