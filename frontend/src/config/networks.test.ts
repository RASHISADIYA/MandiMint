import { describe, expect, it } from "vitest";
import {
  getExplorerAddressUrl,
  getExplorerBlockUrl,
  getExplorerTxUrl,
  getNetworkConfig,
  getNetworkConfigByChainId,
  isSupportedChainId,
  MST_MAINNET_CONFIG,
  MST_TESTNET_CONFIG,
} from "./networks";
import {
  getMandiMintContractConfig,
  getMandiMintEnvIssues,
  isMandiMintReady,
} from "./blockchain";
import {
  getVerifiedBatches,
  MandiMintNotConfiguredError,
  submitRecordBatch,
} from "../lib/blockchain/mandiMintContract";

describe("MST Networks Configuration", () => {
  it("provides verified official parameters for MST Testnet", () => {
    expect(MST_TESTNET_CONFIG.id).toBe("mstTestnet");
    expect(MST_TESTNET_CONFIG.chainId).toBe(91562037);
    expect(MST_TESTNET_CONFIG.hexChainId).toBe("0x5752035");
    expect(MST_TESTNET_CONFIG.rpcUrl).toContain("testnetrpc.mstblockchain.com");
    expect(MST_TESTNET_CONFIG.explorerUrl).toContain("testnet.mstscan.com");
    expect(MST_TESTNET_CONFIG.currency.symbol).toBe("tMSTC");
    expect(MST_TESTNET_CONFIG.currency.decimals).toBe(18);
    expect(MST_TESTNET_CONFIG.contractAddress).toBe(
      "0x06289D9c452369abcb9bc1b5D6Adf80982C5679C",
    );
    expect(MST_TESTNET_CONFIG.isContractConfigured).toBe(true);
  });

  it("provides verified official parameters for MST Mainnet", () => {
    expect(MST_MAINNET_CONFIG.id).toBe("mstMainnet");
    expect(MST_MAINNET_CONFIG.chainId).toBe(4646);
    expect(MST_MAINNET_CONFIG.hexChainId).toBe("0x1226");
    expect(MST_MAINNET_CONFIG.rpcUrl).toContain("mariorpc.mstblockchain.com");
    expect(MST_MAINNET_CONFIG.explorerUrl).toContain("mstscan.com");
    expect(MST_MAINNET_CONFIG.currency.symbol).toBe("MSTC");
    expect(MST_MAINNET_CONFIG.currency.decimals).toBe(18);
  });

  it("verifies hexadecimal chain ID calculations match decimal chain IDs", () => {
    expect(`0x${(91562037).toString(16)}`).toBe(MST_TESTNET_CONFIG.hexChainId);
    expect(`0x${(4646).toString(16)}`).toBe(MST_MAINNET_CONFIG.hexChainId);
  });

  it("resolves network configurations by ID and chain ID", () => {
    expect(getNetworkConfig("mstTestnet").chainId).toBe(91562037);
    expect(getNetworkConfig("mstMainnet").chainId).toBe(4646);
    expect(getNetworkConfigByChainId(91562037)?.id).toBe("mstTestnet");
    expect(getNetworkConfigByChainId(4646)?.id).toBe("mstMainnet");
    expect(getNetworkConfigByChainId(1)).toBeNull(); // Unknown chain
    expect(isSupportedChainId(91562037)).toBe(true);
    expect(isSupportedChainId(4646)).toBe(true);
    expect(isSupportedChainId(99999)).toBe(false);
  });

  it("builds network-specific explorer URLs correctly", () => {
    const tx = "0xb2a1ecfa0766be71652afa34694ec880d2787681745181d0e7cff6cb36adcadf";
    const addr = "0x06289D9c452369abcb9bc1b5D6Adf80982C5679C";

    expect(getExplorerTxUrl("mstTestnet", tx)).toBe(
      `https://testnet.mstscan.com/tx/${tx}`,
    );
    expect(getExplorerTxUrl("mstMainnet", tx)).toBe(
      `https://mstscan.com/tx/${tx}`,
    );
    expect(getExplorerAddressUrl("mstTestnet", addr)).toBe(
      `https://testnet.mstscan.com/address/${addr}`,
    );
    expect(getExplorerAddressUrl("mstMainnet", addr)).toBe(
      `https://mstscan.com/address/${addr}`,
    );
    expect(getExplorerBlockUrl("mstTestnet", 1000)).toBe(
      "https://testnet.mstscan.com/block/1000",
    );
    expect(getExplorerBlockUrl("mstMainnet", 2000)).toBe(
      "https://mstscan.com/block/2000",
    );
  });
});

describe("Network Separation and Fail-Closed Validation", () => {
  it("never mixes Testnet batch records with Mainnet", () => {
    const testnetBatches = getVerifiedBatches("mstTestnet");
    const mainnetBatches = getVerifiedBatches("mstMainnet");

    expect(testnetBatches.length).toBeGreaterThan(0);
    expect(mainnetBatches).toEqual([]); // Mainnet is clean and isolated
  });

  it("fails closed on Mainnet when contract is undeployed", () => {
    const ready = isMandiMintReady("mstMainnet");
    const config = getMandiMintContractConfig("mstMainnet");
    const issues = getMandiMintEnvIssues("mstMainnet");

    expect(ready).toBe(false);
    expect(config).toBeNull();
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]).toMatch(/not yet deployed/i);
  });

  it("blocks submitRecordBatch to Mainnet when undeployed", async () => {
    const fakeSigner = {
      getAddress: async () => "0x1234567890123456789012345678901234567890",
      provider: {
        getNetwork: async () => ({ chainId: 4646n }),
      },
    };

    const mockParams = {
      batchId: 100n,
      cropId: 1n,
      totalQuantityKg: 1000n,
      salePriceInrPerTonne: 25000n,
      farmers: ["0x1234567890123456789012345678901234567890"],
      quantitiesKg: [1000n],
    };

    await expect(
      submitRecordBatch(fakeSigner as never, mockParams, "mstMainnet"),
    ).rejects.toThrow(MandiMintNotConfiguredError);
  });

  it("blocks submitRecordBatch when wallet chain does not match target network", async () => {
    const fakeSigner = {
      getAddress: async () => "0x1234567890123456789012345678901234567890",
      signMessage: async () => "0x",
      provider: {
        getNetwork: async () => ({ chainId: 1n }), // Ethereum mainnet, not MST Testnet
      },
    };

    const mockParams = {
      batchId: 100n,
      cropId: 1n,
      totalQuantityKg: 1000n,
      salePriceInrPerTonne: 25000n,
      farmers: ["0x1234567890123456789012345678901234567890"],
      quantitiesKg: [1000n],
    };

    await expect(
      submitRecordBatch(fakeSigner as never, mockParams, "mstTestnet"),
    ).rejects.toThrow(/requires chain 91562037/i);
  });
});
