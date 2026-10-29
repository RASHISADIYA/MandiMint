import type { ConnectedWallet } from "@privy-io/react-auth";
import {
  Contract,
  Interface,
  JsonRpcProvider,
  type ContractTransactionResponse,
  type Signer,
} from "ethers";
import {
  getMandiMintContractConfig,
  type MandiMintContractConfig,
} from "../../config/blockchain";
import { type NetworkId } from "../../config/networks";
import { formatQuantityKg } from "../format";
import { getEmbeddedEthersSigner } from "../ethers/embeddedSigner";
import { MANDIMINT_ABI } from "./mandiMintAbi";
import defaultVerifiedBatches from "../../config/verifiedBatches.json";

export type SignerOrWallet = Signer | ConnectedWallet;

export async function resolveSigner(signerOrWallet: SignerOrWallet): Promise<Signer> {
  if (
    signerOrWallet &&
    typeof (signerOrWallet as Signer).getAddress === "function" &&
    typeof (signerOrWallet as Signer).signMessage === "function" &&
    !("getEthereumProvider" in signerOrWallet)
  ) {
    return signerOrWallet as Signer;
  }
  return getEmbeddedEthersSigner(signerOrWallet as ConnectedWallet);
}

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
  public readonly networkId: NetworkId;
  constructor(networkId: NetworkId = "mstTestnet") {
    const netName = networkId === "mstMainnet" ? "MST Mainnet" : "MST Testnet";
    super(
      `MandiMint smart contract is not deployed or configured on ${netName}. Write operations are disabled until official contract deployment.`,
    );
    this.name = "MandiMintNotConfiguredError";
    this.networkId = networkId;
  }
}

export type GasPreflightStatus = "sufficient" | "insufficient" | "unknown";

export interface GasPreflightResult {
  status: GasPreflightStatus;
  address: string;
  balance: bigint | null;
  estimatedCost: bigint | null;
  error?: string;
}

const contractInterface = new Interface(MANDIMINT_ABI);

const cachedProviders = new Map<string, JsonRpcProvider>();

function requireConfig(networkId: NetworkId = "mstTestnet"): MandiMintContractConfig {
  const config = getMandiMintContractConfig(networkId);
  if (!config) {
    throw new MandiMintNotConfiguredError(networkId);
  }
  return config;
}

function getReadProvider(config: MandiMintContractConfig): JsonRpcProvider {
  const key = `${config.chain.chainId}:${config.chain.rpcUrl}`;
  let provider = cachedProviders.get(key);
  if (!provider) {
    provider = new JsonRpcProvider(config.chain.rpcUrl, config.chain.chainId, {
      staticNetwork: true,
    });
    cachedProviders.set(key, provider);
  }
  return provider;
}

export function getReadContract(networkId: NetworkId = "mstTestnet"): Contract {
  const config = requireConfig(networkId);
  return new Contract(
    config.address,
    MANDIMINT_ABI,
    getReadProvider(config),
  );
}

export async function readBatch(
  batchId: bigint,
  networkId: NetworkId = "mstTestnet",
): Promise<MandiMintBatch> {
  const result = await getReadContract(networkId).getBatch(batchId);

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
  networkId: NetworkId = "mstTestnet",
): Promise<MandiMintBatchDetails> {
  const batch = await readBatch(batchId, networkId);
  const result = await getReadContract(networkId).getBatchAllocations(batchId);
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
  networkId: NetworkId = "mstTestnet",
): Promise<FarmerAllocationRow[]> {
  const result = await getReadContract(networkId).getFarmerAllocations(farmer);
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
  networkId: NetworkId = "mstTestnet",
): Promise<bigint> {
  return (await getReadContract(networkId).getFarmerAllocation(batchId, farmer)) as bigint;
}

export async function readManagerStatus(
  address: string,
  networkId: NetworkId = "mstTestnet",
): Promise<boolean> {
  try {
    return (await getReadContract(networkId).isManager(address)) as boolean;
  } catch {
    return false;
  }
}

export async function readOwner(
  networkId: NetworkId = "mstTestnet",
): Promise<string> {
  return (await getReadContract(networkId).owner()) as string;
}

export async function updateManagerStatus(
  walletOrSigner: SignerOrWallet,
  manager: string,
  authorized: boolean,
  targetNetworkId: NetworkId = "mstTestnet",
): Promise<ContractTransactionResponse> {
  const config = requireConfig(targetNetworkId);
  const signer = await resolveSigner(walletOrSigner);
  const provider = signer.provider;

  if (!provider) {
    throw new Error("The connected wallet did not expose an ethers provider.");
  }

  const network = await provider.getNetwork();
  const expectedChainId = BigInt(config.chain.chainId);
  if (network.chainId !== expectedChainId) {
    throw new Error(
      `Connected wallet is on chain ${network.chainId}, but ${config.chain.nativeCurrencyName} requires chain ${expectedChainId.toString()}.`,
    );
  }

  const contract = new Contract(config.address, MANDIMINT_ABI, signer);
  return (await contract.setManager(manager, authorized)) as ContractTransactionResponse;
}

export async function estimateRecordBatchGas(
  walletOrSigner: SignerOrWallet,
  _params: RecordBatchParams,
  targetNetworkId: NetworkId = "mstTestnet",
): Promise<GasPreflightResult> {
  void _params;
  const config = getMandiMintContractConfig(targetNetworkId);
  if (!config) {
    return {
      status: "unknown",
      address: "",
      balance: null,
      estimatedCost: null,
      error: `MandiMint contract is not configured on ${targetNetworkId === "mstMainnet" ? "MST Mainnet" : "MST Testnet"}.`,
    };
  }

  const signer = await resolveSigner(walletOrSigner);
  const provider = signer.provider;

  if (!provider) {
    return {
      status: "unknown",
      address: "",
      balance: null,
      estimatedCost: null,
      error: "The connected wallet did not expose an ethers provider.",
    };
  }

  let address = "";
  try {
    address = await signer.getAddress();
  } catch {
    return {
      status: "unknown",
      address: "",
      balance: null,
      estimatedCost: null,
      error: "Could not read the connected wallet address.",
    };
  }

  let balance: bigint;
  try {
    balance = await provider.getBalance(address);
  } catch {
    return {
      status: "unknown",
      address,
      balance: null,
      estimatedCost: null,
      error: "Could not read the wallet balance.",
    };
  }

  const network = await provider.getNetwork();
  const expectedChainId = BigInt(config.chain.chainId);
  if (BigInt(network.chainId) !== expectedChainId) {
    return {
      status: "unknown",
      address,
      balance,
      estimatedCost: null,
      error: `Connected wallet is on chain ${network.chainId}, but MandiMint requires chain ${expectedChainId.toString()}.`,
    };
  }

  let feeData: { maxFeePerGas?: bigint | null; gasPrice?: bigint | null };
  try {
    feeData = await provider.getFeeData();
  } catch {
    return {
      status: "unknown",
      address,
      balance,
      estimatedCost: null,
      error: "Could not read network fee data.",
    };
  }

  const maxFeePerGas = feeData.maxFeePerGas ?? feeData.gasPrice ?? null;
  if (!maxFeePerGas) {
    return {
      status: "unknown",
      address,
      balance,
      estimatedCost: null,
      error: "Network fee data is unavailable.",
    };
  }

  const gasEstimate = 300000n;
  const estimatedCost = gasEstimate * maxFeePerGas;
  const safetyMargin = maxFeePerGas * BigInt(21000); // simple transfer buffer

  if (balance > estimatedCost + safetyMargin) {
    return {
      status: "sufficient",
      address,
      balance,
      estimatedCost,
    };
  }

  return {
    status: "insufficient",
    address,
    balance,
    estimatedCost,
  };
}

export async function submitRecordBatch(
  walletOrSigner: SignerOrWallet,
  params: RecordBatchParams,
  targetNetworkId: NetworkId = "mstTestnet",
): Promise<ContractTransactionResponse> {
  const config = requireConfig(targetNetworkId);
  const signer = await resolveSigner(walletOrSigner);
  const provider = signer.provider;

  if (!provider) {
    throw new Error("The connected wallet did not expose an ethers provider.");
  }

  const network = await provider.getNetwork();
  const expectedChainId = BigInt(config.chain.chainId);
  if (BigInt(network.chainId) !== expectedChainId) {
    throw new Error(
      `Connected wallet is on chain ${network.chainId}, but ${targetNetworkId === "mstMainnet" ? "MST Mainnet" : "MST Testnet"} requires chain ${expectedChainId.toString()}.`,
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

export interface VerifiedBatchRecord {
  batchId: number;
  cropId: number;
  cropName: string;
  mandiName: string;
  totalQuantityKg: number;
  salePriceInrPerTonne: number;
  txHash?: string | null;
  blockNumber?: number | null;
  manager: string;
  contractAddress?: string | null;
  explorerUrl?: string | null;
  status: string;
  createdAt: number;
  isSample?: boolean;
  networkId?: string;
  farmers: Array<{ address: string; quantityKg: number }>;
}

export function getSampleBatches(): VerifiedBatchRecord[] {
  return defaultVerifiedBatches as unknown as VerifiedBatchRecord[];
}

export function getRecordedBatches(networkId: NetworkId = "mstTestnet"): VerifiedBatchRecord[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  try {
    const storageKey = `mandimint_custom_batches_${networkId}`;
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getVerifiedBatches(networkId: NetworkId = "mstTestnet"): VerifiedBatchRecord[] {
  // Retained for backwards compatibility. Sample batches are explicitly flagged with isSample: true and txHash: null.
  // Mainnet returns an empty array to maintain strict data separation.
  if (networkId === "mstTestnet") {
    return defaultVerifiedBatches as unknown as VerifiedBatchRecord[];
  }
  return [];
}

export function getExplorerTransactionUrl(hash: string | null | undefined, networkId: NetworkId = "mstTestnet"): string | null {
  if (!hash) return null;
  const config = getMandiMintContractConfig(networkId);
  const explorerUrl =
    config?.chain.explorerUrl ||
    (networkId === "mstMainnet"
      ? "https://mstscan.com"
      : "https://testnet.mstscan.com");
  return `${explorerUrl.replace(/\/$/, "")}/tx/${hash}`;
}

export function getExplorerAddressUrl(address: string, networkId: NetworkId = "mstTestnet"): string | null {
  const config = getMandiMintContractConfig(networkId);
  const explorerUrl =
    config?.chain.explorerUrl ||
    (networkId === "mstMainnet"
      ? "https://mstscan.com"
      : "https://testnet.mstscan.com");
  return `${explorerUrl.replace(/\/$/, "")}/address/${address}`;
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

  if (
    candidate.code === -32000 ||
    candidate.message?.toLowerCase().includes("insufficient funds")
  ) {
    return "Insufficient native tMSTC for gas. Fund your connected wallet and try again.";
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
        // Fall through to generic handler
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
      return `Batch ${args[0] ?? ""} is already recorded on-chain and cannot be replaced.`.trim();
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
