import { getAddress, isAddress } from "ethers";
import {
  getMandiMintContractAddress,
  getMstTestnetEnvConfig,
  type MstTestnetEnvConfig,
} from "./env";

export interface MandiMintContractConfig {
  address: string;
  chain: MstTestnetEnvConfig;
}

export function getMandiMintContractConfig(): MandiMintContractConfig | null {
  const chain = getMstTestnetEnvConfig();
  const rawAddress = getMandiMintContractAddress();

  if (!chain || !rawAddress || !isAddress(rawAddress)) {
    return null;
  }

  return {
    address: getAddress(rawAddress),
    chain,
  };
}

export function isMandiMintReady(): boolean {
  return getMandiMintContractConfig() !== null;
}

export function getMandiMintEnvIssues(): string[] {
  const issues: string[] = [];
  const rawAddress = getMandiMintContractAddress();
  const chain = getMstTestnetEnvConfig();

  if (!chain) {
    issues.push(
      "Set VITE_MST_TESTNET_CHAIN_ID and VITE_MST_TESTNET_RPC_URL to the official MST Testnet values.",
    );
  }

  if (!rawAddress) {
    issues.push("Set VITE_MANDIMINT_CONTRACT_ADDRESS to the deployed contract address.");
  } else if (!isAddress(rawAddress)) {
    issues.push(
      "VITE_MANDIMINT_CONTRACT_ADDRESS is not a valid EVM address; no contract calls are made.",
    );
  }

  return issues;
}
