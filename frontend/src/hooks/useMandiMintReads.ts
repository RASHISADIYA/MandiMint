import { isAddress } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { isMandiMintReady } from "../config/blockchain";
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
}

function useReadState<T>(
  enabled: boolean,
  loader: () => Promise<T>,
  dependencies: readonly unknown[],
): ContractReadState<T> {
  const configured = isMandiMintReady();
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
  }, [configured, enabled, reloadToken, ...dependencies]);

  return { status, data, error, reload };
}

export function useBatchDetails(
  batchId: bigint | null,
): ContractReadState<MandiMintBatchDetails> {
  return useReadState(
    batchId !== null,
    () => {
      if (batchId === null) {
        return Promise.reject(new Error("A batch ID is required."));
      }
      return readBatchDetails(batchId);
    },
    [batchId],
  );
}

export function useFarmerHistory(
  farmer: string | null,
): ContractReadState<FarmerAllocationRow[]> {
  const validAddress = farmer !== null && isAddress(farmer);
  return useReadState(
    validAddress,
    () => {
      if (!farmer) {
        return Promise.reject(new Error("A farmer wallet address is required."));
      }
      return readFarmerAllocations(farmer);
    },
    [farmer],
  );
}

export function useManagerStatus(
  address: string | null,
): ContractReadState<boolean> {
  const validAddress = address !== null && isAddress(address);
  return useReadState(
    validAddress,
    () => {
      if (!address) {
        return Promise.reject(new Error("A wallet address is required."));
      }
      return readManagerStatus(address);
    },
    [address],
  );
}
