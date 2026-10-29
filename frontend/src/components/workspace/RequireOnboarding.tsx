import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useWeb3Wallet } from "../../providers/Web3WalletContext";
import { getRoleForWallet } from "../../auth/roles";
import {
  isTransientOnboardingPhase,
  usePostLoginOnboarding,
} from "../../hooks/usePostLoginOnboarding";
import { StatusBadge } from "../ui/StatusBadge";

export function RequireOnboarding() {
  const location = useLocation();
  const web3 = useWeb3Wallet();
  const { ready, authenticated, phase, isOnboardingComplete } =
    usePostLoginOnboarding();

  // If connected via Web3 wallet:
  if (web3.connected && web3.address) {
    const role = getRoleForWallet(web3.address);
    if (!role) {
      return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
    }
    return <Outlet />;
  }

  if (!ready || isTransientOnboardingPhase(phase)) {
    return (
      <div className="mm-route-status mm-container">
        <StatusBadge variant="pending">Restoring secure session…</StatusBadge>
      </div>
    );
  }

  if (!authenticated && !web3.connected) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (!isOnboardingComplete || phase !== "complete") {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
