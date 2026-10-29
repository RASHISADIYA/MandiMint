import { isAddress } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { isMandiMintReady } from "../config/blockchain";
import { type NetworkId } from "../config/networks";
import { useWeb3Wallet } from "../providers/Web3WalletContext";
import {
  formatContractError,
  readBatchDetails,
  readFarmerAllocations,
  readManagerStatus,
  type FarmerAllocationRow,
  type MandiMintBatchDetails,
} from "../lib/blockchain/mandiMintContract";

export type ContractReadStatus =
  | "idle"
  | "loading"
  | "success"
  | "error"
  | "unconfigured";

export interface ContractReadState<T> {
  status: ContractReadStatus;
  data: T | null;
  error: string | null;
  reload: () => void;
  networkId: NetworkId;
}

function useReadState<T>(
  enabled: boolean,
  networkId: NetworkId,
  loader: () => Promise<T>,
  dependencies: readonly unknown[],
): ContractReadState<T> {
  const configured = isMandiMintReady(networkId);
  const [status, setStatus] = useState<ContractReadStatus>("idle");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!configured) {
      setStatus("unconfigured");
      setData(null);
      setError(null);
      return;
    }

    if (!enabled) {
      setStatus("idle");
      setData(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setError(null);

    loader()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setStatus("success");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setData(null);
          setError(formatContractError(err));
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
    // The loader is intentionally recreated from the caller's dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, enabled, networkId, reloadToken, ...dependencies]);

  return { status, data, error, reload, networkId };
}

export function useBatchDetails(
  batchId: bigint | null,
  overrideNetworkId?: NetworkId,
): ContractReadState<MandiMintBatchDetails> {
  const web3 = useWeb3Wallet();
  const activeNetworkId = overrideNetworkId || web3.selectedNetwork;

  return useReadState(
    batchId !== null,
    activeNetworkId,
    () => {
      if (batchId === null) {
        return Promise.reject(new Error("A batch ID is required."));
      }
      return readBatchDetails(batchId, activeNetworkId);
    },
    [batchId, activeNetworkId],
  );
}

export function useFarmerHistory(
  farmer: string | null,
  overrideNetworkId?: NetworkId,
): ContractReadState<FarmerAllocationRow[]> {
  const web3 = useWeb3Wallet();
  const activeNetworkId = overrideNetworkId || web3.selectedNetwork;
  const validAddress = farmer !== null && isAddress(farmer);

  return useReadState(
    validAddress,
    activeNetworkId,
    () => {
      if (!farmer) {
        return Promise.reject(new Error("A farmer wallet address is required."));
      }
      return readFarmerAllocations(farmer, activeNetworkId);
    },
    [farmer, activeNetworkId],
  );
}

export function useManagerStatus(
  address: string | null,
  overrideNetworkId?: NetworkId,
): ContractReadState<boolean> {
  const web3 = useWeb3Wallet();
  const activeNetworkId = overrideNetworkId || web3.selectedNetwork;
  const validAddress = address !== null && isAddress(address);

  return useReadState(
    validAddress,
    activeNetworkId,
    () => {
      if (!address) {
        return Promise.reject(new Error("A wallet address is required."));
      }
      return readManagerStatus(address, activeNetworkId);
    },
    [address, activeNetworkId],
  );
}
