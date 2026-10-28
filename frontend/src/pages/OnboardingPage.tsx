import {
  CheckCircle2,
  Circle,
  LoaderCircle,
  Network,
  Shield,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AccountMenu } from "../components/account/AccountMenu";
import { RoleSelector } from "../components/auth/RoleSelector";
import { ErrorBanner } from "../components/ui/ErrorBanner";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Button } from "../components/ui/Button";
import { ROLE_LABELS } from "../auth/roles";
import { isPrivyConfigured } from "../config/env";
import { usePostLoginOnboarding } from "../hooks/usePostLoginOnboarding";
import { formatPhoneNumber } from "../auth/phone";
import { truncateAddress } from "../lib/format";
import "./onboarding.css";

function StepIcon({ done, active }: { done: boolean; active: boolean }) {
  if (done) {
    return <CheckCircle2 className="mm-onboarding-step__icon mm-onboarding-step__icon--done" />;
  }
  if (active) {
    return <LoaderCircle className="mm-onboarding-step__icon mm-onboarding-step__icon--active" />;
  }
  return <Circle className="mm-onboarding-step__icon" />;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const onboarding = usePostLoginOnboarding();
  const [copyStatus, setCopyStatus] = useState<"idle" | "ok" | "error">("idle");

  const {
    ready,
    authenticated,
    phase,
    isOnboardingComplete,
    dashboardPath,
    profile,
    displayName,
    walletAddress,
    walletError,
    networkError,
    networkVerification,
    role,
    roleMessage,
    roleStatus,
    canSelectLocalRole,
    selectLocalRole,
    retryWalletCreation,
    switchToMst,
    verifyNetwork,
    refreshRole,
    mstChain,
    mstConfigured,
  } = onboarding;

  useEffect(() => {
    if (isOnboardingComplete && dashboardPath) {
      navigate(dashboardPath, { replace: true });
    }
  }, [isOnboardingComplete, dashboardPath, navigate]);

  const handleCopyAddress = useCallback(async () => {
    if (!walletAddress) {
      return;
    }
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopyStatus("ok");
    } catch {
      setCopyStatus("error");
    }
  }, [walletAddress]);

  if (!isPrivyConfigured()) {
    return <Navigate to="/auth" replace />;
  }

  if (ready && !authenticated) {
    return <Navigate to="/auth" replace />;
  }

  const authDone = authenticated;
  const walletDone =
    phase === "network_pending" ||
    phase === "network_blocked" ||
    phase === "role_verifying" ||
    phase === "role_unassigned" ||
    phase === "role_error" ||
    phase === "role_unconfigured" ||
    phase === "complete";
  const networkDone = networkVerification.status === "connected";
  const roleDone = roleStatus === "verified";
  const needsLocalRole = canSelectLocalRole && !roleDone;

  return (
    <section className="mm-onboarding mm-container" aria-labelledby="onboarding-title">
      <header className="mm-onboarding__header">
        <div>
          <p className="mm-onboarding__eyebrow">
            <Shield size={14} aria-hidden="true" />
            Secure setup
          </p>
          <h1 id="onboarding-title" className="mm-onboarding__title">
            Set up your MandiMint account
          </h1>
          <p className="mm-onboarding__lead">
            We restore your embedded wallet, verify MST Testnet, then load your
            role. A configured backend is always authoritative; without one, you can
            choose a clearly labelled local workspace role. Dashboard access requires
            all steps—sign-in alone is not enough.
          </p>
        </div>
        {authenticated && <AccountMenu compact />}
      </header>

      <ol className="mm-onboarding-steps" aria-label="Setup progress">
        <li className="mm-onboarding-step">
          <StepIcon done={authDone} active={phase === "session_restoring"} />
          <div>
            <h2 className="mm-onboarding-step__title">Authentication</h2>
            <p className="mm-onboarding-step__text">
              {profile?.phone
                ? `Signed in as ${formatPhoneNumber(profile.phone)}`
                : profile?.email
                  ? `Signed in as ${profile.email}`
                  : "Restoring secure session…"}
            </p>
          </div>
        </li>
        <li className="mm-onboarding-step">
          <StepIcon
            done={walletDone && Boolean(walletAddress)}
            active={phase === "wallet_pending" || phase === "wallet_creating"}
          />
          <div>
            <h2 className="mm-onboarding-step__title">Embedded wallet</h2>
            {phase === "wallet_pending" && !walletAddress && (
              <p className="mm-onboarding-step__text">
                Checking for an existing Privy wallet tied to your account. A new
                wallet is created only if the provider confirms one is required.
              </p>
            )}
            {phase === "wallet_creating" && (
              <StatusBadge variant="pending">Creating embedded wallet…</StatusBadge>
            )}
            {walletAddress && (
              <p className="mm-onboarding-step__text">
                Wallet{" "}
                <code>{truncateAddress(walletAddress, 6, 4)}</code>
                <Button type="button" variant="ghost" onClick={() => void handleCopyAddress()}>
                  Copy address
                </Button>
              </p>
            )}
            {copyStatus === "ok" && (
              <p className="mm-onboarding-step__text" role="status" aria-live="polite">
                Address copied to clipboard.
              </p>
            )}
            {copyStatus === "error" && (
              <p className="mm-onboarding-step__text" role="alert">
                Could not copy the address. Select and copy manually.
              </p>
            )}
            {phase === "wallet_failed" && (
              <ErrorBanner
                message={walletError ?? "Wallet setup failed."}
                onRetry={() => void retryWalletCreation()}
              />
            )}
          </div>
        </li>
        <li className="mm-onboarding-step">
          <StepIcon
            done={networkDone}
            active={phase === "network_pending" || phase === "network_blocked"}
          />
          <div>
            <h2 className="mm-onboarding-step__title">MST Testnet</h2>
            {!mstConfigured && (
              <ErrorBanner message="MST Testnet env vars are missing. Configure VITE_MST_TESTNET_CHAIN_ID and VITE_MST_TESTNET_RPC_URL with official values." />
            )}
            {mstConfigured && mstChain && (
              <p className="mm-onboarding-step__text">
                Expected chain ID {mstChain.id}. Status:{" "}
                {networkVerification.status === "connected"
                  ? "verified on wallet"
                  : networkVerification.status}
              </p>
            )}
            {networkVerification.status === "connected" && (
              <StatusBadge variant="success">
                <Network size={14} aria-hidden="true" />
                MST Testnet connected (verified)
              </StatusBadge>
            )}
            {phase === "network_blocked" && (
              <ErrorBanner
                message={
                  networkError ??
                  networkVerification.message ??
                  "Network verification failed."
                }
                onRetry={() => {
                  void switchToMst();
                  void verifyNetwork();
                }}
              />
            )}
          </div>
        </li>
        <li className="mm-onboarding-step">
          <StepIcon
            done={roleDone}
            active={phase === "role_verifying" || needsLocalRole}
          />
          <div>
            <h2 className="mm-onboarding-step__title">Workspace role</h2>
            {canSelectLocalRole && (
              <p className="mm-onboarding-step__text">
                No role backend is configured. Choose the workspace you need. This
                selection is stored on this device and is <strong>not</strong>{" "}
                server-verified; FPO batch writes still require on-chain manager
                authorization.
              </p>
            )}
            {canSelectLocalRole && (
              <RoleSelector
                value={role ?? "farmer"}
                onChange={selectLocalRole}
                legend="Choose local workspace role"
              />
            )}
            {canSelectLocalRole && role && (
              <StatusBadge variant="warning">
                {ROLE_LABELS[role]} · local only, not server-verified
              </StatusBadge>
            )}
            {phase === "role_verifying" && (
              <StatusBadge variant="pending">Verifying role with backend…</StatusBadge>
            )}
            {phase === "role_unconfigured" && !canSelectLocalRole && (
              <ErrorBanner message={roleMessage ?? "Role API not configured."} />
            )}
            {phase === "role_unassigned" && !canSelectLocalRole && (
              <>
                <ErrorBanner
                  message={
                    roleMessage ??
                    "No role assigned. Access to farmer or FPO manager dashboards is blocked."
                  }
                  onRetry={() => void refreshRole()}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/app/access-pending")}
                >
                  Open access pending page
                </Button>
              </>
            )}
            {phase === "role_error" && (
              <ErrorBanner
                message={roleMessage ?? "Could not verify your role."}
                onRetry={() => void refreshRole()}
              />
            )}
            {roleDone && displayName && (
              <p className="mm-onboarding-step__text">Welcome, {displayName}.</p>
            )}
          </div>
        </li>
      </ol>

      <aside className="mm-onboarding-aside" aria-label="Wallet notes">
        <Wallet aria-hidden="true" />
        <p>
          Wallet keys stay with Privy. MandiMint never stores private keys or sends
          transactions during onboarding.
        </p>
      </aside>
    </section>
  );
}
