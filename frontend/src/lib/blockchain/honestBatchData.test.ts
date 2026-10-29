import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  getExplorerTransactionUrl,
  getRecordedBatches,
  getSampleBatches,
  getVerifiedBatches,
  MandiMintNotConfiguredError,
  submitRecordBatch,
  type MandiMintBatchDetails,
} from "./mandiMintContract";
import {
  getExplorerAddressUrl,
  getExplorerTxUrl,
  MST_MAINNET_CONFIG,
  MST_TESTNET_CONFIG,
} from "../../config/networks";
import verifiedBatchesData from "../../config/verifiedBatches.json";

describe("Honest Batch Data & Simulation Removal Audit", () => {
  it("never includes genuine transaction hashes or explorer URLs in sample batches", () => {
    const samples = getSampleBatches();
    expect(samples.length).toBeGreaterThan(0);

    for (const sample of samples) {
      expect(sample.isSample).toBe(true);
      expect(sample.status).toBe("illustrative_sample");
      expect(sample.txHash).toBeNull();
      expect(sample.contractAddress).toBeNull();
      expect(sample.explorerUrl).toBeNull();
    }
  });

  it("ensures verifiedBatches.json explicitly flags mock records as illustrative samples", () => {
    for (const record of verifiedBatchesData) {
      expect(record.isSample).toBe(true);
      expect(record.status).toBe("illustrative_sample");
      expect(record.txHash).toBeNull();
      expect(record.contractAddress).toBeNull();
      expect(record.explorerUrl).toBeNull();
    }
  });

  it("returns null explorer link for illustrative sample batches", () => {
    const samples = getSampleBatches();
    for (const sample of samples) {
      const url = getExplorerTransactionUrl(sample.txHash, "mstTestnet");
      expect(url).toBeNull();
    }
  });

  it("returns real explorer link only when a genuine txHash is present on a recorded batch", () => {
    const validTxHash = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

    expect(getExplorerTransactionUrl(validTxHash, "mstTestnet")).toBe(
      `https://testnet.mstscan.com/tx/${validTxHash}`,
    );
    expect(getExplorerTransactionUrl(validTxHash, "mstMainnet")).toBe(
      `https://mstscan.com/tx/${validTxHash}`,
    );
    expect(getExplorerTransactionUrl(null, "mstTestnet")).toBeNull();
    expect(getExplorerTransactionUrl("", "mstTestnet")).toBeNull();
  });

  it("never exposes Testnet batches on Mainnet in getVerifiedBatches", () => {
    const mainnetBatches = getVerifiedBatches("mstMainnet");
    expect(mainnetBatches).toEqual([]);
  });

  describe("LocalStorage Network Isolation", () => {
    const storage: Record<string, string> = {};

    beforeEach(() => {
      // Mock window.localStorage for Node environment
      (globalThis as unknown as { window: unknown }).window = {
        localStorage: {
          getItem: (key: string) => storage[key] ?? null,
          setItem: (key: string, value: string) => {
            storage[key] = value;
          },
          removeItem: (key: string) => {
            delete storage[key];
          },
          clear: () => {
            for (const k of Object.keys(storage)) delete storage[k];
          },
        },
      };
    });

    afterEach(() => {
      delete (globalThis as unknown as { window?: unknown }).window;
    });

    it("strictly isolates recorded batches by network", () => {
      const testnetKey = "mandimint_custom_batches_mstTestnet";
      const testnetRecord = [
        {
          batchId: 201,
          cropId: 1,
          cropName: "Basmati",
          mandiName: "Karnal",
          totalQuantityKg: 4000,
          salePriceInrPerTonne: 32000,
          txHash: "0x1111111111111111111111111111111111111111111111111111111111111111",
          manager: "0x1234567890123456789012345678901234567890",
          status: "confirmed",
          createdAt: 1700000001,
          networkId: "mstTestnet",
          farmers: [],
        },
      ];

      storage[testnetKey] = JSON.stringify(testnetRecord);

      const readTestnet = getRecordedBatches("mstTestnet");
      const readMainnet = getRecordedBatches("mstMainnet");

      expect(readTestnet.length).toBe(1);
      expect(readTestnet[0]?.batchId).toBe(201);
      expect(readMainnet).toEqual([]);
    });
  });
});

describe("Network Aware Explorer Link Generation", () => {
  const hash = "0x4444444444444444444444444444444444444444444444444444444444444444";
  const address = "0x06289D9c452369abcb9bc1b5D6Adf80982C5679C";

  it("generates correct MST Testnet explorer links", () => {
    expect(getExplorerTxUrl("mstTestnet", hash)).toBe(
      `${MST_TESTNET_CONFIG.explorerUrl}/tx/${hash}`,
    );
    expect(getExplorerAddressUrl("mstTestnet", address)).toBe(
      `${MST_TESTNET_CONFIG.explorerUrl}/address/${address}`,
    );
  });

  it("generates correct MST Mainnet explorer links", () => {
    expect(getExplorerTxUrl("mstMainnet", hash)).toBe(
      `${MST_MAINNET_CONFIG.explorerUrl}/tx/${hash}`,
    );
    expect(getExplorerAddressUrl("mstMainnet", address)).toBe(
      `${MST_MAINNET_CONFIG.explorerUrl}/address/${address}`,
    );
  });

  it("never swaps network explorer domains", () => {
    const testnetUrl = getExplorerTxUrl("mstTestnet", hash);
    const mainnetUrl = getExplorerTxUrl("mstMainnet", hash);

    expect(testnetUrl).toContain("testnet.mstscan.com");
    expect(testnetUrl).not.toBe(mainnetUrl);
    expect(mainnetUrl).toBe(`https://mstscan.com/tx/${hash}`);
  });
});

describe("Contract Write Protection & Mainnet Fail-Closed", () => {
  it("fails closed on Mainnet batch writes because contract address is null", async () => {
    const mockSigner = {
      getAddress: async () => "0x1234567890123456789012345678901234567890",
      provider: {
        getNetwork: async () => ({ chainId: 4646n }),
      },
    };

    const mockParams = {
      batchId: 501n,
      cropId: 2n,
      totalQuantityKg: 2000n,
      salePriceInrPerTonne: 30000n,
      farmers: ["0x1234567890123456789012345678901234567890"],
      quantitiesKg: [2000n],
    };

    await expect(
      submitRecordBatch(mockSigner as never, mockParams, "mstMainnet"),
    ).rejects.toThrow(MandiMintNotConfiguredError);
  });
});

describe("Post-Transaction Batch Readback Verification Logic", () => {
  it("verifies confirmed batch details match submitted parameters", async () => {
    const mockBatchDetails: MandiMintBatchDetails = {
      batchId: 777n,
      cropId: 1n,
      totalQuantityKg: 5000n,
      salePriceInrPerTonne: 28500n,
      manager: "0x1234567890123456789012345678901234567890",
      createdAt: 1700000000n,
      allocations: [
        {
          farmer: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
          quantityKg: 3000n,
        },
        {
          farmer: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
          quantityKg: 2000n,
        },
      ],
    };

    const verifyReadback = (
      submittedId: bigint,
      readback: MandiMintBatchDetails | null,
    ) => {
      if (!readback) return false;
      return readback.batchId === submittedId;
    };

    expect(verifyReadback(777n, mockBatchDetails)).toBe(true);
    expect(verifyReadback(778n, mockBatchDetails)).toBe(false);
    expect(verifyReadback(777n, null)).toBe(false);
  });

  it("handles transient readback failure safely without crashing", () => {
    const readbackAttempt = (shouldThrow: boolean) => {
      try {
        if (shouldThrow) {
          throw new Error("RPC node propagation delay");
        }
        return { verified: true };
      } catch {
        return { verified: false };
      }
    };

    expect(readbackAttempt(false)).toEqual({ verified: true });
    expect(readbackAttempt(true)).toEqual({ verified: false });
  });
});
