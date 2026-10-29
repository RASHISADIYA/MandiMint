/**
 * Public Vite environment configuration.
 * All VITE_* values are exposed to the client bundle — never put secrets here.
 */

import { isAddress, getAddress } from "ethers";

export function getPrivyAppId(): string | null {
  const id = import.meta.env.VITE_PRIVY_APP_ID?.trim();
  return id || null;
}

export function getPrivyClientId(): string | undefined {
  const id = import.meta.env.VITE_PRIVY_CLIENT_ID?.trim();
  return id || undefined;
}

export function isPrivyConfigured(): boolean {
  return getPrivyAppId() !== null;
}

export interface NetworkEnvConfig {
  chainId: number;
  rpcUrl: string;
  explorerUrl?: string;
  nativeCurrencySymbol: string;
  nativeCurrencyName: string;
  nativeCurrencyDecimals: number;
}

export type MstTestnetEnvConfig = NetworkEnvConfig;
export type MstMainnetEnvConfig = NetworkEnvConfig;

/**
 * MST Testnet Configuration.
 * Returns official defaults if environment variables are not specified.
 */
export function getMstTestnetEnvConfig(): MstTestnetEnvConfig | null {
  const chainIdRaw =
    import.meta.env.VITE_MST_TESTNET_CHAIN_ID?.trim() || "91562037";
  const rpcUrl =
    import.meta.env.VITE_MST_TESTNET_RPC_URL?.trim() ||
    "https://testnetrpc.mstblockchain.com";

  const chainId = Number.parseInt(chainIdRaw, 10);
  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    return null;
  }

  const symbol =
    import.meta.env.VITE_MST_TESTNET_CURRENCY_SYMBOL?.trim() || "tMSTC";
  const name =
    import.meta.env.VITE_MST_TESTNET_CURRENCY_NAME?.trim() || "MST Testnet";
  const decimalsRaw =
    import.meta.env.VITE_MST_TESTNET_CURRENCY_DECIMALS?.trim() || "18";
  const decimals = Number.parseInt(decimalsRaw, 10);

  return {
    chainId,
    rpcUrl,
    explorerUrl:
      import.meta.env.VITE_MST_TESTNET_EXPLORER_URL?.trim() ||
      "https://testnet.mstscan.com",
    nativeCurrencySymbol: symbol,
    nativeCurrencyName: name,
    nativeCurrencyDecimals: Number.isFinite(decimals) ? decimals : 18,
  };
}

export function isMstTestnetConfigured(): boolean {
  return getMstTestnetEnvConfig() !== null;
}

/**
 * MST Mainnet Configuration.
 * Returns official defaults if environment variables are not specified.
 */
export function getMstMainnetEnvConfig(): MstMainnetEnvConfig | null {
  const chainIdRaw =
    import.meta.env.VITE_MST_MAINNET_CHAIN_ID?.trim() || "4646";
  const rpcUrl =
    import.meta.env.VITE_MST_MAINNET_RPC_URL?.trim() ||
    "https://mariorpc.mstblockchain.com/";

  const chainId = Number.parseInt(chainIdRaw, 10);
  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    return null;
  }

  const symbol =
    import.meta.env.VITE_MST_MAINNET_CURRENCY_SYMBOL?.trim() || "MSTC";
  const name =
    import.meta.env.VITE_MST_MAINNET_CURRENCY_NAME?.trim() || "MST Mainnet";
  const decimalsRaw =
    import.meta.env.VITE_MST_MAINNET_CURRENCY_DECIMALS?.trim() || "18";
  const decimals = Number.parseInt(decimalsRaw, 10);

  return {
    chainId,
    rpcUrl,
    explorerUrl:
      import.meta.env.VITE_MST_MAINNET_EXPLORER_URL?.trim() ||
      "https://mstscan.com",
    nativeCurrencySymbol: symbol,
    nativeCurrencyName: name,
    nativeCurrencyDecimals: Number.isFinite(decimals) ? decimals : 18,
  };
}

export function isMstMainnetConfigured(): boolean {
  return getMstMainnetEnvConfig() !== null;
}

/**
 * Resolves contract address for MST Testnet.
 * Defaults to the verified deployment address: 0x06289D9c452369abcb9bc1b5D6Adf80982C5679C.
 */
export function getMandiMintContractAddress(): string | null {
  const raw =
    import.meta.env.VITE_MANDIMINT_TESTNET_CONTRACT_ADDRESS?.trim() ||
    import.meta.env.VITE_MANDIMINT_CONTRACT_ADDRESS?.trim() ||
    "0x06289D9c452369abcb9bc1b5D6Adf80982C5679C";

  return raw && isAddress(raw) ? getAddress(raw) : null;
}

/**
 * Resolves contract address for MST Mainnet.
 * Must NOT default to Testnet address. Returns null if not yet deployed/configured.
 */
export function getMandiMintMainnetContractAddress(): string | null {
  const raw = import.meta.env.VITE_MANDIMINT_MAINNET_CONTRACT_ADDRESS?.trim();
  return raw && isAddress(raw) ? getAddress(raw) : null;
}

export function isMandiMintContractConfigured(): boolean {
  return getMandiMintContractAddress() !== null;
}

export function getMstTestnetExplorerUrl(): string | null {
  return (
    import.meta.env.VITE_MST_TESTNET_EXPLORER_URL?.trim() ||
    "https://testnet.mstscan.com"
  );
}

export function getMstMainnetExplorerUrl(): string | null {
  return (
    import.meta.env.VITE_MST_MAINNET_EXPLORER_URL?.trim() ||
    "https://mstscan.com"
  );
}
