import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Flame,
  Globe,
  Leaf,
  Mail,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ErrorBanner } from "../components/ui/ErrorBanner";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";
import { EmailOtpAuthPanel } from "../components/auth/EmailOtpAuthPanel";
import { useWeb3Wallet, MST_NETWORKS } from "../providers/Web3WalletContext";
import { useAuthoritativeRole } from "../hooks/useAuthoritativeRole";
import "./auth.css";

export function AuthPage() {
  const web3 = useWeb3Wallet();
  const {
    connected,
    address,
    selectedNetworkConfig,
    isConnecting,
    error,
    connectBridgeKey,
    connectInjected,
  } = web3;
  const { role } = useAuthoritativeRole(connected);

  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [showExternal, setShowExternal] = useState(false);
  const [externalError, setExternalError] = useState<string | null>(null);

  // If already connected with a wallet, route to role dashboard or onboarding
  if (connected && address) {
    if (role === "farmer") {
      return <Navigate to="/app/farmer" replace />;
    }
    if (role === "fpo_admin") {
      return <Navigate to="/app/manager" replace />;
    }
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <section className="mm-auth mm-container" aria-labelledby="auth-title">
      <div className="mm-auth__grid">
        <div className="mm-auth__intro">
          <p className="mm-auth__eyebrow">
            <Leaf size={14} aria-hidden="true" />
            Agricultural Supply Chain Traceability
          </p>
          <h1 id="auth-title" className="mm-auth__title">
            Sign In to MandiMint
          </h1>
          <p className="mm-auth__lead">
            Sign in with Google to create or access your secure embedded Web3 wallet.
            Seamlessly manage crop batches, verify produce allocations, and record
            tamper-evident deliveries on MST Blockchain.
          </p>

          <div className="mm-auth__aside">
            <ul className="mm-auth__points">
              <li>
                <Wallet aria-hidden="true" />
                <span>
                  <strong>Automatic Embedded EVM Wallet</strong>
                  Created automatically upon signing in. No browser extensions,
                  seed phrases, or private key management needed.
                </span>
              </li>
              <li>
                <ShieldCheck aria-hidden="true" />
                <span>
                  <strong>On-Chain Cryptographic Proofs</strong>
                  Produce conservation and whole-kg allocations are strictly
                  verified by MandiMint smart contracts.
                </span>
              </li>
              <li>
                <Globe aria-hidden="true" />
                <span>
                  <strong>Public Transparency</strong>
                  All recorded batches can be independently inspected by buyers,
                  auditors, and export boards on MSTScan.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mm-auth__card">
          <div
            className="mm-auth__panel"
            style={{
              padding: "2rem",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-borders)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--color-agricultural-green)",
                }}
              >
                Step 1: Sign In
              </span>
              <StatusBadge
                variant={
                  selectedNetworkConfig.id === "mstTestnet"
                    ? "success"
                    : "neutral"
                }
              >
                {selectedNetworkConfig.name} ({selectedNetworkConfig.chainId})
              </StatusBadge>
            </div>

            <h2
              className="mm-auth__panel-title"
              style={{
                fontSize: "1.4rem",
                marginBottom: "0.5rem",
                color: "var(--color-primary-text)",
              }}
            >
              Welcome to MandiMint
            </h2>

            <p
              className="mm-auth__panel-lead"
              style={{
                fontSize: "0.9rem",
                color: "var(--color-secondary-text)",
                marginBottom: "1.5rem",
                lineHeight: 1.5,
              }}
            >
              Sign in to automatically create or access your embedded EVM wallet.
              Immediately after sign-in, you will proceed to Step 2 to select your role.
            </p>

            {/* In-Flight Connecting / Wallet Creation State */}
            {isConnecting && (
              <div
                style={{
                  padding: "0.85rem",
                  marginBottom: "1.25rem",
                  background: "var(--color-background)",
                  border: "1px solid var(--color-borders)",
                  borderRadius: "var(--radius-md)",
                  textAlign: "center",
                }}
              >
                <StatusBadge variant="pending">
                  Setting up your embedded wallet…
                </StatusBadge>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div style={{ marginBottom: "1.25rem" }}>
                <ErrorBanner message={error} />
              </div>
            )}

            {/* Primary Action: Continue with Google */}
            <div style={{ marginBottom: "1rem" }}>
              <GoogleSignInButton showStatusBadge disabled={isConnecting} />
            </div>

            {/* Secondary Option: Email OTP */}
            <div style={{ marginTop: "1rem" }}>
              <button
                type="button"
                onClick={() => setShowEmailOtp((prev) => !prev)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "0.4rem 0",
                  fontSize: "0.85rem",
                  color: "var(--color-agricultural-green)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontWeight: 600,
                }}
              >
                <Mail size={14} />
                <span>{showEmailOtp ? "Hide email sign-in" : "Or sign in with email OTP"}</span>
                {showEmailOtp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showEmailOtp && (
                <div
                  style={{
                    marginTop: "0.75rem",
                    padding: "1rem",
                    background: "var(--color-background)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-borders)",
                  }}
                >
                  <EmailOtpAuthPanel disabled={isConnecting} />
                </div>
              )}
            </div>

            {/* Preserved External Web3 Wallet Fallback */}
            <div style={{ marginTop: "1rem", borderTop: "1px solid var(--color-borders)", paddingTop: "1rem" }}>
              <button
                type="button"
                onClick={() => setShowExternal((prev) => !prev)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "0.3rem 0",
                  fontSize: "0.8rem",
                  color: "var(--color-secondary-text)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <span>Looking to connect a browser extension (BridgeKey / MetaMask)?</span>
                {showExternal ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {showExternal && (
                <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {externalError && <ErrorBanner message={externalError} />}
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="mm-btn mm-btn--secondary"
                      style={{ fontSize: "0.8rem", padding: "0.45rem 0.8rem" }}
                      disabled={isConnecting}
                      onClick={async () => {
                        setExternalError(null);
                        try {
                          await connectBridgeKey();
                        } catch (err) {
                          setExternalError(
                            err instanceof Error ? err.message : "Failed to connect BridgeKey."
                          );
                        }
                      }}
                    >
                      Connect BridgeKey
                    </button>
                    <button
                      type="button"
                      className="mm-btn mm-btn--secondary"
                      style={{ fontSize: "0.8rem", padding: "0.45rem 0.8rem" }}
                      disabled={isConnecting}
                      onClick={async () => {
                        setExternalError(null);
                        try {
                          await connectInjected();
                        } catch (err) {
                          setExternalError(
                            err instanceof Error ? err.message : "Failed to connect MetaMask."
                          );
                        }
                      }}
                    >
                      Connect Browser Web3 / MetaMask
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Faucet Link */}
            <div
              style={{
                marginTop: "1.5rem",
                padding: "0.85rem",
                background: "var(--color-background)",
                border: "1px solid var(--color-borders)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.825rem",
                color: "var(--color-secondary-text)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Need testnet coins?</span>
                <a
                  href={MST_NETWORKS.testnet.faucetUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--color-warning)",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <Flame size={13} /> Claim Free tMSTC <ExternalLink size={11} />
                </a>
              </div>
            </div>

            {/* Batch Explorer Link */}
            <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
              <Link
                to="/app/batches"
                style={{
                  fontSize: "0.85rem",
                  color: "var(--color-agricultural-green)",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                Browse verified crop batches without connecting →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
