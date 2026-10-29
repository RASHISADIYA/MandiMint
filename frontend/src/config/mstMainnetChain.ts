import { addRpcUrlOverrideToChain } from "@privy-io/chains";
import { defineChain, type Chain } from "viem";
import { getMstMainnetEnvConfig } from "./env";

/**
 * Builds the MST Mainnet chain object for Privy/viem from public env vars.
 * Official defaults: Chain ID 4646 (0x1226), RPC https://mariorpc.mstblockchain.com/
 */
export function resolveMstMainnetChain(): Chain | null {
  const cfg = getMstMainnetEnvConfig();
  if (!cfg) {
    return null;
  }

  const base = defineChain({
    id: cfg.chainId,
    name: "MST Mainnet",
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
            name: "MST Mainnet Explorer",
            url: cfg.explorerUrl,
          },
        }
      : undefined,
  });

  return addRpcUrlOverrideToChain(base, cfg.rpcUrl);
}
