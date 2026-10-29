import { describe, expect, it, beforeEach, vi, type Mock } from "vitest";
import {
  formatContractError,
  getContractInterface,
  estimateRecordBatchGas,
} from "./mandiMintContract";

const mockSigner = {
  getAddress: vi.fn(),
  provider: {
    getBalance: vi.fn(),
    getFeeData: vi.fn(),
    getNetwork: vi.fn(),
  },
} as unknown as {
  getAddress: Mock<() => Promise<string>>;
  provider: {
    getBalance: Mock<(address: string) => Promise<bigint>>;
    getFeeData: Mock<() => Promise<{ maxFeePerGas?: bigint | null; gasPrice?: bigint | null }>>;
    getNetwork: Mock<() => Promise<{ chainId: number }>>;
  };
};

vi.mock("../ethers/embeddedSigner", () => ({
  getEmbeddedEthersSigner: vi.fn(() => mockSigner),
}));

vi.mock("../../config/blockchain", () => ({
  getMandiMintContractConfig: vi.fn(() => ({
    address: "0x06289D9c452369abcb9bc1b5D6Adf80982C5679C",
    chain: {
      chainId: 91562037,
      rpcUrl: "https://testnetrpc.mstblockchain.com",
      explorerUrl: "https://testnet.mstscan.com",
    },
  })),
}));

const mockParams = {
  batchId: 1n,
  cropId: 1n,
  totalQuantityKg: 1000n,
  salePriceInrPerTonne: 1000n,
  farmers: ["0x1234567890123456789012345678901234567890"],
  quantitiesKg: [1000n],
};

describe("estimateRecordBatchGas", () => {
  beforeEach(() => {
    mockSigner.getAddress.mockReset();
    mockSigner.provider.getBalance.mockReset();
    mockSigner.provider.getFeeData.mockReset();
    mockSigner.provider.getNetwork.mockReset();
    mockSigner.provider.getNetwork.mockResolvedValue({
      chainId: 91562037,
    } as never);
    mockSigner.provider.getFeeData.mockResolvedValue({
      maxFeePerGas: 1000000000n, // 1 gwei
    } as never);
    mockSigner.provider.getBalance.mockResolvedValue(
      1000000000000000000n, // 1 tMSTC
    );
    mockSigner.getAddress.mockResolvedValue(
      "0xabcdef123456789012345678901234567890abcd",
    );
  });

  it("returns sufficient when balance exceeds estimated cost", async () => {
    mockSigner.provider.getBalance.mockResolvedValue(
      10000000000000000000n, // 10 tMSTC
    );

    const result = await estimateRecordBatchGas(
      {} as never,
      mockParams,
    );

    expect(mockSigner.getAddress).toHaveBeenCalled();
    expect(mockSigner.provider.getBalance).toHaveBeenCalled();
    expect(mockSigner.provider.getNetwork).toHaveBeenCalled();
    expect(result.status).toBe("sufficient");
    expect(result.balance).toBe(10000000000000000000n);
    expect(result.estimatedCost).toBe(300000000000000n); // 300k gas * 1 gwei
  });

  it("returns unknown when balance read fails", async () => {
    mockSigner.provider.getBalance.mockRejectedValue(
      new Error("RPC error"),
    );

    const result = await estimateRecordBatchGas(
      {} as never,
      mockParams,
    );

    expect(result.status).toBe("unknown");
    expect(result.balance).toBeNull();
    expect(result.error).toBe("Could not read the wallet balance.");
  });

  it("returns unknown when fee data is unavailable", async () => {
    mockSigner.provider.getBalance.mockResolvedValue(
      10000000000000000000n,
    );
    mockSigner.provider.getFeeData.mockResolvedValue({
      maxFeePerGas: null,
      gasPrice: null,
    } as never);

    const result = await estimateRecordBatchGas(
      {} as never,
      mockParams,
    );

    expect(result.status).toBe("unknown");
    expect(result.estimatedCost).toBeNull();
  });

  it("returns unknown when network does not match", async () => {
    mockSigner.provider.getNetwork.mockResolvedValue({
      chainId: 31337,
    } as never);

    const result = await estimateRecordBatchGas(
      {} as never,
      mockParams,
    );

    expect(result.status).toBe("unknown");
    expect(result.error).toMatch(/requires chain 91562037/);
  });
});

describe("formatContractError insufficient funds", () => {
  it("reports insufficient funds with code -32000", () => {
    expect(
      formatContractError({ code: -32000, message: "insufficient funds" }),
    ).toMatch(/insufficient native tMSTC for gas/i);
  });

  it("reports insufficient funds with message text", () => {
    expect(
      formatContractError(
        new Error("insufficient funds for gas * price + value"),
      ),
    ).toMatch(/insufficient native tMSTC for gas/i);
  });

  it("still decodes NotManager revert data", () => {
    const data = getContractInterface().encodeErrorResult("NotManager", []);

    expect(formatContractError({ data })).toBe(
      "This wallet is not an authorized FPO manager for the contract.",
    );
  });

  it("still decodes BatchAlreadyExists revert data", () => {
    const data = getContractInterface().encodeErrorResult("BatchAlreadyExists", [
      1n,
    ]);

    expect(formatContractError({ data })).toMatch(/Batch 1 is already recorded/);
  });

  it("encodeFunctionData works for recordBatch", () => {
    const iface = getContractInterface();
    const data = iface.encodeFunctionData("recordBatch", [
      1n, 1n, 1000n, 1000n,
      ["0x1234567890123456789012345678901234567890"],
      [1000n],
    ]);
    expect(data.slice(0, 2)).toBe("0x");
  });
});
