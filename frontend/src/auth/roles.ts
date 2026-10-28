import { useCallback, useEffect, useState } from "react";
import type { MandiMintRole, RoleOption } from "./types";

/**
 * Local role preferences are a fallback only when no role API is configured.
 * They can drive UI routes in that mode but are not server verification and
 * never grant on-chain authorization — see useAuthoritativeRole.
 */
const ROLE_PREFIX = "mandimint.role.";
const LAST_ROLE_KEY = "mandimint.last-role";
const ROLE_CHANGED_EVENT = "mandimint:role-changed";

export const ROLE_OPTIONS: readonly RoleOption[] = [
  {
    value: "farmer",
    label: "Farmer",
    description: "View your recorded crop sale allocations and batch history.",
  },
  {
    value: "fpo_admin",
    label: "FPO Admin",
    description: "Record batches if your connected wallet is authorized on-chain.",
  },
] as const;

export const ROLE_LABELS: Record<MandiMintRole, string> = {
  farmer: "Farmer",
  fpo_admin: "FPO Admin",
};

export function isMandiMintRole(value: unknown): value is MandiMintRole {
  return value === "farmer" || value === "fpo_admin";
}

function roleKey(userId: string): string {
  return `${ROLE_PREFIX}${userId}`;
}

export function getRoleForUser(userId: string | null): MandiMintRole | null {
  if (!userId) {
    return null;
  }

  try {
    const value = window.localStorage.getItem(roleKey(userId));
    return isMandiMintRole(value) ? value : null;
  } catch {
    return null;
  }
}

export function setRoleForUser(
  userId: string,
  role: MandiMintRole,
): void {
  try {
    window.localStorage.setItem(roleKey(userId), role);
    window.localStorage.setItem(LAST_ROLE_KEY, role);
  } catch {
    return;
  }

  window.dispatchEvent(new Event(ROLE_CHANGED_EVENT));
}

export function clearStoredRoles(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(ROLE_PREFIX) || key === LAST_ROLE_KEY) {
        keys.push(key);
      }
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Ignore storage failures; clear in-memory state via the change event.
  }

  window.dispatchEvent(new Event(ROLE_CHANGED_EVENT));
}

export function getLastRole(): MandiMintRole {
  try {
    const value = window.localStorage.getItem(LAST_ROLE_KEY);
    return isMandiMintRole(value) ? value : "farmer";
  } catch {
    return "farmer";
  }
}

export function useStoredRole(userId: string | null) {
  const [role, setRoleState] = useState<MandiMintRole | null>(() =>
    getRoleForUser(userId),
  );

  useEffect(() => {
    setRoleState(getRoleForUser(userId));

    if (!userId) {
      return;
    }

    const handleChange = () => {
      setRoleState(getRoleForUser(userId));
    };

    window.addEventListener(ROLE_CHANGED_EVENT, handleChange);
    return () => {
      window.removeEventListener(ROLE_CHANGED_EVENT, handleChange);
    };
  }, [userId]);

  const rememberRole = useCallback(
    (nextRole: MandiMintRole) => {
      if (!userId) {
        return;
      }
      setRoleForUser(userId, nextRole);
    },
    [userId],
  );

  return [role, rememberRole] as const;
}
