import { KeyRound, ShieldCheck, Smartphone } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { PhoneOtpAuthPanel } from "../components/auth/PhoneOtpAuthPanel";
import { StatusBadge } from "../components/ui/StatusBadge";
import { isPrivyConfigured } from "../config/env";
import "./auth.css";

function AuthPageShell({
  children,
  aside,
}: {
  children: ReactNode;
  aside: ReactNode;
}) {
  return (
    <section className="mm-auth mm-container" aria-labelledby="auth-title">
      <div className="mm-auth__grid">
        <div className="mm-auth__intro">
          <p className="mm-auth__eyebrow">
            <ShieldCheck size={14} aria-hidden="true" />
            Phone-first access
          </p>
          <h1 id="auth-title" className="mm-auth__title">
            Sign in to your MandiMint workspace
          </h1>
          <p className="mm-auth__lead">
            After sign-in you will set up your embedded wallet, verify MST Testnet,
            and load your server-assigned role when a role backend is configured, or
            choose a clearly labelled local workspace role otherwise. A local role
            does not grant FPO manager privileges; batch writes stay on-chain gated.
          </p>
          <div className="mm-auth__aside">{aside}</div>
        </div>
        <div className="mm-auth__card">{children}</div>
      </div>
    </section>
  );
}

function AuthAside() {
  return (
    <ul className="mm-auth__points">
      <li>
        <Smartphone aria-hidden="true" />
        <span>
          <strong>Phone verification</strong>
          A one-time SMS code confirms control of your number.
        </span>
      </li>
      <li>
        <KeyRound aria-hidden="true" />
        <span>
          <strong>Onboarding comes next</strong>
          Wallet, network, and role checks happen on the setup screen.
        </span>
      </li>
      <li>
        <ShieldCheck aria-hidden="true" />
        <span>
          <strong>Only records are public</strong>
          Wallet addresses and crop records go on-chain—not your phone number.
        </span>
      </li>
    </ul>
  );
}

function ConfiguredAuthPage() {
  const { ready, authenticated } = usePrivy();

  if (ready && authenticated) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!ready) {
    return (
      <AuthPageShell aside={<AuthAside />}>
        <StatusBadge variant="pending">Restoring secure session…</StatusBadge>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell aside={<AuthAside />}>
      <PhoneOtpAuthPanel />
    </AuthPageShell>
  );
}

function UnconfiguredAuthPage() {
  return (
    <AuthPageShell aside={<AuthAside />}>
      <div className="mm-auth__panel">
        <StatusBadge variant="warning">Authentication not configured</StatusBadge>
        <h2 className="mm-auth__panel-title">Connect Privy to enable real SMS OTP</h2>
        <p className="mm-auth__panel-lead">
          Add <code>VITE_PRIVY_APP_ID</code> to{" "}
          <code>frontend/.env.local</code>, enable SMS in the Privy dashboard, and
          configure a supported SMS provider. There is no simulated sign-in or OTP.
        </p>
        <div className="mm-auth__config">
          <code>VITE_PRIVY_APP_ID=...</code>
          <code>VITE_MST_TESTNET_CHAIN_ID=...</code>
          <code>VITE_MST_TESTNET_RPC_URL=...</code>
          <code>VITE_MANDIMINT_API_BASE_URL=...</code>
          <code>VITE_MANDIMINT_CONTRACT_ADDRESS=...</code>
        </div>
        <p className="mm-auth__panel-note">
          Privy’s standard international SMS coverage does not include India (+91);
          production use requires an eligible plan with BYO Twilio or another
          supported provider.
        </p>
      </div>
    </AuthPageShell>
  );
}

export function AuthPage() {
  return isPrivyConfigured() ? <ConfiguredAuthPage /> : <UnconfiguredAuthPage />;
}
