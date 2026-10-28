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
  it("returns a checksummed address", () => {
    expect(
      parseAddress("0x0000000000000000000000000000000000000001"),
    ).toBe("0x0000000000000000000000000000000000000001");
  });

  it("rejects malformed addresses", () => {
    expect(parseAddress("0x123")).toBeNull();
    expect(parseAddress("not-an-address")).toBeNull();
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
