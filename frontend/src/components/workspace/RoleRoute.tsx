import { Navigate, Outlet } from "react-router-dom";
import type { MandiMintRole } from "../../auth/types";
import { useAuthoritativeRole } from "../../hooks/useAuthoritativeRole";
import { ErrorBanner } from "../ui/ErrorBanner";
import { StatusBadge } from "../ui/StatusBadge";
import { Button } from "../ui/Button";

interface RoleRouteProps {
  allowedRoles: readonly MandiMintRole[];
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const roleState = useAuthoritativeRole(true);

  if (roleState.status === "loading" || roleState.status === "idle") {
    return (
      <div className="mm-route-status mm-container">
        <StatusBadge variant="pending">Verifying your role…</StatusBadge>
      </div>
    );
  }

  if (roleState.status === "unconfigured") {
    return (
      <div className="mm-route-status mm-container">
        <ErrorBanner
          message={
            roleState.message ??
            "Role verification is not configured. Protected dashboards require a trusted backend."
          }
        />
      </div>
    );
  }

  if (roleState.status === "unassigned") {
    return <Navigate to="/app/access-pending" replace />;
  }

  if (roleState.status === "session_expired") {
    return <Navigate to="/auth" replace />;
  }

  if (roleState.status === "error") {
    return (
      <div className="mm-route-status mm-container">
        <ErrorBanner
          message={roleState.message ?? "Role verification failed."}
          actions={
            <Button type="button" variant="outline" onClick={() => void roleState.refresh()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  if (!roleState.role || !allowedRoles.includes(roleState.role)) {
    const fallback =
      roleState.role === "farmer"
        ? "/app/farmer"
        : roleState.role === "fpo_admin"
          ? "/app/manager"
          : "/app/access-pending";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
