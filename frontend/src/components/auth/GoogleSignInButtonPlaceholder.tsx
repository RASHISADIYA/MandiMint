import { useCallback, useState } from "react";
import { GoogleMark } from "../icons/GoogleMark";
import { Button } from "../ui/Button";
import { ErrorBanner } from "../ui/ErrorBanner";
import { StatusBadge } from "../ui/StatusBadge";
import "./google-sign-in.css";

const NOT_CONFIGURED_MESSAGE =
  "Authentication is not configured. Set VITE_PRIVY_APP_ID in frontend/.env.local (see frontend/.env.example and README).";

export interface GoogleSignInButtonPlaceholderProps {
  className?: string;
  showStatusBadge?: boolean;
}

export function GoogleSignInButtonPlaceholder({
  className = "",
  showStatusBadge = true,
}: GoogleSignInButtonPlaceholderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(() => {
    setError(null);
    setLoading(true);
    setLoading(false);
    setError(NOT_CONFIGURED_MESSAGE);
  }, []);

  return (
    <div className={["mm-google-sign-in", className].filter(Boolean).join(" ")}>
      {showStatusBadge && (
        <StatusBadge variant="warning">Privy setup required</StatusBadge>
      )}
      <Button
        type="button"
        variant="secondary"
        className="mm-google-sign-in__btn"
        leadingIcon={<GoogleMark />}
        loading={loading}
        onClick={handleClick}
        aria-describedby="google-sign-in-setup-hint"
      >
        Continue with Google
      </Button>
      <p id="google-sign-in-setup-hint" className="mm-google-sign-in__hint">
        Google sign-in uses Privy when <code>VITE_PRIVY_APP_ID</code> is set. No
        sessions are simulated without it.
      </p>
      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => {
            setError(null);
            handleClick();
          }}
        />
      )}
    </div>
  );
}
