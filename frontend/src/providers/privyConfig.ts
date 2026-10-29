import type { PrivyClientConfig } from "@privy-io/react-auth";
import { resolveMstTestnetChain } from "../config/mstTestnetChain";

export function buildPrivyConfig(): PrivyClientConfig {
  const mstChain = resolveMstTestnetChain();

  const config: PrivyClientConfig = {
    loginMethods: ["email"],
    appearance: {
      theme: "light",
      accentColor: "#073F32",
      logo: undefined,
    },
    // Authentication and wallet provisioning stay separate. Onboarding creates
    // a wallet after email verification only when the account has none.
    embeddedWallets: {
      ethereum: {
        createOnLogin: "off",
      },
    },
  };

  if (mstChain) {
    config.defaultChain = mstChain;
    config.supportedChains = [mstChain];
  }

  return config;
}
