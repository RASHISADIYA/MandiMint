import { getAddress, isAddress } from "ethers";
import {
  getMandiMintContractAddress,
  getMandiMintMainnetContractAddress,
  getMstMainnetEnvConfig,
  getMstTestnetEnvConfig,
  type NetworkEnvConfig,
} from "./env";
import {
  getNetworkConfig,
  type NetworkId,
} from "./networks";

export interface MandiMintContractConfig {
  address: string;
  chain: NetworkEnvConfig;
  networkId: NetworkId;
  isMainnet: boolean;
  isTestnet: boolean;
}

export function getMandiMintContractConfig(
  networkId: NetworkId = "mstTestnet",
): MandiMintContractConfig | null {
  const chain =
    networkId === "mstMainnet"
      ? getMstMainnetEnvConfig()
      : getMstTestnetEnvConfig();

  const rawAddress =
    networkId === "mstMainnet"
      ? getMandiMintMainnetContractAddress()
      : getMandiMintContractAddress();

  if (!chain || !rawAddress || !isAddress(rawAddress)) {
    return null;
  }

  return {
    address: getAddress(rawAddress),
    chain,
    networkId,
    isMainnet: networkId === "mstMainnet",
    isTestnet: networkId === "mstTestnet",
  };
}

export function isMandiMintReady(networkId: NetworkId = "mstTestnet"): boolean {
  return getMandiMintContractConfig(networkId) !== null;
}

export function getMandiMintEnvIssues(
  networkId: NetworkId = "mstTestnet",
): string[] {
  const issues: string[] = [];
  const network = getNetworkConfig(networkId);

  if (networkId === "mstTestnet") {
    const rawAddress = getMandiMintContractAddress();
    const chain = getMstTestnetEnvConfig();

    if (!chain) {
      issues.push(
        "Set VITE_MST_TESTNET_CHAIN_ID and VITE_MST_TESTNET_RPC_URL to the official MST Testnet values.",
      );
    }

    if (!rawAddress) {
      issues.push(
        "Set VITE_MANDIMINT_CONTRACT_ADDRESS to the deployed contract address on MST Testnet.",
      );
    } else if (!isAddress(rawAddress)) {
      issues.push(
        "VITE_MANDIMINT_CONTRACT_ADDRESS is not a valid EVM address; no contract calls are made.",
      );
    }
  } else {
    // Mainnet
    const rawAddress = getMandiMintMainnetContractAddress();
    const chain = getMstMainnetEnvConfig();

    if (!chain) {
      issues.push(
        "Set VITE_MST_MAINNET_CHAIN_ID and VITE_MST_MAINNET_RPC_URL to the official MST Mainnet values.",
      );
    }

    if (!rawAddress) {
      issues.push(
        `MandiMint is not yet deployed on ${network.name}. Write operations are disabled until official contract deployment.`,
      );
    } else if (!isAddress(rawAddress)) {
      issues.push(
        "VITE_MANDIMINT_MAINNET_CONTRACT_ADDRESS is not a valid EVM address.",
      );
    }
  }

  return issues;
}
