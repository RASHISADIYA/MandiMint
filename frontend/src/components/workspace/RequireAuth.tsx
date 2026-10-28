import { usePrivy } from "@privy-io/react-auth";
import { Navigate, Outlet } from "react-router-dom";
import { isPrivyConfigured } from "../../config/env";
import { StatusBadge } from "../ui/StatusBadge";

function PrivyRequireAuth() {
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return (
      <div className="mm-route-status mm-container">
        <StatusBadge variant="pending">Restoring secure session…</StatusBadge>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}

export function RequireAuth() {
  if (!isPrivyConfigured()) {
    return <Navigate to="/auth" replace />;
  }

  return <PrivyRequireAuth />;
}
