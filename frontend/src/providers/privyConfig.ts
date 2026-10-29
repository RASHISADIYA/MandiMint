import type { PrivyClientConfig } from "@privy-io/react-auth";
import { resolveMstTestnetChain } from "../config/mstTestnetChain";
import { resolveMstMainnetChain } from "../config/mstMainnetChain";

export function buildPrivyConfig(): PrivyClientConfig {
  const testnetChain = resolveMstTestnetChain();
  const mainnetChain = resolveMstMainnetChain();

  const supportedChains = [testnetChain, mainnetChain].filter(
    (c): c is NonNullable<typeof c> => c !== null,
  );

  const config: PrivyClientConfig = {
    loginMethods: ["google", "email"],
    appearance: {
      theme: "light",
      accentColor: "#073F32",
      logo: undefined,
    },
    embeddedWallets: {
      ethereum: {
        createOnLogin: "users-without-wallets",
      },
    },
  };

  if (testnetChain) {
    config.defaultChain = testnetChain;
  }

  if (supportedChains.length > 0) {
    config.supportedChains = supportedChains;
  }

  return config;
}
