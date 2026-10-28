import type { ConnectedWallet } from "@privy-io/react-auth";
import {
  Contract,
  Interface,
  JsonRpcProvider,
  type ContractTransactionResponse,
} from "ethers";
import {
  getMandiMintContractConfig,
  type MandiMintContractConfig,
} from "../../config/blockchain";
import { formatQuantityKg } from "../format";
import { getEmbeddedEthersSigner } from "../ethers/embeddedSigner";
import { MANDIMINT_ABI } from "./mandiMintAbi";

export interface MandiMintBatch {
  batchId: bigint;
  cropId: bigint;
  totalQuantityKg: bigint;
  salePriceInrPerTonne: bigint;
  manager: string;
  createdAt: bigint;
}

export interface MandiMintAllocation {
  farmer: string;
  quantityKg: bigint;
}

export interface MandiMintBatchDetails extends MandiMintBatch {
  allocations: MandiMintAllocation[];
}

export interface FarmerAllocationRow {
  batchId: bigint;
  quantityKg: bigint;
}

export interface RecordBatchParams {
  batchId: bigint;
  cropId: bigint;
  totalQuantityKg: bigint;
  salePriceInrPerTonne: bigint;
  farmers: string[];
  quantitiesKg: bigint[];
}

export class MandiMintNotConfiguredError extends Error {
  constructor() {
    super(
      "MandiMint contract or MST Testnet is not configured. No blockchain calls were made.",
    );
    this.name = "MandiMintNotConfiguredError";
  }
}

const contractInterface = new Interface(MANDIMINT_ABI);

let cachedProvider: JsonRpcProvider | null = null;
let cachedProviderKey = "";

function requireConfig(): MandiMintContractConfig {
  const config = getMandiMintContractConfig();
  if (!config) {
    throw new MandiMintNotConfiguredError();
  }
  return config;
}

function getReadProvider(config: MandiMintContractConfig): JsonRpcProvider {
  const key = `${config.chain.chainId}:${config.chain.rpcUrl}`;
  if (!cachedProvider || cachedProviderKey !== key) {
    cachedProvider = new JsonRpcProvider(config.chain.rpcUrl, config.chain.chainId, {
      staticNetwork: true,
    });
    cachedProviderKey = key;
  }
  return cachedProvider;
}

function getReadContract(): Contract {
  const config = requireConfig();
  return new Contract(
    config.address,
    MANDIMINT_ABI,
    getReadProvider(config),
  );
}

export async function readBatch(batchId: bigint): Promise<MandiMintBatch> {
  const result = await getReadContract().getBatch(batchId);

  return {
    batchId: result[0] as bigint,
    cropId: result[1] as bigint,
    totalQuantityKg: result[2] as bigint,
    salePriceInrPerTonne: result[3] as bigint,
    manager: result[4] as string,
    createdAt: result[5] as bigint,
  };
}

export async function readBatchDetails(
  batchId: bigint,
): Promise<MandiMintBatchDetails> {
  const batch = await readBatch(batchId);
  const result = await getReadContract().getBatchAllocations(batchId);
  const farmers = result[0] as string[];
  const quantitiesKg = result[1] as bigint[];

  return {
    ...batch,
    allocations: farmers.map((farmer, index) => ({
      farmer,
      quantityKg: quantitiesKg[index] ?? 0n,
    })),
  };
}

export async function readFarmerAllocations(
  farmer: string,
): Promise<FarmerAllocationRow[]> {
  const result = await getReadContract().getFarmerAllocations(farmer);
  const batchIds = result[0] as bigint[];
  const quantitiesKg = result[1] as bigint[];

  return batchIds.map((batchId, index) => ({
    batchId,
    quantityKg: quantitiesKg[index] ?? 0n,
  }));
}

export async function readFarmerAllocation(
  batchId: bigint,
  farmer: string,
): Promise<bigint> {
  return (await getReadContract().getFarmerAllocation(batchId, farmer)) as bigint;
}

export async function readManagerStatus(address: string): Promise<boolean> {
  return (await getReadContract().isManager(address)) as boolean;
}

export async function readOwner(): Promise<string> {
  return (await getReadContract().owner()) as string;
}

export async function submitRecordBatch(
  wallet: ConnectedWallet,
  params: RecordBatchParams,
): Promise<ContractTransactionResponse> {
  const config = requireConfig();
  const signer = await getEmbeddedEthersSigner(wallet);
  const provider = signer.provider;

  if (!provider) {
    throw new Error("The connected wallet did not expose an ethers provider.");
  }

  const network = await provider.getNetwork();
  const expectedChainId = BigInt(config.chain.chainId);
  if (network.chainId !== expectedChainId) {
    throw new Error(
      `Connected wallet is on chain ${network.chainId.toString()}, but MandiMint requires chain ${expectedChainId.toString()}.`,
    );
  }

  const contract = new Contract(config.address, MANDIMINT_ABI, signer);
  return (await contract.recordBatch(
    params.batchId,
    params.cropId,
    params.totalQuantityKg,
    params.salePriceInrPerTonne,
    params.farmers,
    params.quantitiesKg,
  )) as ContractTransactionResponse;
}

export function getExplorerTransactionUrl(hash: string): string | null {
  const config = getMandiMintContractConfig();
  if (!config?.chain.explorerUrl) {
    return null;
  }
  return `${config.chain.explorerUrl.replace(/\/$/, "")}/tx/${hash}`;
}

export function getExplorerAddressUrl(address: string): string | null {
  const config = getMandiMintContractConfig();
  if (!config?.chain.explorerUrl) {
    return null;
  }
  return `${config.chain.explorerUrl.replace(/\/$/, "")}/address/${address}`;
}

function extractRevertData(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const candidate = error as {
    data?: unknown;
    revert?: { data?: unknown };
    info?: { error?: { data?: unknown } };
    error?: { data?: unknown };
  };

  const values = [
    candidate.data,
    candidate.revert?.data,
    candidate.info?.error?.data,
    candidate.error?.data,
  ];

  for (const value of values) {
    if (typeof value === "string" && value.startsWith("0x")) {
      return value;
    }
    if (value && typeof value === "object" && "data" in value) {
      const nested = (value as { data?: unknown }).data;
      if (typeof nested === "string" && nested.startsWith("0x")) {
        return nested;
      }
    }
  }

  return null;
}

function revertArgsToString(args: readonly unknown[] | undefined): string[] {
  return (args ?? []).map((value) =>
    typeof value === "bigint" ? value.toString() : String(value),
  );
}

export function formatContractError(error: unknown): string {
  if (!error) {
    return "The blockchain request failed.";
  }

  const candidate = error as {
    code?: string | number;
    reason?: string;
    shortMessage?: string;
    message?: string;
    revert?: { name?: string; args?: readonly unknown[] };
  };

  if (
    candidate.code === "ACTION_REJECTED" ||
    candidate.code === 4001 ||
    candidate.message?.toLowerCase().includes("user rejected")
  ) {
    return "The transaction was rejected in your wallet.";
  }

  let parsedName = candidate.revert?.name;
  let parsedArgs = candidate.revert?.args;

  if (!parsedName) {
    const data = extractRevertData(error);
    if (data) {
      try {
        const parsed = contractInterface.parseError(data);
        parsedName = parsed?.name;
        parsedArgs = parsed?.args;
      } catch {
        // Fall through to the generic message below.
      }
    }
  }

  const args = revertArgsToString(parsedArgs);

  switch (parsedName) {
    case "NotManager":
      return "This wallet is not an authorized FPO manager for the contract.";
    case "NotOwner":
      return "Only the contract owner can change manager authorization.";
    case "BatchAlreadyExists":
      return `Batch ${args[0] ?? ""} is already recorded and cannot be replaced.`.trim();
    case "BatchNotFound":
      return `No batch was found with ID ${args[0] ?? ""}.`.trim();
    case "AllocationTotalMismatch":
      return `Allocations total ${formatQuantityKg(
        BigInt(args[1] ?? "0"),
      )}, but the batch total is ${formatQuantityKg(BigInt(args[0] ?? "0"))}.`;
    case "DuplicateFarmer":
      return `Farmer ${args[0] ?? ""} appears more than once in the allocation list.`.trim();
    case "EmptyAllocations":
      return "Add at least one farmer allocation.";
    case "ArrayLengthMismatch":
      return "Farmer and quantity lists do not match. Refresh and try again.";
    case "ZeroAddress":
      return "The zero address cannot be used for a manager.";
    case "ZeroBatchId":
      return "Batch ID must be greater than zero.";
    case "ZeroCropId":
      return "Crop ID must be greater than zero.";
    case "ZeroTotalQuantity":
      return "Total quantity must be greater than zero.";
    case "ZeroSalePrice":
      return "Sale price must be greater than zero.";
    case "ZeroFarmerAddress":
      return "A farmer wallet address is missing.";
    case "ZeroAllocation":
      return "Each farmer allocation must be greater than zero.";
    default:
      break;
  }

  if (candidate.reason) {
    return candidate.reason;
  }
  if (candidate.shortMessage) {
    return candidate.shortMessage;
  }
  if (candidate.message) {
    return candidate.message;
  }

  return "The blockchain request failed. Check your connection and try again.";
}

/** @internal Used only to confirm the ABI matches the contract at runtime. */
export function getContractInterface(): Interface {
  return contractInterface;
}
