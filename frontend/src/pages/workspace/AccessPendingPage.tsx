import { Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { usePostLoginOnboarding } from "../../hooks/usePostLoginOnboarding";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBanner } from "../../components/ui/ErrorBanner";

export function AccessPendingPage() {
  const {
    roleStatus,
    roleMessage,
    refreshRole,
    walletAddress,
    canSelectLocalRole,
    role,
    dashboardPath,
    isOnboardingComplete,
  } = usePostLoginOnboarding();

  if (canSelectLocalRole && role && dashboardPath && isOnboardingComplete) {
    return (
      <div className="mm-workspace-panel">
        <EmptyState
          icon={Clock}
          title="Local role ready"
          description="This workspace role was selected on this device. It is not server-verified; FPO writes still require on-chain manager authorization."
          action={
            <Link to={dashboardPath} className="mm-btn mm-btn--primary">
              Open workspace
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mm-workspace-panel">
      {roleStatus === "unconfigured" && !canSelectLocalRole && (
        <ErrorBanner
          message={
            roleMessage ??
            "Configure VITE_MANDIMINT_API_BASE_URL so MandiMint can verify roles from your backend."
          }
        />
      )}

      {walletAddress && !canSelectLocalRole && (
        <p className="mm-workspace-panel__note">
          Embedded wallet is ready. Dashboard access stays locked until the server assigns
          a farmer or FPO manager role.
        </p>
      )}

      <EmptyState
        icon={Clock}
        title={canSelectLocalRole ? "Choose a workspace role" : "Access pending"}
        description={
          canSelectLocalRole
            ? "No role backend is configured. Return to setup and choose a clearly labelled local Farmer or FPO Admin role. Local selection is not server-verified."
            : roleMessage ??
              "Your account is signed in, but no farmer or FPO manager role is assigned yet. Your administrator must assign a role on the server."
        }
        action={
          <div className="mm-workspace-panel__actions">
            {!canSelectLocalRole && (
              <Button type="button" variant="outline" onClick={() => void refreshRole()}>
                Check again
              </Button>
            )}
            <Link to="/onboarding" className="mm-btn mm-btn--ghost">
              {canSelectLocalRole ? "Choose role" : "Review setup"}
            </Link>
          </div>
        }
      />
    </div>
  );
}
