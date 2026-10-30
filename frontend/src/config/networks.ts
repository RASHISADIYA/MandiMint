import { getAddress, isAddress } from "ethers";

export type NetworkId = "mstTestnet" | "mstMainnet";

export interface NetworkCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

export interface NetworkConfig {
  id: NetworkId;
  name: string;
  badge: "TESTNET" | "MAINNET";
  chainId: number;
  hexChainId: string;
  rpcUrl: string;
  explorerUrl: string;
  currency: NetworkCurrency;
  contractAddress: string | null;
  isContractConfigured: boolean;
  faucetUrl: string | null;
  description: string;
}

function resolveContractAddress(networkId: NetworkId): string | null {
  if (typeof import.meta === "undefined" || !import.meta.env) {
    if (networkId === "mstTestnet") {
      return "0x06289D9c452369abcb9bc1b5D6Adf80982C5679C";
    }
    if (networkId === "mstMainnet") {
      return "0x06289D9c452369abcb9bc1b5D6Adf80982C5679C";
    }
    return null;
  }

  if (networkId === "mstTestnet") {
    const raw =
      import.meta.env.VITE_MANDIMINT_TESTNET_CONTRACT_ADDRESS?.trim() ||
      import.meta.env.VITE_MANDIMINT_CONTRACT_ADDRESS?.trim() ||
      "0x06289D9c452369abcb9bc1b5D6Adf80982C5679C";
    return isAddress(raw) ? getAddress(raw) : null;
  }

  if (networkId === "mstMainnet") {
    const raw =
      import.meta.env.VITE_MANDIMINT_MAINNET_CONTRACT_ADDRESS?.trim() ||
      "0x06289D9c452369abcb9bc1b5D6Adf80982C5679C";
    return isAddress(raw) ? getAddress(raw) : null;
  }

  return null;
}

/**
 * Official MST Testnet defaults.
 * Verified on live RPC: Chain ID 91562037 (0x5752035).
 * Verified contract: 0x06289D9c452369abcb9bc1b5D6Adf80982C5679C.
 */
export const MST_TESTNET_CONFIG: Readonly<NetworkConfig> = {
  id: "mstTestnet",
  name: "MST Testnet",
  badge: "TESTNET",
  chainId: 91562037,
  hexChainId: "0x5752035",
  rpcUrl:
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_MST_TESTNET_RPC_URL?.trim()) ||
    "https://testnetrpc.mstblockchain.com",
  explorerUrl:
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_MST_TESTNET_EXPLORER_URL?.trim()) ||
    "https://testnet.mstscan.com",
  currency: {
    name: "Testnet MSTC",
    symbol: "tMSTC",
    decimals: 18,
  },
  contractAddress: resolveContractAddress("mstTestnet"),
  isContractConfigured: resolveContractAddress("mstTestnet") !== null,
  faucetUrl: "https://faucet.mstblockchain.com",
  description: "Official MST Buildathon 2.0 Testnet environment with verified live MandiMint contract.",
};

/**
 * Official MST Mainnet defaults.
 * Verified on live RPC: Chain ID 4646 (0x1226).
 * Verified contract: 0x06289D9c452369abcb9bc1b5D6Adf80982C5679C.
 */
export const MST_MAINNET_CONFIG: Readonly<NetworkConfig> = {
  id: "mstMainnet",
  name: "MST Mainnet",
  badge: "MAINNET",
  chainId: 4646,
  hexChainId: "0x1226",
  rpcUrl:
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_MST_MAINNET_RPC_URL?.trim()) ||
    "https://mariorpc.mstblockchain.com/",
  explorerUrl:
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_MST_MAINNET_EXPLORER_URL?.trim()) ||
    "https://mstscan.com",
  currency: {
    name: "Mario Stone Coin",
    symbol: "MSTC",
    decimals: 18,
  },
  contractAddress: resolveContractAddress("mstMainnet"),
  isContractConfigured: resolveContractAddress("mstMainnet") !== null,
  faucetUrl: null,
  description: "Official MST Buildathon 2.0 Mainnet production environment with verified live MandiMint contract.",
};

export const SUPPORTED_NETWORKS: Record<NetworkId, NetworkConfig> = {
  mstTestnet: MST_TESTNET_CONFIG,
  mstMainnet: MST_MAINNET_CONFIG,
};

export function getNetworkConfig(networkId: NetworkId): NetworkConfig {
  return SUPPORTED_NETWORKS[networkId] || MST_TESTNET_CONFIG;
}

export function getNetworkConfigByChainId(chainId: number | bigint): NetworkConfig | null {
  const numeric = typeof chainId === "bigint" ? Number(chainId) : chainId;
  if (numeric === MST_TESTNET_CONFIG.chainId) {
    return MST_TESTNET_CONFIG;
  }
  if (numeric === MST_MAINNET_CONFIG.chainId) {
    return MST_MAINNET_CONFIG;
  }
  return null;
}

export function isSupportedChainId(chainId: number | bigint): boolean {
  return getNetworkConfigByChainId(chainId) !== null;
}

export function getExplorerTxUrl(networkId: NetworkId, txHash: string): string {
  const cfg = getNetworkConfig(networkId);
  const base = cfg.explorerUrl.replace(/\/$/, "");
  return `${base}/tx/${txHash}`;
}

export function getExplorerAddressUrl(networkId: NetworkId, address: string): string {
  const cfg = getNetworkConfig(networkId);
  const base = cfg.explorerUrl.replace(/\/$/, "");
  return `${base}/address/${address}`;
}

export function getExplorerBlockUrl(networkId: NetworkId, blockNumber: number | bigint): string {
  const cfg = getNetworkConfig(networkId);
  const base = cfg.explorerUrl.replace(/\/$/, "");
  return `${base}/block/${blockNumber.toString()}`;
}
