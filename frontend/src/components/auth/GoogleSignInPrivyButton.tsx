import { useLoginWithOAuth, usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useState } from "react";
import { formatAuthError, isUserCancellation } from "../../auth/oauthErrors";
import { GoogleMark } from "../icons/GoogleMark";
import { Button } from "../ui/Button";
import { ErrorBanner } from "../ui/ErrorBanner";
import { StatusBadge } from "../ui/StatusBadge";
import type { LoginUiState } from "../../auth/types";
import "./google-sign-in.css";

export interface GoogleSignInPrivyButtonProps {
  className?: string;
  showStatusBadge?: boolean;
  disabled?: boolean;
}

export function GoogleSignInPrivyButton({
  className = "",
  showStatusBadge = false,
  disabled = false,
}: GoogleSignInPrivyButtonProps) {
  const { ready, authenticated } = usePrivy();
  const [loginUiState, setLoginUiState] = useState<LoginUiState>("signed_out");
  const [message, setMessage] = useState<string | null>(null);

  const { initOAuth, state } = useLoginWithOAuth({
    onComplete: () => {
      setLoginUiState("login_success");
      setMessage(null);
    },
    onError: (error) => {
      if (isUserCancellation(error)) {
        setLoginUiState("login_cancelled");
        setMessage("Sign-in was cancelled.");
      } else {
        setLoginUiState("login_failed");
        setMessage(formatAuthError(error) || "Google sign-in failed. Please try again.");
      }
    },
  });

  useEffect(() => {
    if (state.status === "loading") {
      setLoginUiState("login_in_progress");
    }
  }, [state.status]);

  const handleClick = useCallback(async () => {
    setMessage(null);
    setLoginUiState("login_in_progress");
    try {
      await initOAuth({ provider: "google" });
    } catch (error) {
      if (isUserCancellation(error)) {
        setLoginUiState("login_cancelled");
        setMessage("Sign-in was cancelled.");
      } else {
        setLoginUiState("login_failed");
        setMessage(formatAuthError(error) || "Google sign-in failed. Please try again.");
      }
    }
  }, [initOAuth]);

  const loading = loginUiState === "login_in_progress" || state.status === "loading";

  if (ready && authenticated) {
    return null;
  }

  if (!ready) {
    return (
      <div className={["mm-google-sign-in", className].filter(Boolean).join(" ")}>
        <StatusBadge variant="pending">Restoring session…</StatusBadge>
      </div>
    );
  }

  return (
    <div className={["mm-google-sign-in", className].filter(Boolean).join(" ")}>
      {showStatusBadge && loginUiState === "login_success" && (
        <StatusBadge variant="success">Signed in with Google</StatusBadge>
      )}
      {loginUiState === "login_cancelled" && (
        <StatusBadge variant="neutral">Sign-in cancelled</StatusBadge>
      )}
      <Button
        type="button"
        variant="secondary"
        className="mm-google-sign-in__btn"
        leadingIcon={<GoogleMark />}
        loading={loading}
        disabled={disabled || loading}
        onClick={() => void handleClick()}
      >
        Continue with Google
      </Button>
      {message && loginUiState !== "login_success" && (
        <ErrorBanner
          message={message}
          onRetry={() => {
            setMessage(null);
            void handleClick();
          }}
        />
      )}
    </div>
  );
}
