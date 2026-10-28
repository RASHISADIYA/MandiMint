import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";
import { getPrivyAppId, getPrivyClientId, isPrivyConfigured } from "../config/env";
import { buildPrivyConfig } from "./privyConfig";

export function AppProviders({ children }: { children: ReactNode }) {
  if (!isPrivyConfigured()) {
    return children;
  }

  const appId = getPrivyAppId();
  if (!appId) {
    return children;
  }

  const clientId = getPrivyClientId();

  return (
    <PrivyProvider appId={appId} clientId={clientId} config={buildPrivyConfig()}>
      {children}
    </PrivyProvider>
  );
}
