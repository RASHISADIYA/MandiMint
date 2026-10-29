import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";
import { getPrivyAppId, getPrivyClientId, isPrivyConfigured } from "../config/env";
import { buildPrivyConfig } from "./privyConfig";
import { Web3WalletProvider } from "./Web3WalletContext";

export function AppProviders({ children }: { children: ReactNode }) {
  const content = <Web3WalletProvider>{children}</Web3WalletProvider>;

  if (!isPrivyConfigured()) {
    return content;
  }

  const appId = getPrivyAppId();
  if (!appId) {
    return content;
  }

  const clientId = getPrivyClientId();

  return (
    <PrivyProvider appId={appId} clientId={clientId} config={buildPrivyConfig()}>
      {content}
    </PrivyProvider>
  );
}
