export type AuthIntegrationMode = "privy" | "unconfigured";

export type MandiMintRole = "farmer" | "fpo_admin";

export type LoginUiState =
  | "signed_out"
  | "session_restoring"
  | "login_in_progress"
  | "login_success"
  | "login_cancelled"
  | "login_failed";

export type WalletOnboardingState =
  | "signed_out"
  | "session_restoring"
  | "checking_wallet"
  | "wallet_missing"
  | "creating_wallet"
  | "wallet_ready"
  | "wallet_creation_failed"
  | "network_unconfigured"
  | "network_switch_failed";

export interface AuthUserProfile {
  privyUserId: string;
  phone: string | null;
  email: string | null;
}

export interface RoleOption {
  value: MandiMintRole;
  label: string;
  description: string;
}
