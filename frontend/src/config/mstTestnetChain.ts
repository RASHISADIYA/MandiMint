import { addRpcUrlOverrideToChain } from "@privy-io/chains";
import { defineChain, type Chain } from "viem";
import { getMstTestnetEnvConfig } from "./env";

/**
 * Builds the MST Testnet chain object for Privy/viem from public env vars.
 * The MandiMint repo intentionally does not hardcode MST RPC/chain ID (see root README).
 */
export function resolveMstTestnetChain(): Chain | null {
  const cfg = getMstTestnetEnvConfig();
  if (!cfg) {
    return null;
  }

  const base = defineChain({
    id: cfg.chainId,
    name: "MST Testnet",
    nativeCurrency: {
      name: cfg.nativeCurrencyName,
      symbol: cfg.nativeCurrencySymbol,
      decimals: cfg.nativeCurrencyDecimals,
    },
    rpcUrls: {
      default: {
        http: [cfg.rpcUrl],
      },
    },
    blockExplorers: cfg.explorerUrl
      ? {
          default: {
            name: "MST Testnet Explorer",
            url: cfg.explorerUrl,
          },
        }
      : undefined,
  });

  return addRpcUrlOverrideToChain(base, cfg.rpcUrl);
}
