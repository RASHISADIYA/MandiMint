import { describe, expect, it } from "vitest";
import {
  formatContractError,
  getContractInterface,
} from "./mandiMintContract";

describe("formatContractError", () => {
  it("reports rejected wallet requests", () => {
    expect(
      formatContractError({
        code: "ACTION_REJECTED",
        message: "User rejected the request.",
      }),
    ).toBe("The transaction was rejected in your wallet.");
  });

  it("decodes NotManager revert data", () => {
    const data = getContractInterface().encodeErrorResult("NotManager", []);

    expect(formatContractError({ data })).toBe(
      "This wallet is not an authorized FPO manager for the contract.",
    );
  });

  it("decodes AllocationTotalMismatch revert data with quantities", () => {
    const data = getContractInterface().encodeErrorResult(
      "AllocationTotalMismatch",
      [1_500n, 1_000n],
    );

    expect(formatContractError({ data })).toBe(
      "Allocations total 1,000 kg, but the batch total is 1,500 kg.",
    );
  });

  it("passes through wrong-network messages", () => {
    expect(
      formatContractError(
        new Error(
          "Connected wallet is on chain 31337, but MandiMint requires chain 31338.",
        ),
      ),
    ).toMatch(/requires chain 31338/);
  });
});
