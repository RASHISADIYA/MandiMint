import { clearStoredRoles, isMandiMintRole } from "../../auth/roles";
import type { MandiMintRole } from "../../auth/types";
import type { AuthoritativeRoleState, UserProfileResponse } from "./types";

function getRoleApiBaseUrl(): string | null {
  const base = import.meta.env.VITE_MANDIMINT_API_BASE_URL?.trim();
  return base ? base.replace(/\/$/, "") : null;
}

export function isRoleApiConfigured(): boolean {
  return getRoleApiBaseUrl() !== null;
}

/**
 * Clears the local role preference used only when no role backend is configured.
 */
export function clearClientRoleHints(): void {
  clearStoredRoles();
}

/**
 * Maps GET /api/users/me JSON to client role state. Does not grant privileges by itself.
 */
export function mapAuthoritativeRoleFromProfile(
  body: UserProfileResponse,
): AuthoritativeRoleState & { displayName: string | null } {
  const role = isMandiMintRole(body.role) ? body.role : null;

  if (!role) {
    return {
      status: "unassigned",
      role: null,
      message:
        "Your account has no assigned role yet. Contact your FPO administrator or MandiMint support.",
      displayName: body.displayName ?? null,
      source: "backend",
    };
  }

  return {
    status: "verified",
    role,
    message: null,
    displayName: body.displayName ?? null,
    source: "backend",
  };
}

/**
 * Fetches the user's role from the trusted backend.
 * Never defaults to FPO manager. Never trusts client-selected roles.
 */
export async function fetchAuthoritativeUserProfile(
  getAccessToken: () => Promise<string | null>,
  signal?: AbortSignal,
): Promise<AuthoritativeRoleState & { displayName: string | null }> {
  const baseUrl = getRoleApiBaseUrl();
  if (!baseUrl) {
    return {
      status: "unconfigured",
      role: null,
      message:
        "Role API is not configured. Set VITE_MANDIMINT_API_BASE_URL to your backend base URL.",
      displayName: null,
      source: null,
    };
  }

  let token: string | null;
  try {
    token = await getAccessToken();
  } catch {
    return {
      status: "error",
      role: null,
      message: "Could not obtain an access token for role verification.",
      displayName: null,
      source: "backend",
    };
  }

  if (!token) {
    return {
      status: "session_expired",
      role: null,
      message: "Your session expired. Sign in again to verify your role.",
      displayName: null,
      source: "backend",
    };
  }

  try {
    const response = await fetch(`${baseUrl}/api/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal,
    });

    if (response.status === 401 || response.status === 403) {
      return {
        status: "session_expired",
        role: null,
        message: "Your session is no longer valid. Sign in again.",
        displayName: null,
        source: "backend",
      };
    }

    if (!response.ok) {
      return {
        status: "error",
        role: null,
        message: `Role verification failed (HTTP ${response.status}).`,
        displayName: null,
        source: "backend",
      };
    }

    const body = (await response.json()) as UserProfileResponse;
    return mapAuthoritativeRoleFromProfile(body);
  } catch (error) {
    if (signal?.aborted) {
      return {
        status: "idle",
        role: null,
        message: null,
        displayName: null,
        source: null,
      };
    }

    return {
      status: "error",
      role: null,
      message:
        error instanceof Error
          ? error.message
          : "Could not reach the role verification service.",
      displayName: null,
      source: "backend",
    };
  }
}

export function roleGrantsManagerAccess(role: MandiMintRole | null): boolean {
  return role === "fpo_admin";
}

export function roleGrantsFarmerAccess(role: MandiMintRole | null): boolean {
  return role === "farmer";
}
