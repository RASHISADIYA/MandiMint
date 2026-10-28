import { ArrowLeft, LockKeyhole, MessageSquareText } from "lucide-react";
import { useLoginWithSms, usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { formatAuthError } from "../../auth/oauthErrors";
import {
  formatPhoneNumber,
  normalizePhoneNumber,
} from "../../auth/phone";
import { isPrivyConfigured } from "../../config/env";
import { Button } from "../ui/Button";
import { ErrorBanner } from "../ui/ErrorBanner";
import { Input } from "../ui/Input";
import { StatusBadge } from "../ui/StatusBadge";
import "./phone-otp.css";

const RESEND_COOLDOWN_SECONDS = 30;

function formatSmsError(error: unknown): string {
  const message = formatAuthError(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("not enabled") ||
    normalized.includes("app config") ||
    normalized.includes("sms")
  ) {
    return `${message} Confirm SMS login and a supported SMS provider are enabled in the Privy dashboard.`;
  }

  return message;
}

interface PhoneOtpFormProps {
  disabled?: boolean;
}

function PhoneOtpFormPrivy({ disabled = false }: PhoneOtpFormProps) {
  const navigate = useNavigate();
  const { ready, authenticated } = usePrivy();
  const [phoneInput, setPhoneInput] = useState("+91 ");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const { sendCode, loginWithCode } = useLoginWithSms({
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

  const sendCodeToPhone = useCallback(async () => {
    const normalized = normalizePhoneNumber(phoneInput);
    if (!normalized) {
      setError(
        "Enter a valid phone number. Use a 10-digit Indian number or include a country code beginning with +.",
      );
      return;
    }

    setSending(true);
    setError(null);
    try {
      await sendCode({ phoneNumber: normalized });
      setSentTo(normalized);
      setStep("code");
      setCode("");
      setResendAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
    } catch (err) {
      setError(formatSmsError(err));
    } finally {
      setSending(false);
    }
  }, [phoneInput, sendCode]);

  const handleSendCode = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void sendCodeToPhone();
    },
    [sendCodeToPhone],
  );

  const handleVerify = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = code.trim();
      if (!/^\d{4,8}$/.test(trimmed)) {
        setError("Enter the one-time code from the SMS message.");
        return;
      }

      setVerifying(true);
      setError(null);
      try {
        await loginWithCode({ code: trimmed });
      } catch (err) {
        setError(
          `${formatSmsError(
            err,
          )} Check the code, or request a new one if it has expired.`,
        );
      } finally {
        setVerifying(false);
      }
    },
    [code, loginWithCode],
  );

  const handleChangePhone = useCallback(() => {
    setStep("phone");
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
        <StatusBadge variant="success">Phone verified</StatusBadge>
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
      {step === "phone" ? (
        <form onSubmit={handleSendCode} className="mm-phone-auth__form">
          <div className="mm-phone-auth__heading">
            <span className="mm-phone-auth__icon" aria-hidden="true">
              <MessageSquareText />
            </span>
            <div>
              <h3 className="mm-phone-auth__title">Sign in with your phone</h3>
              <p className="mm-phone-auth__note">
                We send a one-time code by SMS. No password is stored by MandiMint.
              </p>
            </div>
          </div>

          <Input
            label="Phone number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            hint="Indian 10-digit numbers are prefixed with +91. Include + for another country."
            value={phoneInput}
            onChange={(event) => setPhoneInput(event.target.value)}
            disabled={disabled || sending}
            required
          />

          <Button
            type="submit"
            loading={sending}
            disabled={disabled || sending}
            className="mm-phone-auth__submit"
          >
            Send SMS code
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="mm-phone-auth__form">
          <div className="mm-phone-auth__heading">
            <span className="mm-phone-auth__icon" aria-hidden="true">
              <LockKeyhole />
            </span>
            <div>
              <h3 className="mm-phone-auth__title">Enter the SMS code</h3>
              <p className="mm-phone-auth__note">
                Sent to {formatPhoneNumber(sentTo)}. The code expires after a short
                period.
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
              onClick={handleChangePhone}
              disabled={verifying}
            >
              Change number
            </Button>
            <Button
              type="button"
              variant="outline"
              loading={sending}
              disabled={verifying || sending || secondsRemaining > 0}
              onClick={() => void sendCodeToPhone()}
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
        Your phone number is used for login and is not written to the blockchain.
        Only wallet addresses and crop records are public on-chain.
      </p>
    </div>
  );
}

export function PhoneOtpAuthPanel(props: PhoneOtpFormProps) {
  if (!isPrivyConfigured()) {
    return (
      <div className="mm-phone-auth">
        <StatusBadge variant="warning">Privy setup required</StatusBadge>
        <div className="mm-phone-auth__heading">
          <span className="mm-phone-auth__icon" aria-hidden="true">
            <MessageSquareText />
          </span>
          <div>
            <h3 className="mm-phone-auth__title">SMS sign-in is not configured</h3>
            <p className="mm-phone-auth__note">
              Set <code>VITE_PRIVY_APP_ID</code>, enable SMS login, and configure an
              SMS provider in the Privy dashboard. MandiMint does not simulate OTPs.
            </p>
          </div>
        </div>
        <Button type="button" disabled>
          Send SMS code
        </Button>
        <p className="mm-phone-auth__privacy">
          For India (+91), Privy’s out-of-the-box SMS requires an eligible plan; BYO
          Twilio is available on Scale and Enterprise plans. Verify provider coverage
          before production.
        </p>
      </div>
    );
  }

  return <PhoneOtpFormPrivy {...props} />;
}
