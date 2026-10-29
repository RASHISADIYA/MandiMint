import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useRef, useState } from "react";
import { useStoredRole } from "../auth/roles";
import { useWeb3Wallet } from "../providers/Web3WalletContext";
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
  const { connected, address } = useWeb3Wallet();
  const effectiveAuth = authenticated || connected;
  const effectiveUserId = user?.id ?? (address ? address.toLowerCase() : null);

  const backendConfigured = isRoleApiConfigured();
  const [localRole, selectLocalRole] = useStoredRole(effectiveUserId);
  const [state, setState] = useState<AuthoritativeRoleState>(INITIAL);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled || !effectiveAuth || !effectiveUserId) {
      setState(INITIAL);
      setDisplayName(null);
      return;
    }

    if (!backendConfigured || !authenticated) {
      requestIdRef.current += 1;
      setDisplayName(null);
      setState(
        localRole
          ? {
              status: "verified",
              role: localRole,
              message:
                "Role preference bound to connected wallet. Privileged FPO manager actions are verified directly on-chain.",
              source: "local",
            }
          : {
              status: "unassigned",
              role: null,
              message:
                "Please choose your role for this wallet. FPO batch writes require on-chain manager authorization.",
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
  }, [authenticated, effectiveAuth, effectiveUserId, backendConfigured, enabled, getAccessToken, localRole]);

  useEffect(() => {
    if (!enabled || !effectiveAuth || !effectiveUserId) {
      setState(INITIAL);
      setDisplayName(null);
      return;
    }

    void refresh();
  }, [enabled, effectiveAuth, effectiveUserId, localRole, refresh]);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setState(INITIAL);
    setDisplayName(null);
  }, []);

  return {
    ...state,
    displayName,
    canSelectLocalRole: !backendConfigured || !authenticated,
    selectLocalRole,
    refresh,
    reset,
  };
}
