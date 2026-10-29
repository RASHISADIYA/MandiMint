import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { WorkspaceLayout } from "./components/workspace/WorkspaceLayout";
import { RequireRole } from "./components/workspace/RequireRole";
import { AuthPage } from "./pages/AuthPage";
import { LandingPage } from "./pages/LandingPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { AccessPendingPage } from "./pages/workspace/AccessPendingPage";
import { BatchDetailsPage } from "./pages/workspace/BatchDetailsPage";
import { BatchLookupPage } from "./pages/workspace/BatchLookupPage";
import { FarmerDashboardPage } from "./pages/workspace/FarmerDashboardPage";
import { FarmerHistoryPage } from "./pages/workspace/FarmerHistoryPage";
import { ManagerDashboardPage } from "./pages/workspace/ManagerDashboardPage";
import { ManagerAuthorizationPage } from "./pages/workspace/ManagerAuthorizationPage";
import { RecordBatchPage } from "./pages/workspace/RecordBatchPage";
import { useWeb3Wallet } from "./providers/Web3WalletContext";
import { useAuthoritativeRole } from "./hooks/useAuthoritativeRole";
import { getRoleForWallet } from "./auth/roles";

function AppIndexRedirect() {
  const { connected, address, isConnecting } = useWeb3Wallet();
  const { role } = useAuthoritativeRole(connected);

  if (isConnecting) {
    return (
      <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
        <p style={{ color: "var(--color-secondary-text)" }}>Connecting wallet…</p>
      </div>
    );
  }

  if (!connected || !address) {
    return <Navigate to="/" replace />;
  }

  const effectiveRole = role || getRoleForWallet(address);
  if (effectiveRole === "farmer") {
    return <Navigate to="/app/farmer" replace />;
  }
  if (effectiveRole === "fpo_admin") {
    return <Navigate to="/app/manager" replace />;
  }

  return <Navigate to="/onboarding" replace />;
}

export default function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Unified Web3 & MandiMint Workspace */}
          <Route path="/app" element={<WorkspaceLayout area="shared" />}>
            <Route index element={<AppIndexRedirect />} />
            <Route path="access-pending" element={<AccessPendingPage />} />

            {/* Batch Explorer (Public on-chain reads) */}
            <Route path="batches" element={<BatchLookupPage />} />
            <Route path="batches/:batchId" element={<BatchDetailsPage />} />

            {/* Farmer Area (Requires 'farmer' role) */}
            <Route element={<RequireRole allowedRole="farmer" />}>
              <Route path="farmer" element={<FarmerDashboardPage />} />
              <Route path="farmer/history" element={<FarmerHistoryPage />} />
            </Route>

            {/* Manager Area (Requires 'fpo_admin' role) */}
            <Route element={<RequireRole allowedRole="fpo_admin" />}>
              <Route path="manager" element={<ManagerDashboardPage />} />
              <Route path="manager/authorize" element={<ManagerAuthorizationPage />} />
            </Route>

            {/* Privileged Batch Recording (Requires 'fpo_admin' role AND on-chain manager authorization) */}
            <Route element={<RequireRole allowedRole="fpo_admin" requireOnChainManager />}>
              <Route path="manager/record" element={<RecordBatchPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
