import {
  CheckCircle2,
  Info,
  Leaf,
  Sprout,
  Wallet,
  Warehouse,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useWeb3Wallet } from "../providers/Web3WalletContext";
import { useAuthoritativeRole } from "../hooks/useAuthoritativeRole";
import { getRoleForWallet, type MandiMintRole } from "../auth/roles";
import { truncateAddress } from "../lib/format";
import "./onboarding.css";

export function OnboardingPage() {
  const navigate = useNavigate();
  const { connected, address, isCorrectNetwork, networkName, balance, isTestnet, walletType } =
    useWeb3Wallet();

  const activeAddress = address ?? null;
  const initialSavedRole = getRoleForWallet(activeAddress);

  // State: initially null for first-time user unless previously saved
  const [selectedRole, setSelectedRole] = useState<MandiMintRole | null>(
    () => initialSavedRole,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { selectLocalRole } = useAuthoritativeRole(connected);

  const handleContinue = useCallback(() => {
    if (!selectedRole || !activeAddress) return;

    setIsSubmitting(true);
    try {
      // Save role bound to this wallet
      selectLocalRole(selectedRole);

      // Route to role-specific dashboard
      const target =
        selectedRole === "farmer" ? "/app/farmer" : "/app/manager";
      navigate(target, { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedRole, activeAddress, selectLocalRole, navigate]);

  // If not connected, show sign-in prompt
  if (!connected || !activeAddress) {
    return (
      <section className="mm-onboarding mm-container" aria-labelledby="onboarding-title">
        <div
          style={{
            maxWidth: "520px",
            margin: "3rem auto",
            padding: "2.5rem 2rem",
            background: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-borders)",
            boxShadow: "var(--shadow-sm)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              margin: "0 auto 1.25rem auto",
              background: "var(--color-soft-sage)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-deep-forest)",
            }}
          >
            <Wallet size={24} />
          </div>

          <h1 id="onboarding-title" style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "var(--color-primary-text)" }}>
            Sign In Required
          </h1>
          <p style={{ color: "var(--color-secondary-text)", fontSize: "0.9rem", marginBottom: "1.75rem", lineHeight: 1.5 }}>
            To select your role and access the MandiMint agricultural workspace,
            please sign in or connect your Web3 wallet.
          </p>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <Link to="/auth" className="mm-btn mm-btn--primary">
              Sign In →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mm-onboarding mm-container" aria-labelledby="onboarding-title">
      <div
        style={{
          maxWidth: "680px",
          margin: "2rem auto",
          background: "var(--color-surface)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-borders)",
          boxShadow: "var(--shadow-md)",
          overflow: "hidden",
        }}
      >
        {/* Header Banner */}
        <div
          style={{
            padding: "2rem 2.25rem 1.75rem 2.25rem",
            background: "linear-gradient(135deg, var(--color-warm-cream) 0%, #edf4ee 100%)",
            borderBottom: "1px solid var(--color-borders)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--color-agricultural-green)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Leaf size={14} /> Step 2: Role Selection
            </span>

            {/* Connected Wallet Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.3rem 0.65rem",
                background: "var(--color-clean-white)",
                border: "1px solid var(--color-borders)",
                borderRadius: "9999px",
                fontSize: "0.775rem",
                fontFamily: "monospace",
                color: "var(--color-primary-text)",
              }}
            >
              <span className="mm-status-dot mm-status-dot--green" />
              <span>{truncateAddress(activeAddress, 6, 4)}</span>
              <span style={{ fontSize: "0.7rem", color: "var(--color-secondary-text)", fontFamily: "sans-serif" }}>
                ({walletType === "privy" ? "Embedded Wallet" : "External Wallet"})
              </span>
            </div>
          </div>

          <h1
            id="onboarding-title"
            style={{
              fontSize: "1.75rem",
              color: "var(--color-primary-text)",
              marginBottom: "0.5rem",
              fontWeight: 700,
            }}
          >
            Select Your Workspace Role
          </h1>
          <p style={{ color: "var(--color-secondary-text)", fontSize: "0.925rem", margin: 0, lineHeight: 1.5 }}>
            Choose how you will participate in the agricultural supply chain.
            Your role customizes your dashboard, permissions, and available blockchain operations.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div style={{ padding: "2rem 2.25rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.25rem",
              marginBottom: "1.75rem",
            }}
          >
            {/* Role 1: Farmer */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelectedRole("farmer")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedRole("farmer");
                }
              }}
              style={{
                padding: "1.5rem",
                borderRadius: "var(--radius-lg)",
                border:
                  selectedRole === "farmer"
                    ? "2px solid var(--color-agricultural-green)"
                    : "1px solid var(--color-borders)",
                background:
                  selectedRole === "farmer"
                    ? "var(--color-success-bg)"
                    : "var(--color-clean-white)",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-soft-sage)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-deep-forest)",
                  }}
                >
                  <Sprout size={24} />
                </div>
                {selectedRole === "farmer" && (
                  <CheckCircle2 size={20} style={{ color: "var(--color-success)" }} />
                )}
              </div>

              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--color-primary-text)" }}>
                Farmer
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--color-secondary-text)", lineHeight: 1.5, margin: 0 }}>
                Review your verified on-chain crop deliveries, track commodity allocations,
                and inspect transparent mandi market receipts linked to your wallet.
              </p>
            </div>

            {/* Role 2: FPO Manager */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelectedRole("fpo_admin")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedRole("fpo_admin");
                }
              }}
              style={{
                padding: "1.5rem",
                borderRadius: "var(--radius-lg)",
                border:
                  selectedRole === "fpo_admin"
                    ? "2px solid var(--color-agricultural-green)"
                    : "1px solid var(--color-borders)",
                background:
                  selectedRole === "fpo_admin"
                    ? "var(--color-success-bg)"
                    : "var(--color-clean-white)",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-soft-sage)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-deep-forest)",
                  }}
                >
                  <Warehouse size={24} />
                </div>
                {selectedRole === "fpo_admin" && (
                  <CheckCircle2 size={20} style={{ color: "var(--color-success)" }} />
                )}
              </div>

              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--color-primary-text)" }}>
                FPO Manager
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--color-secondary-text)", lineHeight: 1.5, margin: 0 }}>
                Manage authorized agricultural operations, review relevant batches and allocations,
                and perform the management actions permitted by the system.
              </p>
            </div>
          </div>

          {/* Role Explanation & Honest Permission Notice */}
          {selectedRole === "fpo_admin" && (
            <div
              style={{
                padding: "0.85rem 1rem",
                background: "var(--color-warning-bg)",
                border: "1px solid var(--color-warning)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.825rem",
                color: "var(--color-primary-text)",
                marginBottom: "1.75rem",
                display: "flex",
                gap: "0.6rem",
                alignItems: "flex-start",
              }}
            >
              <Info size={16} style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong>Contract Authorization Notice:</strong> Selecting FPO Manager grants access
                to the management dashboard. Recording on-chain batches requires your wallet to be
                authorized by the contract owner via <code>setManager</code> on the MandiMint smart contract.
              </div>
            </div>
          )}

          {/* Primary Action Button: Continue */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--color-secondary-text)", margin: 0 }}>
              {selectedRole
                ? `Ready to enter the ${selectedRole === "farmer" ? "Farmer" : "FPO Manager"} workspace.`
                : "Please select a role above to proceed."}
            </p>

            <Button
              type="button"
              variant="primary"
              onClick={handleContinue}
              disabled={!selectedRole || isSubmitting}
              style={{ padding: "0.75rem 1.75rem", fontSize: "0.95rem" }}
            >
              Continue →
            </Button>
          </div>
        </div>

        {/* Footer Info */}
        <div
          style={{
            padding: "1rem 2.25rem",
            background: "var(--color-background)",
            borderTop: "1px solid var(--color-borders)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.8rem",
            color: "var(--color-secondary-text)",
          }}
        >
          <span>
            Network: {networkName || (isCorrectNetwork ? "MST Testnet (91562037)" : "Wrong Network")}
          </span>
          {balance !== null && (
            <span>Balance: {balance} {isTestnet ? "tMSTC" : "MSTC"}</span>
          )}
        </div>
      </div>
    </section>
  );
}
