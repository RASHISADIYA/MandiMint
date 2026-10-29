import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useWeb3Wallet } from "../../providers/Web3WalletContext";
import { useAuthoritativeRole } from "../../hooks/useAuthoritativeRole";
import { getRoleForWallet, ROLE_LABELS, type MandiMintRole } from "../../auth/roles";
import { StatusBadge } from "../ui/StatusBadge";
import { truncateAddress } from "../../lib/format";

interface RequireRoleProps {
  allowedRole?: MandiMintRole;
  requireOnChainManager?: boolean;
}

export function RequireRole({ allowedRole, requireOnChainManager = false }: RequireRoleProps) {
  const location = useLocation();
  const { connected, address, isManager, isOwner, isConnecting } = useWeb3Wallet();
  const { role } = useAuthoritativeRole(connected);

  // 1. If currently connecting, show loading state
  if (isConnecting) {
    return (
      <div className="mm-route-status mm-container" style={{ padding: "4rem 2rem", textAlign: "center" }}>
        <StatusBadge variant="pending">Connecting wallet…</StatusBadge>
      </div>
    );
  }

  // 2. Unauthenticated: Redirect to landing/login
  if (!connected || !address) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  // 3. User connected but has not completed role selection: Redirect to onboarding
  const savedRole = role || getRoleForWallet(address);
  if (!savedRole) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }

  // 4. Role mismatch (e.g. Farmer tries to access FPO Manager routes)
  if (allowedRole && savedRole !== allowedRole) {
    return (
      <div
        className="mm-container"
        style={{
          maxWidth: "600px",
          margin: "3rem auto",
          padding: "2.5rem 2rem",
          background: "var(--color-surface)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-borders)",
          boxShadow: "var(--shadow-sm)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            margin: "0 auto 1.25rem auto",
            borderRadius: "50%",
            background: "var(--color-warning-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-warning)",
          }}
        >
          <ShieldAlert size={28} />
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <StatusBadge variant="warning">Access Restricted</StatusBadge>
        </div>

        <h1 style={{ fontSize: "1.5rem", color: "var(--color-primary-text)", marginBottom: "0.5rem" }}>
          {allowedRole === "fpo_admin"
            ? "Restricted to FPO Managers"
            : "Restricted to Farmers"}
        </h1>

        <p style={{ color: "var(--color-secondary-text)", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.75rem" }}>
          Your active workspace role is <strong>{ROLE_LABELS[savedRole as MandiMintRole]}</strong>.
          This page requires <strong>{allowedRole ? ROLE_LABELS[allowedRole] : "a different"}</strong> role.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to={savedRole === "farmer" ? "/app/farmer" : "/app/manager"}
            className="mm-btn mm-btn--primary"
            style={{ padding: "0.6rem 1.25rem" }}
          >
            Go to My Dashboard
          </Link>
          <Link
            to="/onboarding"
            className="mm-btn mm-btn--outline"
            style={{ padding: "0.6rem 1.25rem" }}
          >
            Switch Role
          </Link>
        </div>
      </div>
    );
  }

  // 5. Privileged operation requires on-chain manager authorization
  if (requireOnChainManager && !isManager && !isOwner) {
    return (
      <div
        className="mm-container"
        style={{
          maxWidth: "640px",
          margin: "3rem auto",
          padding: "2.5rem 2rem",
          background: "var(--color-surface)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-borders)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "var(--color-warning-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-warning)",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={24} />
          </div>

          <div>
            <div style={{ marginBottom: "0.4rem" }}>
              <StatusBadge variant="warning">On-Chain Authorization Required</StatusBadge>
            </div>
            <h1 style={{ fontSize: "1.35rem", color: "var(--color-primary-text)", margin: 0, fontWeight: 700 }}>
              Wallet Not Authorized as Manager
            </h1>
          </div>
        </div>

        <p style={{ color: "var(--color-secondary-text)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
          You have selected the FPO Manager role, but your connected wallet{" "}
          <code>{truncateAddress(address, 8, 6)}</code> is not registered as an authorized manager
          on the <strong>MandiMint</strong> smart contract.
        </p>

        <div
          style={{
            padding: "1rem",
            background: "var(--color-background)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-borders)",
            marginBottom: "1.5rem",
            fontSize: "0.85rem",
          }}
        >
          <p style={{ margin: "0 0 0.5rem 0", fontWeight: 600, color: "var(--color-primary-text)" }}>
            How to gain on-chain authorization:
          </p>
          <ol style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--color-secondary-text)", lineHeight: 1.6 }}>
            <li>Provide your wallet address to the MandiMint contract administrator or FPO owner.</li>
            <li>The contract owner must execute <code>setManager(yourAddress, true)</code> on MST Testnet.</li>
            <li>Once confirmed, your wallet will automatically be recognized to record batches.</li>
          </ol>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link to="/app/manager" className="mm-btn mm-btn--primary">
            Return to Manager Dashboard
          </Link>
          <Link to="/app/batches" className="mm-btn mm-btn--outline">
            Browse Public Batches
          </Link>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
