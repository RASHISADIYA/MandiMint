import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { RequireAuth } from "./components/workspace/RequireAuth";
import { RequireOnboarding } from "./components/workspace/RequireOnboarding";
import { RoleRoute } from "./components/workspace/RoleRoute";
import { WorkspaceLayout } from "./components/workspace/WorkspaceLayout";
import { AuthPage } from "./pages/AuthPage";
import { LandingPage } from "./pages/LandingPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { AccessPendingPage } from "./pages/workspace/AccessPendingPage";
import { BatchDetailsPage } from "./pages/workspace/BatchDetailsPage";
import { BatchLookupPage } from "./pages/workspace/BatchLookupPage";
import { FarmerDashboardPage } from "./pages/workspace/FarmerDashboardPage";
import { FarmerHistoryPage } from "./pages/workspace/FarmerHistoryPage";
import { ManagerDashboardPage } from "./pages/workspace/ManagerDashboardPage";
import { RecordBatchPage } from "./pages/workspace/RecordBatchPage";
import { DashboardHomeRedirect } from "./components/workspace/DashboardHomeRedirect";

export default function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          <Route element={<RequireAuth />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/app/access-pending" element={<AccessPendingPage />} />

            <Route element={<RequireOnboarding />}>
              <Route path="/app" element={<DashboardHomeRedirect />} />

              <Route element={<RoleRoute allowedRoles={["farmer"]} />}>
                <Route path="/app/farmer" element={<WorkspaceLayout area="farmer" />}>
                  <Route index element={<FarmerDashboardPage />} />
                  <Route path="history" element={<FarmerHistoryPage />} />
                </Route>
              </Route>

              <Route element={<RoleRoute allowedRoles={["fpo_admin"]} />}>
                <Route path="/app/manager" element={<WorkspaceLayout area="manager" />}>
                  <Route index element={<ManagerDashboardPage />} />
                  <Route path="record" element={<RecordBatchPage />} />
                </Route>
              </Route>

              <Route element={<RoleRoute allowedRoles={["farmer", "fpo_admin"]} />}>
                <Route path="/app/batches" element={<WorkspaceLayout area="shared" />}>
                  <Route index element={<BatchLookupPage />} />
                  <Route path=":batchId" element={<BatchDetailsPage />} />
                </Route>
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
