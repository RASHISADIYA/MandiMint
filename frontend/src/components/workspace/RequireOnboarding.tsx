import { Navigate, Outlet, useLocation } from "react-router-dom";
import { usePostLoginOnboarding } from "../../hooks/usePostLoginOnboarding";
import { StatusBadge } from "../ui/StatusBadge";

export function RequireOnboarding() {
  const location = useLocation();
  const { ready, authenticated, phase, isOnboardingComplete } =
    usePostLoginOnboarding();

  if (!ready) {
    return (
      <div className="mm-route-status mm-container">
        <StatusBadge variant="pending">Restoring secure session…</StatusBadge>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (!isOnboardingComplete) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }

  if (phase !== "complete") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
