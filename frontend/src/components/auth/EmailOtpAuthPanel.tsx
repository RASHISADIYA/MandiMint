import { ArrowLeft, LockKeyhole, Mail } from "lucide-react";
import { useLoginWithEmail, usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { formatAuthError } from "../../auth/oauthErrors";
import { isPrivyConfigured } from "../../config/env";
import { Button } from "../ui/Button";
import { ErrorBanner } from "../ui/ErrorBanner";
import { Input } from "../ui/Input";
import { StatusBadge } from "../ui/StatusBadge";
import "./phone-otp.css";

const RESEND_COOLDOWN_SECONDS = 30;

function formatEmailError(error: unknown): string {
  const message = formatAuthError(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("not enabled") ||
    normalized.includes("app config") ||
    normalized.includes("email")
  ) {
    return `${message} Confirm email login is enabled in the Privy dashboard.`;
  }

  return message;
}

interface EmailOtpFormProps {
  disabled?: boolean;
}

function EmailOtpFormPrivy({ disabled = false }: EmailOtpFormProps) {
  const navigate = useNavigate();
  const { ready, authenticated } = usePrivy();
  const [emailInput, setEmailInput] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const { sendCode, loginWithCode } = useLoginWithEmail({
    onComplete: () => {
      navigate("/onboarding", { replace: true });
    },
  });

  useEffect(() => {
    if (!resendAt) {
      setSecondsRemaining(0);
      return;
    }

    const tick = () => {
      setSecondsRemaining(
        Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)),
      );
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [resendAt]);

  const sendCodeToEmail = useCallback(async () => {
    const normalized = emailInput.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError("Enter a valid email address.");
      return;
    }

    setSending(true);
    setError(null);
    try {
      await sendCode({ email: normalized });
      setSentTo(normalized);
      setStep("code");
      setCode("");
      setResendAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
    } catch (err) {
      setError(formatEmailError(err));
    } finally {
      setSending(false);
    }
  }, [emailInput, sendCode]);

  const handleSendCode = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void sendCodeToEmail();
    },
    [sendCodeToEmail],
  );

  const handleVerify = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = code.trim();
      if (!/^\d{4,8}$/.test(trimmed)) {
        setError("Enter the one-time code from the email message.");
        return;
      }

      setVerifying(true);
      setError(null);
      try {
        await loginWithCode({ code: trimmed });
      } catch (err) {
        setError(
          `${formatEmailError(
            err,
          )} Check the code, or request a new one if it has expired.`,
        );
      } finally {
        setVerifying(false);
      }
    },
    [code, loginWithCode],
  );

  const handleChangeEmail = useCallback(() => {
    setStep("email");
    setCode("");
    setError(null);
    setSentTo(null);
    setResendAt(null);
  }, []);

  if (!ready) {
    return (
      <div className="mm-phone-auth" role="status" aria-live="polite">
        <StatusBadge variant="pending">Restoring session…</StatusBadge>
      </div>
    );
  }

  if (authenticated) {
    return (
      <div className="mm-phone-auth">
        <StatusBadge variant="success">Email verified</StatusBadge>
        <p className="mm-phone-auth__note">
          Your secure session is active. Continue to the workspace to set up your
          embedded wallet.
        </p>
        <Button type="button" onClick={() => navigate("/onboarding", { replace: true })}>
          Continue setup
        </Button>
      </div>
    );
  }

  return (
    <div className="mm-phone-auth">
      {step === "email" ? (
        <form onSubmit={handleSendCode} className="mm-phone-auth__form">
          <div className="mm-phone-auth__heading">
            <span className="mm-phone-auth__icon" aria-hidden="true">
              <Mail />
            </span>
            <div>
              <h3 className="mm-phone-auth__title">Sign in with your email</h3>
              <p className="mm-phone-auth__note">
                We send a one-time code by email. No password is stored by
                MandiMint.
              </p>
            </div>
          </div>

          <Input
            label="Email address"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={emailInput}
            onChange={(event) => setEmailInput(event.target.value)}
            disabled={disabled || sending}
            required
          />

          <Button
            type="submit"
            loading={sending}
            disabled={disabled || sending}
            className="mm-phone-auth__submit"
          >
            Send email code
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="mm-phone-auth__form">
          <div className="mm-phone-auth__heading">
            <span className="mm-phone-auth__icon" aria-hidden="true">
              <LockKeyhole />
            </span>
            <div>
              <h3 className="mm-phone-auth__title">Enter the email code</h3>
              <p className="mm-phone-auth__note">
                Sent to {sentTo}. The code expires after a short period.
              </p>
            </div>
          </div>

          <Input
            label="One-time code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={8}
            placeholder="6-digit code"
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 8))
            }
            disabled={disabled || verifying}
            required
          />

          <Button
            type="submit"
            loading={verifying}
            disabled={disabled || verifying || code.length < 4}
            className="mm-phone-auth__submit"
          >
            Verify code
          </Button>

          <div className="mm-phone-auth__secondary-actions">
            <Button
              type="button"
              variant="ghost"
              leadingIcon={<ArrowLeft size={16} aria-hidden="true" />}
              onClick={handleChangeEmail}
              disabled={verifying}
            >
              Change email
            </Button>
            <Button
              type="button"
              variant="outline"
              loading={sending}
              disabled={verifying || sending || secondsRemaining > 0}
              onClick={() => void sendCodeToEmail()}
            >
              {secondsRemaining > 0
                ? `Resend in ${secondsRemaining}s`
                : "Resend code"}
            </Button>
          </div>
        </form>
      )}

      {error && <ErrorBanner message={error} />}

      <p className="mm-phone-auth__privacy">
        Your email address is used for login and is not written to the blockchain.
        Only wallet addresses and crop records are public on-chain.
      </p>
    </div>
  );
}

export function EmailOtpAuthPanel(props: EmailOtpFormProps) {
  if (!isPrivyConfigured()) {
    return (
      <div className="mm-phone-auth">
        <StatusBadge variant="warning">Privy setup required</StatusBadge>
        <div className="mm-phone-auth__heading">
          <span className="mm-phone-auth__icon" aria-hidden="true">
            <Mail />
          </span>
          <div>
            <h3 className="mm-phone-auth__title">Email sign-in is not configured</h3>
            <p className="mm-phone-auth__note">
              Set <code>VITE_PRIVY_APP_ID</code>, enable email login in the Privy
              dashboard. MandiMint does not simulate OTPs.
            </p>
          </div>
        </div>
        <Button type="button" disabled>
          Send email code
        </Button>
      </div>
    );
  }

  return <EmailOtpFormPrivy {...props} />;
}