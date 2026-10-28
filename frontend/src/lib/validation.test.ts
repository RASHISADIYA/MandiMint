import { describe, expect, it } from "vitest";
import { validateRecordBatch, type RecordBatchDraft } from "./validation";

function draft(overrides: Partial<RecordBatchDraft> = {}): RecordBatchDraft {
  return {
    batchId: "1",
    cropId: "2",
    totalQuantityKg: "150",
    salePriceInrPerTonne: "2500",
    allocations: [
      {
        id: "a",
        address: "0x0000000000000000000000000000000000000001",
        quantityKg: "100",
      },
      {
        id: "b",
        address: "0x0000000000000000000000000000000000000002",
        quantityKg: "50",
      },
    ],
    ...overrides,
  };
}

describe("validateRecordBatch", () => {
  it("returns exact contract-ready values for a valid batch", () => {
    const result = validateRecordBatch(draft());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.batchId).toBe(1n);
      expect(result.value.cropId).toBe(2n);
      expect(result.value.totalQuantityKg).toBe(150n);
      expect(result.value.salePriceInrPerTonne).toBe(2_500n);
      expect(result.value.quantitiesKg).toEqual([100n, 50n]);
    }
  });

  it("rejects an allocation total that differs from the batch total", () => {
    const result = validateRecordBatch(
      draft({ totalQuantityKg: "151" }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.form).toContain("Allocations total");
    }
  });

  it("rejects duplicate farmer wallets regardless of address case", () => {
    const result = validateRecordBatch(
      draft({
        allocations: [
          {
            id: "a",
            address: "0x0000000000000000000000000000000000000001",
            quantityKg: "75",
          },
          {
            id: "b",
            address: "0x0000000000000000000000000000000000000001",
            quantityKg: "75",
          },
        ],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.allocations?.b?.address).toContain("more than once");
    }
  });

  it("rejects zero quantities and zero addresses", () => {
    const result = validateRecordBatch(
      draft({
        allocations: [
          {
            id: "a",
            address: "0x0000000000000000000000000000000000000000",
            quantityKg: "0",
          },
        ],
        totalQuantityKg: "1",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.allocations?.a?.address).toContain("zero address");
      expect(result.errors.allocations?.a?.quantityKg).toContain("greater than zero");
    }
  });

  it("rejects malformed scalar fields", () => {
    const result = validateRecordBatch(
      draft({ batchId: "0", cropId: "x", totalQuantityKg: "1.5" }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.batchId).toContain("greater than zero");
      expect(result.errors.cropId).toContain("whole number");
      expect(result.errors.totalQuantityKg).toContain("whole number");
    }
  });
});
