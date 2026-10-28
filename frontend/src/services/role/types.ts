import type { MandiMintRole } from "../../auth/types";

export type AuthoritativeRoleStatus =
  | "idle"
  | "loading"
  | "unconfigured"
  | "unassigned"
  | "verified"
  | "error"
  | "session_expired";

export type RoleSource = "backend" | "local" | null;

export interface AuthoritativeRoleState {
  status: AuthoritativeRoleStatus;
  role: MandiMintRole | null;
  message: string | null;
  source: RoleSource;
}

export interface UserProfileResponse {
  privyUserId: string;
  role: MandiMintRole | null;
  displayName?: string | null;
}
