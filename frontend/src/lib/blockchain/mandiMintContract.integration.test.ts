import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ConnectedWallet } from "@privy-io/react-auth";
import {
  ContractFactory,
  Interface,
  JsonRpcProvider,
  type InterfaceAbi,
} from "ethers";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { MANDIMINT_ABI } from "./mandiMintAbi";
import {
  formatContractError,
  getContractInterface,
  readBatchDetails,
  readFarmerAllocations,
  readManagerStatus,
  submitRecordBatch,
  type RecordBatchParams,
} from "./mandiMintContract";

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const artifactPath = resolve(
  repoRoot,
  "artifacts/contracts/MandiMint.sol/MandiMint.json",
);
const port = 19_000 + Math.floor(Math.random() * 5_000);
const rpcUrl = `http://127.0.0.1:${port}`;

let hardhatNode: ChildProcess | null = null;
let nodeOutput = "";
let artifactAbi: InterfaceAbi = [];
let contractAddress = "";
let accounts: string[] = [];

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolveDelay) => {
    setTimeout(resolveDelay, milliseconds);
  });
}

async function waitForRpc(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_chainId",
          params: [],
        }),
      });
      const body = (await response.json()) as { result?: string };
      if (response.ok && body.result === "0x7a69") {
        return;
      }
    } catch {
      await delay(250);
      continue;
    }
    await delay(250);
  }

  throw new Error(`Hardhat node did not become ready.\n${nodeOutput}`);
}

function createEip1193(account: string, rejectSend = false) {
  let requestId = 0;

  return {
    async request({
      method,
      params,
    }: {
      method: string;
      params?: unknown[];
    }): Promise<unknown> {
      if (method === "eth_accounts" || method === "eth_requestAccounts") {
        return [account];
      }
      if (method === "eth_sendTransaction" && rejectSend) {
        const error = new Error("User rejected the request.");
        Object.assign(error, { code: 4001 });
        throw error;
      }

      requestId += 1;
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: requestId,
          method,
          params: params ?? [],
        }),
      });
      const body = (await response.json()) as {
        result?: unknown;
        error?: { code: number; message: string; data?: unknown };
      };

      if (body.error) {
        const error = new Error(body.error.message);
        Object.assign(error, {
          code: body.error.code,
          data: body.error.data,
        });
        throw error;
      }

      return body.result;
    },
  };
}

function createWallet(account: string, rejectSend = false): ConnectedWallet {
  return {
    getEthereumProvider: async () => createEip1193(account, rejectSend),
  } as unknown as ConnectedWallet;
}

function makeBatch(batchId: bigint, overrides: Partial<RecordBatchParams> = {}) {
  return {
    batchId,
    cropId: 7n,
    totalQuantityKg: 1_500n,
    salePriceInrPerTonne: 2_501n,
    farmers: [accounts[2], accounts[3]],
    quantitiesKg: [1_000n, 500n],
    ...overrides,
  };
}

beforeAll(async () => {
  if (!existsSync(artifactPath)) {
    throw new Error(
      "Compiled contract artifact is missing. Run `npm run compile` before integration tests.",
    );
  }

  const artifact = JSON.parse(readFileSync(artifactPath, "utf8")) as {
    abi: InterfaceAbi;
    bytecode: string;
  };
  artifactAbi = artifact.abi;

  const hardhatBin = resolve(repoRoot, "node_modules/.bin/hardhat");
  hardhatNode = spawn(hardhatBin, ["node", "--port", String(port)], {
    cwd: repoRoot,
    env: {
      ...process.env,
      HARDHAT_DISABLE_TELEMETRY_PROMPT: "true",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  hardhatNode.stdout?.on("data", (chunk: Buffer) => {
    nodeOutput += chunk.toString();
  });
  hardhatNode.stderr?.on("data", (chunk: Buffer) => {
    nodeOutput += chunk.toString();
  });

  await waitForRpc(rpcUrl, 60_000);

  const provider = new JsonRpcProvider(rpcUrl, 31_337, { staticNetwork: true });
  const ownerSigner = await provider.getSigner(0);
  const factory = new ContractFactory(
    artifact.abi,
    artifact.bytecode,
    ownerSigner,
  );
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  contractAddress = await contract.getAddress();
  accounts = (await provider.send("eth_accounts", [])) as string[];

  vi.stubEnv("VITE_MST_TESTNET_CHAIN_ID", "31337");
  vi.stubEnv("VITE_MST_TESTNET_RPC_URL", rpcUrl);
  vi.stubEnv("VITE_MANDIMINT_CONTRACT_ADDRESS", contractAddress);
});

afterAll(async () => {
  vi.unstubAllEnvs();

  if (!hardhatNode || hardhatNode.exitCode !== null) {
    return;
  }

  hardhatNode.kill("SIGTERM");
  await Promise.race([
    new Promise<void>((resolveExit) => {
      hardhatNode?.once("exit", () => resolveExit());
    }),
    delay(5_000),
  ]);

  if (hardhatNode.exitCode === null) {
    hardhatNode.kill("SIGKILL");
  }
});

describe("MandiMint frontend/contract integration", () => {
  it("keeps the frontend ABI in sync with the compiled contract", () => {
    const compiled = new Interface(artifactAbi);
    const frontend = getContractInterface();

    const signatures = (contractInterface: Interface) =>
      contractInterface.fragments.map((fragment) => fragment.format("full")).sort();

    expect(signatures(frontend)).toEqual(signatures(compiled));
    expect(MANDIMINT_ABI.length).toBeGreaterThan(0);
  });

  it("records a batch and reads details, allocations, history, and manager status", async () => {
    const batch = makeBatch(101n);
    const transaction = await submitRecordBatch(createWallet(accounts[0]), batch);
    const receipt = await transaction.wait();

    expect(transaction.hash).toMatch(/^0x[0-9a-f]+$/i);
    expect(receipt?.status).toBe(1);

    const details = await readBatchDetails(101n);
    expect(details.batchId).toBe(101n);
    expect(details.cropId).toBe(7n);
    expect(details.totalQuantityKg).toBe(1_500n);
    expect(details.salePriceInrPerTonne).toBe(2_501n);
    expect(details.manager.toLowerCase()).toBe(accounts[0].toLowerCase());
    expect(details.createdAt).toBeGreaterThan(0n);
    expect(
      details.allocations.map((allocation) => ({
        farmer: allocation.farmer.toLowerCase(),
        quantityKg: allocation.quantityKg,
      })),
    ).toEqual([
      { farmer: accounts[2].toLowerCase(), quantityKg: 1_000n },
      { farmer: accounts[3].toLowerCase(), quantityKg: 500n },
    ]);

    const history = await readFarmerAllocations(accounts[2]);
    expect(history).toEqual([{ batchId: 101n, quantityKg: 1_000n }]);
    expect(await readManagerStatus(accounts[0])).toBe(true);
  });

  it("surfaces NotManager when the wallet is not authorized on-chain", async () => {
    let caught: unknown;

    try {
      await submitRecordBatch(
        createWallet(accounts[1]),
        makeBatch(102n),
      );
    } catch (error) {
      caught = error;
    }

    expect(formatContractError(caught)).toMatch(
      /not an authorized FPO manager/i,
    );
  });

  it("rejects writes when the wallet network does not match the configured chain", async () => {
    vi.stubEnv("VITE_MST_TESTNET_CHAIN_ID", "31338");

    try {
      await expect(
        submitRecordBatch(createWallet(accounts[0]), makeBatch(103n)),
      ).rejects.toThrow(/requires chain 31338/i);
    } finally {
      vi.stubEnv("VITE_MST_TESTNET_CHAIN_ID", "31337");
    }
  });

  it("reports a wallet-rejected transaction clearly", async () => {
    let caught: unknown;

    try {
      await submitRecordBatch(
        createWallet(accounts[0], true),
        makeBatch(104n),
      );
    } catch (error) {
      caught = error;
    }

    expect(formatContractError(caught)).toMatch(/rejected in your wallet/i);
  });
});
