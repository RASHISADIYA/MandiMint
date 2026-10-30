import { Link } from "react-router-dom";
import { ConnectWalletButton } from "../wallet/ConnectWalletButton";
import { NetworkSelector } from "../network/NetworkSelector";
import { useWeb3Wallet } from "../../providers/Web3WalletContext";
import { useAuthoritativeRole } from "../../hooks/useAuthoritativeRole";

export function AuthHeaderActions() {
  const { connected } = useWeb3Wallet();
  const { role } = useAuthoritativeRole(connected);

  const dashboardTarget = role === "farmer"
    ? "/app/farmer"
    : role === "fpo_admin"
    ? "/app/manager"
    : "/onboarding";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <Link
        to="/app/batches"
        className="mm-btn mm-btn--ghost mm-hide-mobile"
        style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem" }}
      >
        Batch Explorer
      </Link>

      {connected && (
        <Link
          to={dashboardTarget}
          className="mm-btn mm-btn--primary mm-hide-mobile"
          style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem" }}
        >
          {role ? "My Dashboard" : "Select Role"}
        </Link>
      )}

      <NetworkSelector />
      {connected ? (
        <ConnectWalletButton />
      ) : (
        <Link
          to="/auth"
          className="mm-btn mm-btn--primary"
          style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem" }}
        >
          Sign In
        </Link>
      )}
    </div>
  );
}

export function AuthHeaderActionsFallback() {
  return null;
}
