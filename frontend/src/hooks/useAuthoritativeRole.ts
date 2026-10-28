import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useRef, useState } from "react";
import { useStoredRole } from "../auth/roles";
import type { AuthoritativeRoleState } from "../services/role/types";
import {
  fetchAuthoritativeUserProfile,
  isRoleApiConfigured,
} from "../services/role/userRoleService";

const INITIAL: AuthoritativeRoleState = {
  status: "idle",
  role: null,
  message: null,
  source: null,
};

export function useAuthoritativeRole(enabled: boolean) {
  const { getAccessToken, authenticated, user } = usePrivy();
  const backendConfigured = isRoleApiConfigured();
  const [localRole, selectLocalRole] = useStoredRole(user?.id ?? null);
  const [state, setState] = useState<AuthoritativeRoleState>(INITIAL);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled || !authenticated) {
      setState(INITIAL);
      setDisplayName(null);
      return;
    }

    if (!backendConfigured) {
      requestIdRef.current += 1;
      setDisplayName(null);
      setState(
        localRole
          ? {
              status: "verified",
              role: localRole,
              message:
                "Local role selected. This workspace preference is not verified by a backend; FPO batch writes still require on-chain manager authorization.",
              source: "local",
            }
          : {
              status: "unassigned",
              role: null,
              message:
                "No role backend is configured. Choose a local Farmer or FPO Admin workspace. This choice is not server-verified, and FPO batch writes still require on-chain manager authorization.",
              source: "local",
            },
      );
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState((prev) =>
      prev.status === "verified"
        ? prev
        : {
            status: "loading",
            role: null,
            message: null,
            source: "backend",
          },
    );

    const controller = new AbortController();
    const result = await fetchAuthoritativeUserProfile(
      getAccessToken,
      controller.signal,
    );

    if (requestIdRef.current !== requestId) {
      return;
    }

    setState({
      status: result.status,
      role: result.role,
      message: result.message,
      source: result.source,
    });
    setDisplayName(result.displayName);
  }, [authenticated, backendConfigured, enabled, getAccessToken, localRole]);

  useEffect(() => {
    if (!enabled || !authenticated) {
      setState(INITIAL);
      setDisplayName(null);
      return;
    }

    void refresh();
  }, [enabled, authenticated, refresh]);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setState(INITIAL);
    setDisplayName(null);
  }, []);

  return {
    ...state,
    displayName,
    canSelectLocalRole: !backendConfigured,
    selectLocalRole,
    refresh,
    reset,
  };
}
