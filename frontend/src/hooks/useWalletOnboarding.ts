import type { ConnectedWallet } from "@privy-io/react-auth";
import { useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMstTestnetEnvConfig } from "../config/env";
import { resolveMstTestnetChain } from "../config/mstTestnetChain";
import type { AuthUserProfile, WalletOnboardingState } from "../auth/types";
import {
  idleState,
  unconfiguredNetworkState,
  verifyWalletNetwork,
} from "../services/network/verifyMstNetwork";
import type { NetworkVerificationState } from "../services/network/types";

function extractUserProfile(
  user: ReturnType<typeof usePrivy>["user"],
): AuthUserProfile | null {
  if (!user) {
    return null;
  }

  const phoneAccount = user.linkedAccounts.find(
    (account) => account.type === "phone",
  );
  const googleAccount = user.linkedAccounts.find(
    (account) => account.type === "google_oauth",
  );
  const emailAccount = user.linkedAccounts.find(
    (account) => account.type === "email",
  );

  return {
    privyUserId: user.id,
    phone:
      (phoneAccount && "number" in phoneAccount
        ? phoneAccount.number
        : user.phone?.number) ?? null,
    email:
      (googleAccount && "email" in googleAccount
        ? googleAccount.email
        : null) ??
      (emailAccount && "address" in emailAccount
        ? emailAccount.address
        : null) ??
      null,
  };
}

export function useWalletOnboarding() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [creatingWallet, setCreatingWallet] = useState(false);
  const [networkVerification, setNetworkVerification] =
    useState<NetworkVerificationState>(idleState());
  const switchAttemptRef = useRef(0);
  const lastResetKeyRef = useRef<string | null>(null);
  const verifyRequestRef = useRef(0);
  const walletCreateAttemptRef = useRef(false);

  const embeddedWalletRef = useRef<ConnectedWallet | null>(null);
  const embeddedWallet = useMemo(() => {
    const found =
      wallets.find((wallet) => wallet.walletClientType === "privy") ?? null;
    if (found && embeddedWalletRef.current?.address === found.address) {
      // Preserve object identity for the same wallet across Privy re-renders.
      return embeddedWalletRef.current;
    }
    embeddedWalletRef.current = found;
    return found;
  }, [wallets]);

  const profile = useMemo(() => extractUserProfile(user), [user]);
  const mstEnv = useMemo(() => getMstTestnetEnvConfig(), []);
  const mstConfigured = mstEnv !== null;
  const mstChain = useMemo(() => resolveMstTestnetChain(), []);

  const runNetworkVerification = useCallback(async () => {
    if (!embeddedWallet || !mstEnv) {
      setNetworkVerification(
        mstConfigured ? idleState() : unconfiguredNetworkState(),
      );
      return;
    }

    const requestId = verifyRequestRef.current + 1;
    verifyRequestRef.current = requestId;
    setNetworkVerification((prev) => ({
      ...prev,
      status: "verifying",
      expectedChainId: mstEnv.chainId,
      message: null,
    }));

    const result = await verifyWalletNetwork(embeddedWallet, mstEnv.chainId);
    if (verifyRequestRef.current !== requestId) {
      return;
    }

    setNetworkVerification(result);
    if (result.status !== "connected") {
      setNetworkError(result.message);
    } else {
      setNetworkError(null);
    }
  }, [embeddedWallet, mstConfigured, mstEnv]);

  const switchToMst = useCallback(async () => {
    if (!embeddedWallet || !mstChain || !mstEnv) {
      return;
    }

    const attempt = switchAttemptRef.current + 1;
    switchAttemptRef.current = attempt;
    setNetworkError(null);

    try {
      await embeddedWallet.switchChain(mstChain.id);
      if (switchAttemptRef.current === attempt) {
        await runNetworkVerification();
      }
    } catch (err) {
      if (switchAttemptRef.current !== attempt) {
        return;
      }
      const message =
        err instanceof Error
          ? err.message
          : "Could not switch the embedded wallet to MST Testnet.";
      setNetworkError(message);
      setNetworkVerification({
        status: "provider_rejected",
        expectedChainId: mstEnv.chainId,
        actualChainId: null,
        message,
      });
    }
  }, [embeddedWallet, mstChain, mstEnv, runNetworkVerification]);

  useEffect(() => {
    const resetKey = `${authenticated}:${embeddedWallet?.address ?? "none"}:${walletsReady}`;
    if (!authenticated || !embeddedWallet || !walletsReady) {
      if (lastResetKeyRef.current !== resetKey) {
        setNetworkVerification(idleState());
        switchAttemptRef.current = 0;
        lastResetKeyRef.current = resetKey;
      }
      return;
    }

    lastResetKeyRef.current = resetKey;

    if (!mstConfigured) {
      setNetworkVerification(unconfiguredNetworkState());
      return;
    }

    if (switchAttemptRef.current === 0) {
      void switchToMst();
    }
  }, [authenticated, embeddedWallet, walletsReady, mstConfigured, switchToMst]);

  const createEmbeddedWallet = useCallback(async () => {
    if (embeddedWallet) {
      return embeddedWallet;
    }

    setCreatingWallet(true);
    setWalletError(null);
    try {
      const wallet = await createWallet();
      return wallet;
    } catch (err) {
      setWalletError(
        err instanceof Error
          ? err.message
          : "Embedded wallet creation failed.",
      );
      return null;
    } finally {
      setCreatingWallet(false);
    }
  }, [createWallet, embeddedWallet]);

  useEffect(() => {
    if (!authenticated) {
      walletCreateAttemptRef.current = false;
      return;
    }
    if (!walletsReady || embeddedWallet || creatingWallet) {
      return;
    }
    if (walletCreateAttemptRef.current) {
      return;
    }
    walletCreateAttemptRef.current = true;
    void createEmbeddedWallet();
  }, [
    authenticated,
    walletsReady,
    embeddedWallet,
    creatingWallet,
    createEmbeddedWallet,
  ]);

  const retryWalletCreation = useCallback(async () => {
    if (embeddedWallet) {
      return embeddedWallet;
    }
    walletCreateAttemptRef.current = true;
    return createEmbeddedWallet();
  }, [createEmbeddedWallet, embeddedWallet]);

  const state: WalletOnboardingState = useMemo(() => {
    if (!ready) {
      return "session_restoring";
    }
    if (!authenticated) {
      return "signed_out";
    }
    if (!walletsReady) {
      return "checking_wallet";
    }
    if (creatingWallet) {
      return "creating_wallet";
    }
    if (!embeddedWallet) {
      return walletError ? "wallet_creation_failed" : "wallet_missing";
    }
    if (walletError) {
      return "wallet_creation_failed";
    }
    if (!mstConfigured) {
      return "network_unconfigured";
    }
    if (networkVerification.status === "connected") {
      return "wallet_ready";
    }
    if (networkError || networkVerification.status !== "idle") {
      return "network_switch_failed";
    }
    return "checking_wallet";
  }, [
    ready,
    authenticated,
    walletsReady,
    creatingWallet,
    embeddedWallet,
    walletError,
    mstConfigured,
    networkVerification.status,
    networkError,
  ]);

  const handleLogout = useCallback(async () => {
    verifyRequestRef.current += 1;
    switchAttemptRef.current = 0;
    walletCreateAttemptRef.current = false;
    setNetworkVerification(idleState());
    setNetworkError(null);
    setWalletError(null);
    await logout();
  }, [logout]);

  return {
    ready,
    authenticated,
    walletsReady,
    logout: handleLogout,
    profile,
    embeddedWallet,
    walletAddress: embeddedWallet?.address ?? null,
    mstChain,
    mstConfigured,
    networkError,
    walletError,
    networkVerification,
    state,
    createEmbeddedWallet,
    retryWalletCreation,
    switchToMst,
    verifyNetwork: runNetworkVerification,
  };
}
