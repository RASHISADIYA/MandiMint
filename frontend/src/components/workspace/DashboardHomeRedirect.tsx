import { Navigate } from "react-router-dom";
import { usePostLoginOnboarding } from "../../hooks/usePostLoginOnboarding";
import { StatusBadge } from "../ui/StatusBadge";

export function DashboardHomeRedirect() {
  const { dashboardPath, ready, isOnboardingComplete } = usePostLoginOnboarding();

  if (!ready || !isOnboardingComplete) {
    return (
      <div className="mm-route-status mm-container">
        <StatusBadge variant="pending">Loading workspace…</StatusBadge>
      </div>
    );
  }

  if (!dashboardPath) {
    return <Navigate to="/app/access-pending" replace />;
  }

  return <Navigate to={dashboardPath} replace />;
}
