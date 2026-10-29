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
            Sign in with Google to create or access your secure embedded Web3 wallet,
            or connect your existing BridgeKey / MetaMask wallet to record batches and
            verify crop allocations on MST Blockchain.
          </p>

          <div className="mm-auth__aside">
            <ul className="mm-auth__points">
              <li>
                <Wallet aria-hidden="true" />
                <span>
                  <strong>Flexible Wallet Options</strong>
                  Sign in with Google or Email for an automatic embedded EVM wallet,
                  or connect your existing BridgeKey / MetaMask extension wallet.
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
          <div className="mm-auth__card-header">
            <span className="mm-auth__step-badge">
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

          <h2 className="mm-auth__panel-title">
            Welcome to MandiMint
          </h2>

          <p className="mm-auth__panel-lead">
            Sign in with your Google account to create or access your embedded wallet,
            or connect an existing Web3 wallet below.
          </p>

          {/* Error Display */}
          {error && (
            <div style={{ marginBottom: "1.25rem" }}>
              <ErrorBanner message={error} />
            </div>
          )}

          {/* Primary Action: Continue with Google */}
          <div className="mm-auth__google-wrap">
            <GoogleSignInButton showStatusBadge disabled={isConnecting} />
          </div>

          {/* Alternative: Email OTP Toggle */}
          <div className="mm-auth__email-wrap">
            <button
              type="button"
              className="mm-auth__email-toggle"
              onClick={() => setShowEmailOtp((prev) => !prev)}
            >
              <Mail size={15} />
              <span>{showEmailOtp ? "Hide email code sign-in" : "Or sign in with email code (OTP)"}</span>
              {showEmailOtp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showEmailOtp && (
              <div className="mm-auth__email-panel">
                <EmailOtpAuthPanel disabled={isConnecting} />
              </div>
            )}
          </div>

          {/* Prominent Section: Connect Existing Web3 Wallet */}
          <div className="mm-auth__divider-wrap">
            <div className="mm-auth__divider-line" />
            <span className="mm-auth__divider-pill">
              Or Connect Existing Wallet
            </span>
          </div>

          {externalError && (
            <div style={{ marginBottom: "0.85rem" }}>
              <ErrorBanner message={externalError} />
            </div>
          )}

          <div className="mm-auth__wallet-options">
            {/* BridgeKey Official Extension */}
            <button
              type="button"
              className="mm-auth__wallet-card"
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
              <div className="mm-auth__wallet-left">
                <div className="mm-auth__wallet-icon">🌉</div>
                <div className="mm-auth__wallet-meta">
                  <div className="mm-auth__wallet-title">
                    BridgeKey Wallet
                    <span className="mm-tag mm-tag--gold" style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem" }}>
                      Official MST
                    </span>
                  </div>
                  <div className="mm-auth__wallet-desc">
                    MST Blockchain official non-custodial extension
                  </div>
                </div>
              </div>
              <span className="mm-auth__wallet-arrow">→</span>
            </button>

            {/* Browser Web3 / MetaMask */}
            <button
              type="button"
              className="mm-auth__wallet-card"
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
              <div className="mm-auth__wallet-left">
                <div className="mm-auth__wallet-icon">🦊</div>
                <div className="mm-auth__wallet-meta">
                  <div className="mm-auth__wallet-title">
                    Browser Web3 / MetaMask
                  </div>
                  <div className="mm-auth__wallet-desc">
                    Any EIP-1193 compatible browser extension
                  </div>
                </div>
              </div>
              <span className="mm-auth__wallet-arrow">→</span>
            </button>

            <div className="mm-auth__extension-link">
              <a
                href="https://chromewebstore.google.com/detail/bridgekey/bfjojdcfenehemjgjlepdjomkpginlkg"
                target="_blank"
                rel="noopener noreferrer"
              >
                Need BridgeKey extension? Install from Chrome Web Store <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* Utilities */}
          <div className="mm-auth__utilities">
            <div className="mm-auth__utility-box">
              <span>Need testnet coins?</span>
              <a
                href={MST_NETWORKS.testnet.faucetUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="mm-auth__utility-link"
                style={{ color: "var(--color-warning)" }}
              >
                <Flame size={13} /> Claim Free tMSTC <ExternalLink size={11} />
              </a>
            </div>

            <div className="mm-auth__utility-box">
              <span>Public verification:</span>
              <Link
                to="/app/batches"
                className="mm-auth__utility-link"
              >
                <Globe size={13} /> Browse Verified Batches →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
