import { Navigate } from "react-router-dom";
import { OverviewPage } from "./OverviewPage";

/** Farmer dashboard boundary — content shared with overview until a dedicated farmer home exists. */
export function FarmerDashboardPage() {
  return <OverviewPage dashboardMode="farmer" />;
}

export function FarmerDashboardRedirect() {
  return <Navigate to="/app/farmer" replace />;
}
