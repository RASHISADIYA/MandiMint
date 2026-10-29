import { describe, expect, it } from "vitest";
import {
  formatGrossValue,
  formatInrPerTonne,
  formatQuantityKg,
  formatTimestamp,
  parseAddress,
  parseWholeNumber,
  truncateAddress,
} from "./format";

describe("parseWholeNumber", () => {
  it("accepts whole numbers with trimming and separators", () => {
    expect(parseWholeNumber(" 1,250 ")).toBe(1250n);
    expect(parseWholeNumber("0")).toBe(0n);
  });

  it("rejects negative, decimal, and empty input", () => {
    expect(parseWholeNumber("-1")).toBeNull();
    expect(parseWholeNumber("1.5")).toBeNull();
    expect(parseWholeNumber("")).toBeNull();
  });
});

describe("parseAddress", () => {
  const EXPECTED_CHECKSUM = "0x2AF9B345778954379E65b726aeA26a0E0a2Df239";

  it("accepts a valid lowercase address and returns EIP-55 checksum", () => {
    expect(parseAddress("0x2af9b345778954379e65b726aea26a0e0a2df239")).toBe(
      EXPECTED_CHECKSUM,
    );
  });

  it("accepts a valid uppercase hexadecimal address", () => {
    expect(parseAddress("0x2AF9B345778954379E65B726AEA26A0E0A2DF239")).toBe(
      EXPECTED_CHECKSUM,
    );
  });

  it("accepts an already valid checksummed address", () => {
    expect(parseAddress("0x2AF9B345778954379E65b726aeA26a0E0a2Df239")).toBe(
      EXPECTED_CHECKSUM,
    );
  });

  it("accepts an address supplied in arbitrary mixed case without throwing bad checksum errors", () => {
    // Has "dF" instead of valid EIP-55 "Df"
    expect(parseAddress("0x2AF9B345778954379E65b726aeA26a0E0a2dF239")).toBe(
      EXPECTED_CHECKSUM,
    );
  });

  it("trims leading and trailing whitespace", () => {
    expect(
      parseAddress("  \t 0x2af9b345778954379e65b726aea26a0e0a2df239 \n "),
    ).toBe(EXPECTED_CHECKSUM);
  });

  it("rejects addresses with invalid lengths", () => {
    expect(parseAddress("0x123")).toBeNull();
    expect(parseAddress("0x2af9b345778954379e65b726aea26a0e0a2df23")).toBeNull(); // 39 hex
    expect(parseAddress("0x2af9b345778954379e65b726aea26a0e0a2df2399")).toBeNull(); // 41 hex
  });

  it("rejects non-hexadecimal characters and malformed input", () => {
    expect(parseAddress("0x2af9b345778954379e65b726aea26a0e0a2df23z")).toBeNull();
    expect(parseAddress("not-an-address")).toBeNull();
    expect(parseAddress("")).toBeNull();
    expect(parseAddress("0x")).toBeNull();
  });

  it("handles the zero address correctly", () => {
    expect(parseAddress("0x0000000000000000000000000000000000000000")).toBe(
      "0x0000000000000000000000000000000000000000",
    );
    expect(parseAddress(" 0x0000000000000000000000000000000000000000 ")).toBe(
      "0x0000000000000000000000000000000000000000",
    );
  });
});

describe("formatGrossValue", () => {
  it("matches the documented exact examples", () => {
    expect(formatGrossValue(1_000n, 2_500n)).toBe("₹2,500");
    expect(formatGrossValue(1_500n, 2_500n)).toBe("₹3,750");
    expect(formatGrossValue(1n, 2_500n)).toBe("₹2.500");
    expect(formatGrossValue(1n, 2_501n)).toBe("₹2.501");
  });

  it("preserves the remainder without rounding", () => {
    expect(formatGrossValue(1_234n, 5_678n)).toBe("₹7,006.652");
  });

  it("uses Indian digit grouping", () => {
    expect(formatGrossValue(100_000n, 1_000n)).toBe("₹1,00,000");
  });
});

describe("display formatting", () => {
  it("formats quantities and prices", () => {
    expect(formatQuantityKg(1_500n)).toBe("1,500 kg");
    expect(formatInrPerTonne(2_500n)).toBe("₹2,500/tonne");
  });

  it("formats timestamps and handles invalid values", () => {
    expect(formatTimestamp(0n)).toBe("—");
    expect(formatTimestamp(9_007_199_254_740_992n)).toBe("—");
  });

  it("truncates long addresses only", () => {
    expect(truncateAddress("0x1234567890abcdef")).toBe("0x1234…cdef");
    expect(truncateAddress("0x1234")).toBe("0x1234");
  });
});
