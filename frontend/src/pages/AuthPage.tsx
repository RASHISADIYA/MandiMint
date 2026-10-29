import {
  ExternalLink,
  Flame,
  Globe,
  Leaf,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Navigate, Link } from "react-router-dom";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ConnectWalletButton } from "../components/wallet/ConnectWalletButton";
import { useWeb3Wallet, MST_NETWORKS } from "../providers/Web3WalletContext";
import { useAuthoritativeRole } from "../hooks/useAuthoritativeRole";
import "./auth.css";

export function AuthPage() {
  const web3 = useWeb3Wallet();
  const { connected, address, selectedNetworkConfig } = web3;
  const { role } = useAuthoritativeRole(connected);

  // If already connected, route to role dashboard or onboarding
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
            Sign In / Connect Wallet
          </h1>
          <p className="mm-auth__lead">
            Connect your Web3 wallet to manage agricultural crop batches, verify
            farmer delivery allocations, and audit tamper-evident records on MST Blockchain.
          </p>

          <div className="mm-auth__aside">
            <ul className="mm-auth__points">
              <li>
                <Wallet aria-hidden="true" />
                <span>
                  <strong>Non-Custodial Web3 Access</strong>
                  Connect using BridgeKey, MetaMask, or any standard EIP-1193 browser extension.
                </span>
              </li>
              <li>
                <ShieldCheck aria-hidden="true" />
                <span>
                  <strong>On-Chain Cryptographic Proofs</strong>
                  Produce conservation and whole-kg allocations are strictly verified on the smart contract.
                </span>
              </li>
              <li>
                <Globe aria-hidden="true" />
                <span>
                  <strong>Public Transparency</strong>
                  All recorded batches can be independently inspected by buyers, auditors, and export boards on MSTScan.
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--color-agricultural-green)",
                }}
              >
                Step 1: Connect Wallet
              </span>
              <StatusBadge variant={selectedNetworkConfig.id === "mstTestnet" ? "success" : "neutral"}>
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
              Sign In With Your Wallet
            </h2>

            <p
              className="mm-auth__panel-lead"
              style={{
                fontSize: "0.9rem",
                color: "var(--color-secondary-text)",
                marginBottom: "1.75rem",
                lineHeight: 1.5,
              }}
            >
              Click below to connect your wallet. Immediately after connecting,
              you will proceed to Step 2 to select your role (Farmer or FPO Manager).
            </p>

            {/* Single Primary Action */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <ConnectWalletButton variant="primary" />
            </div>

            <div
              style={{
                marginTop: "1.75rem",
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
