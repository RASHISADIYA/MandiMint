import { useMemo } from "react";
import { useAuthoritativeRole } from "./useAuthoritativeRole";
import { useWalletOnboarding } from "./useWalletOnboarding";

export type OnboardingPhase =
  | "session_restoring"
  | "signed_out"
  | "wallet_pending"
  | "wallet_creating"
  | "wallet_failed"
  | "network_pending"
  | "network_blocked"
  | "role_verifying"
  | "role_unassigned"
  | "role_error"
  | "role_unconfigured"
  | "complete";

export const TRANSIENT_ONBOARDING_PHASES = new Set<OnboardingPhase>([
  "session_restoring",
  "wallet_pending",
  "wallet_creating",
  "network_pending",
  "role_verifying",
]);

export function isTransientOnboardingPhase(phase: OnboardingPhase): boolean {
  return TRANSIENT_ONBOARDING_PHASES.has(phase);
}

export function usePostLoginOnboarding() {
  const wallet = useWalletOnboarding();
  const roleFetchEnabled =
    wallet.authenticated &&
    wallet.state === "wallet_ready" &&
    wallet.networkVerification.status === "connected";
  const roleState = useAuthoritativeRole(roleFetchEnabled);

  const phase: OnboardingPhase = useMemo(() => {
    if (!wallet.ready) {
      return "session_restoring";
    }
    if (!wallet.authenticated) {
      return "signed_out";
    }
    if (
      wallet.state === "session_restoring" ||
      wallet.state === "checking_wallet"
    ) {
      return "wallet_pending";
    }
    if (wallet.state === "creating_wallet") {
      return "wallet_creating";
    }
    if (
      wallet.state === "wallet_creation_failed" ||
      wallet.state === "wallet_missing"
    ) {
      return wallet.state === "wallet_missing" ? "wallet_pending" : "wallet_failed";
    }
    if (
      wallet.state === "network_unconfigured" ||
      wallet.state === "network_switch_failed" ||
      wallet.networkVerification.status === "wrong_network" ||
      wallet.networkVerification.status === "rpc_unavailable" ||
      wallet.networkVerification.status === "provider_rejected" ||
      wallet.networkVerification.status === "provider_unavailable" ||
      wallet.networkVerification.status === "wallet_unavailable"
    ) {
      return "network_blocked";
    }
    if (
      wallet.networkVerification.status === "idle" ||
      wallet.networkVerification.status === "verifying"
    ) {
      return "network_pending";
    }
    if (wallet.state !== "wallet_ready") {
      return "wallet_pending";
    }
    if (roleState.status === "loading" || roleState.status === "idle") {
      return "role_verifying";
    }
    if (roleState.status === "unconfigured") {
      return "role_unconfigured";
    }
    if (roleState.status === "unassigned") {
      return "role_unassigned";
    }
    if (roleState.status === "error" || roleState.status === "session_expired") {
      return "role_error";
    }
    if (roleState.status === "verified" && roleState.role) {
      return "complete";
    }
    return "role_unassigned";
  }, [wallet, roleState]);

  const isOnboardingComplete = phase === "complete";

  const dashboardPath =
    roleState.role === "fpo_admin"
      ? "/app/manager"
      : roleState.role === "farmer"
        ? "/app/farmer"
        : null;

  return {
    ...wallet,
    roleStatus: roleState.status,
    role: roleState.role,
    roleSource: roleState.source,
    roleMessage: roleState.message,
    displayName: roleState.displayName,
    canSelectLocalRole: roleState.canSelectLocalRole,
    selectLocalRole: roleState.selectLocalRole,
    refreshRole: roleState.refresh,
    resetRole: roleState.reset,
    phase,
    isOnboardingComplete,
    dashboardPath,
  };
}
