import type { ConnectedWallet } from "@privy-io/react-auth";
import { BrowserProvider } from "ethers";
import type { NetworkVerificationState } from "./types";

/** Pure chain comparison for tests and UI (does not imply RPC connectivity). */
export function classifyChainMatch(
  actualChainId: number,
  expectedChainId: number,
): "connected" | "wrong_network" {
  return actualChainId === expectedChainId ? "connected" : "wrong_network";
}

function idleState(): NetworkVerificationState {
  return {
    status: "idle",
    expectedChainId: null,
    actualChainId: null,
    message: null,
  };
}

/**
 * Reads the wallet's active chain via EIP-1193 + ethers v6 BrowserProvider.
 * Does not treat configured RPC URLs as proof of connection.
 */
export async function verifyWalletNetwork(
  wallet: ConnectedWallet,
  expectedChainId: number,
): Promise<NetworkVerificationState> {
  try {
    const eip1193 = await wallet.getEthereumProvider();
    const provider = new BrowserProvider(eip1193);
    const network = await provider.getNetwork();
    const actualChainId = Number(network.chainId);

    if (!Number.isSafeInteger(actualChainId)) {
      return {
        status: "provider_unavailable",
        expectedChainId,
        actualChainId: null,
        message: "Could not read a valid chain ID from the wallet provider.",
      };
    }

    const match = classifyChainMatch(actualChainId, expectedChainId);
    if (match === "wrong_network") {
      return {
        status: "wrong_network",
        expectedChainId,
        actualChainId,
        message: `Wallet is on chain ${actualChainId}, but MST Testnet expects ${expectedChainId}.`,
      };
    }

    return {
      status: "connected",
      expectedChainId,
      actualChainId,
      message: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Network verification failed.";

    if (/user rejected|denied|cancel/i.test(message)) {
      return {
        status: "provider_rejected",
        expectedChainId,
        actualChainId: null,
        message,
      };
    }

    if (/disconnect|not connected|unavailable/i.test(message)) {
      return {
        status: "wallet_unavailable",
        expectedChainId,
        actualChainId: null,
        message,
      };
    }

    return {
      status: "rpc_unavailable",
      expectedChainId,
      actualChainId: null,
      message,
    };
  }
}

export function unconfiguredNetworkState(): NetworkVerificationState {
  return {
    status: "unconfigured",
    expectedChainId: null,
    actualChainId: null,
    message:
      "MST Testnet chain ID and RPC URL are not configured in the frontend environment.",
  };
}

export { idleState };
