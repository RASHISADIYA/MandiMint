/**
 * Public Vite environment configuration.
 * All VITE_* values are exposed to the client bundle — never put secrets here.
 */

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

export interface MstTestnetEnvConfig {
  chainId: number;
  rpcUrl: string;
  explorerUrl?: string;
  nativeCurrencySymbol: string;
  nativeCurrencyName: string;
  nativeCurrencyDecimals: number;
}

export function getMstTestnetEnvConfig(): MstTestnetEnvConfig | null {
  const chainIdRaw = import.meta.env.VITE_MST_TESTNET_CHAIN_ID?.trim();
  const rpcUrl = import.meta.env.VITE_MST_TESTNET_RPC_URL?.trim();
  if (!chainIdRaw || !rpcUrl) {
    return null;
  }

  const chainId = Number.parseInt(chainIdRaw, 10);
  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    return null;
  }

  const symbol =
    import.meta.env.VITE_MST_TESTNET_CURRENCY_SYMBOL?.trim() || "tMSTC";
  const name =
    import.meta.env.VITE_MST_TESTNET_CURRENCY_NAME?.trim() || "MST Testnet";
  const decimalsRaw =    import.meta.env.VITE_MST_TESTNET_CURRENCY_DECIMALS?.trim() || "18";
  const decimals = Number.parseInt(decimalsRaw, 10);

  return {
    chainId,
    rpcUrl,
    explorerUrl: import.meta.env.VITE_MST_TESTNET_EXPLORER_URL?.trim() || undefined,
    nativeCurrencySymbol: symbol,
    nativeCurrencyName: name,
    nativeCurrencyDecimals: Number.isFinite(decimals) ? decimals : 18,
  };
}

export function isMstTestnetConfigured(): boolean {
  return getMstTestnetEnvConfig() !== null;
}

export function getMandiMintContractAddress(): string | null {
  const address = import.meta.env.VITE_MANDIMINT_CONTRACT_ADDRESS?.trim();
  return address || null;
}

export function isMandiMintContractConfigured(): boolean {
  return getMandiMintContractAddress() !== null;
}

export function getMstTestnetExplorerUrl(): string | null {
  return import.meta.env.VITE_MST_TESTNET_EXPLORER_URL?.trim() || null;
}
