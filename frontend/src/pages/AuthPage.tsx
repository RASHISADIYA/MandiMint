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
          {/* Subtle agricultural background illustration */}
          <div className="mm-auth__intro-bg" aria-hidden="true">
            <svg viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="360" cy="70" r="28" stroke="#15803d" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.6" />
              <path d="M290 120L315 98L340 120V150H290V120Z" stroke="#15803d" strokeWidth="1.4" />
              <line x1="315" y1="98" x2="315" y2="150" stroke="#15803d" strokeWidth="1" strokeDasharray="2 2" />
              <path d="M345 108H365V150H345V108Z" stroke="#15803d" strokeWidth="1.4" />
              <path d="M345 108C345 100 365 100 365 108" stroke="#15803d" strokeWidth="1.4" />
              <path d="M80 180C160 140 280 150 440 180" stroke="#15803d" strokeWidth="1.4" />
              <path d="M40 210C180 170 320 190 470 230" stroke="#15803d" strokeWidth="1.2" strokeDasharray="5 3" />
              <path d="M140 175C142 160 148 145 145 130" stroke="#15803d" strokeWidth="1.3" />
              <ellipse cx="147" cy="133" rx="3" ry="7" transform="rotate(25 147 133)" stroke="#15803d" strokeWidth="1.1" />
              <ellipse cx="142" cy="142" rx="3" ry="7" transform="rotate(-25 142 142)" stroke="#15803d" strokeWidth="1.1" />
              <ellipse cx="149" cy="151" rx="3" ry="7" transform="rotate(25 149 151)" stroke="#15803d" strokeWidth="1.1" />
              <path d="M165 178C167 165 172 152 170 140" stroke="#15803d" strokeWidth="1.3" />
              <ellipse cx="172" cy="143" rx="2.8" ry="6" transform="rotate(25 172 143)" stroke="#15803d" strokeWidth="1.1" />
              <ellipse cx="167" cy="151" rx="2.8" ry="6" transform="rotate(-25 167 151)" stroke="#15803d" strokeWidth="1.1" />
              <circle cx="210" cy="80" r="1.5" fill="#15803d" />
              <circle cx="230" cy="80" r="1.5" fill="#15803d" />
              <circle cx="250" cy="80" r="1.5" fill="#15803d" />
              <circle cx="220" cy="95" r="1.5" fill="#15803d" />
              <circle cx="240" cy="95" r="1.5" fill="#15803d" />
            </svg>
          </div>

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
              <li className="mm-auth__point--wallet">
                <Wallet aria-hidden="true" />
                <span className="mm-auth__point-content">
                  <strong>Flexible Wallet Options</strong>
                  Sign in with Google or Email for an automatic embedded EVM wallet,
                  or connect your existing BridgeKey / MetaMask extension wallet.
                </span>
                {/* Subtle wallet/connection themed illustration */}
                <svg className="mm-auth__point-illus" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="25" y="10" width="65" height="42" rx="6" stroke="#15803d" strokeWidth="1.5" strokeDasharray="3 2" />
                  <line x1="25" y1="22" x2="90" y2="22" stroke="#15803d" strokeWidth="1.5" />
                  <rect x="33" y="28" width="12" height="8" rx="2" stroke="#15803d" strokeWidth="1.2" />
                  <rect x="15" y="24" width="85" height="56" rx="10" stroke="#15803d" strokeWidth="1.8" fill="#ffffff" fillOpacity="0.4" />
                  <path d="M72 44H95C97.5 44 99.5 46.5 99.5 49.5V54.5C99.5 57.5 97.5 60 95 60H72C69.5 60 67.5 57.5 67.5 54.5V49.5C67.5 46.5 69.5 44 72 44Z" stroke="#15803d" strokeWidth="1.5" fill="#ffffff" />
                  <circle cx="83" cy="52" r="3" fill="#15803d" />
                  <path d="M102 20C108 26 108 36 102 42" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M107 14C116 23 116 39 107 48" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M20 74C16 68 18 60 25 58C25 65 23 72 20 74Z" stroke="#15803d" strokeWidth="1.2" />
                  <path d="M14 62L16 66L20 64L16 62L14 62Z" fill="#15803d" />
                </svg>
              </li>
              <li className="mm-auth__point--security">
                <ShieldCheck aria-hidden="true" />
                <span className="mm-auth__point-content">
                  <strong>On-Chain Cryptographic Proofs</strong>
                  Produce conservation and whole-kg allocations are strictly
                  verified by MandiMint smart contracts.
                </span>
                {/* Subtle shield/security/blockchain themed illustration */}
                <svg className="mm-auth__point-illus" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="12" y="14" width="18" height="18" rx="4" stroke="#15803d" strokeWidth="1.3" />
                  <rect x="90" y="14" width="18" height="18" rx="4" stroke="#15803d" strokeWidth="1.3" />
                  <line x1="30" y1="23" x2="44" y2="23" stroke="#15803d" strokeWidth="1.2" strokeDasharray="2 2" />
                  <line x1="76" y1="23" x2="90" y2="23" stroke="#15803d" strokeWidth="1.2" strokeDasharray="2 2" />
                  <path d="M60 10C76 16 86 19 86 36C86 57 71 74 60 80C49 74 34 57 34 36C34 19 44 16 60 10Z" stroke="#15803d" strokeWidth="1.8" fill="#ffffff" fillOpacity="0.4" />
                  <path d="M60 17C72 22 79 24 79 37C79 53 68 66 60 72C52 66 41 53 41 37C41 24 48 22 60 17Z" stroke="#15803d" strokeWidth="1.2" strokeDasharray="3 2" />
                  <path d="M50 43L57 50L71 35" stroke="#15803d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M46 72C39 74 34 69 36 63C41 65 44 70 46 72Z" stroke="#15803d" strokeWidth="1.2" />
                  <path d="M74 72C81 74 86 69 84 63C79 65 76 70 74 72Z" stroke="#15803d" strokeWidth="1.2" />
                </svg>
              </li>
              <li className="mm-auth__point--transparency">
                <Globe aria-hidden="true" />
                <span className="mm-auth__point-content">
                  <strong>Public Transparency</strong>
                  All records, batch provenance, and conservation impact are
                  publicly verifiable on the MST blockchain.
                </span>
                {/* Subtle globe/network/transparency themed illustration */}
                <svg className="mm-auth__point-illus" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <circle cx="65" cy="45" r="32" stroke="#15803d" strokeWidth="1.8" fill="#ffffff" fillOpacity="0.3" />
                  <ellipse cx="65" cy="45" rx="16" ry="32" stroke="#15803d" strokeWidth="1.3" />
                  <line x1="33" y1="45" x2="97" y2="45" stroke="#15803d" strokeWidth="1.3" />
                  <path d="M38 30C46 34 84 34 92 30" stroke="#15803d" strokeWidth="1.1" strokeDasharray="3 2" />
                  <path d="M38 60C46 56 84 56 92 60" stroke="#15803d" strokeWidth="1.1" strokeDasharray="3 2" />
                  <ellipse cx="65" cy="45" rx="42" ry="18" stroke="#15803d" strokeWidth="1.2" transform="rotate(-20 65 45)" strokeDasharray="4 3" />
                  <circle cx="28" cy="55" r="4.5" fill="#ffffff" stroke="#15803d" strokeWidth="1.5" />
                  <circle cx="102" cy="35" r="4.5" fill="#ffffff" stroke="#15803d" strokeWidth="1.5" />
                  <circle cx="20" cy="30" r="3" stroke="#15803d" strokeWidth="1.2" />
                  <path d="M15 40C15 36 25 36 25 40" stroke="#15803d" strokeWidth="1.2" />
                  <circle cx="108" cy="62" r="3" stroke="#15803d" strokeWidth="1.2" />
                  <path d="M103 72C103 68 113 68 113 72" stroke="#15803d" strokeWidth="1.2" />
                </svg>
              </li>
            </ul>
          </div>
        </div>

        <div className="mm-auth__card">
          {/* Subtle agricultural watermark on right card */}
          <div className="mm-auth__card-watermark" aria-hidden="true">
            <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 140C70 110 110 90 150 80" stroke="#15803d" strokeWidth="1.2" strokeDasharray="3 3" />
              <path d="M60 150C85 125 120 110 155 105" stroke="#15803d" strokeWidth="1.2" />
              <ellipse cx="115" cy="95" rx="5" ry="12" transform="rotate(35 115 95)" stroke="#15803d" strokeWidth="1.2" />
              <ellipse cx="102" cy="108" rx="5" ry="12" transform="rotate(-25 102 108)" stroke="#15803d" strokeWidth="1.2" />
              <ellipse cx="130" cy="85" rx="5" ry="12" transform="rotate(40 130 85)" stroke="#15803d" strokeWidth="1.2" />
              <path d="M120 150H155V120L137.5 105L120 120V150Z" stroke="#15803d" strokeWidth="1.1" />
            </svg>
          </div>

          <div className="mm-auth__card-header">
            <span className="mm-auth__step-badge">
              Step 1: Sign In
            </span>
            <StatusBadge variant="success">
              <span
                style={{
                  display: "inline-block",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 6px rgba(16, 185, 129, 0.6)",
                  marginRight: "6px",
                  verticalAlign: "middle",
                }}
                aria-hidden="true"
              />
              {selectedNetworkConfig.name} (Chain ID: {selectedNetworkConfig.chainId})
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
                className="mm-auth__utility-link mm-auth__faucet-btn"
              >
                <Flame size={14} aria-hidden="true" />
                <span>Claim Free tMSTC</span>
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
