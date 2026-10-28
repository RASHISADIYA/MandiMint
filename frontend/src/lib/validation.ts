import { ZeroAddress } from "ethers";
import {
  formatQuantityKg,
  parseAddress,
  parseWholeNumber,
} from "./format";

export interface AllocationDraft {
  id: string;
  address: string;
  quantityKg: string;
}

export interface RecordBatchDraft {
  batchId: string;
  cropId: string;
  totalQuantityKg: string;
  salePriceInrPerTonne: string;
  allocations: AllocationDraft[];
}

export interface AllocationFieldErrors {
  address?: string;
  quantityKg?: string;
}

export interface RecordBatchErrors {
  batchId?: string;
  cropId?: string;
  totalQuantityKg?: string;
  salePriceInrPerTonne?: string;
  allocations?: Record<string, AllocationFieldErrors>;
  form?: string;
}

export interface ValidatedRecordBatch {
  batchId: bigint;
  cropId: bigint;
  totalQuantityKg: bigint;
  salePriceInrPerTonne: bigint;
  farmers: string[];
  quantitiesKg: bigint[];
}

export type RecordBatchValidationResult =
  | { ok: true; value: ValidatedRecordBatch }
  | { ok: false; errors: RecordBatchErrors };

export function validateRecordBatch(
  draft: RecordBatchDraft,
): RecordBatchValidationResult {
  const errors: RecordBatchErrors = { allocations: {} };

  const batchId = parseWholeNumber(draft.batchId);
  const cropId = parseWholeNumber(draft.cropId);
  const totalQuantityKg = parseWholeNumber(draft.totalQuantityKg);
  const salePriceInrPerTonne = parseWholeNumber(draft.salePriceInrPerTonne);

  if (batchId === null) {
    errors.batchId = "Batch ID must be a whole number.";
  } else if (batchId <= 0n) {
    errors.batchId = "Batch ID must be greater than zero.";
  }

  if (cropId === null) {
    errors.cropId = "Crop ID must be a whole number.";
  } else if (cropId <= 0n) {
    errors.cropId = "Crop ID must be greater than zero.";
  }

  if (totalQuantityKg === null) {
    errors.totalQuantityKg = "Total quantity must be a whole number of kilograms.";
  } else if (totalQuantityKg <= 0n) {
    errors.totalQuantityKg = "Total quantity must be greater than zero.";
  }

  if (salePriceInrPerTonne === null) {
    errors.salePriceInrPerTonne = "Sale price must be a whole number of INR.";
  } else if (salePriceInrPerTonne <= 0n) {
    errors.salePriceInrPerTonne = "Sale price must be greater than zero.";
  }

  if (draft.allocations.length === 0) {
    errors.form = "Add at least one farmer allocation.";
  }

  const farmers: string[] = [];
  const quantitiesKg: bigint[] = [];
  const seenAddresses = new Set<string>();
  let allocationTotal = 0n;
  let allocationsValid = true;

  for (const allocation of draft.allocations) {
    const allocationErrors: AllocationFieldErrors = {};
    const address = parseAddress(allocation.address);
    const quantity = parseWholeNumber(allocation.quantityKg);

    if (!address) {
      allocationErrors.address = "Enter a valid EVM wallet address.";
      allocationsValid = false;
    } else if (address.toLowerCase() === ZeroAddress.toLowerCase()) {
      allocationErrors.address = "The zero address cannot receive an allocation.";
      allocationsValid = false;
    } else if (seenAddresses.has(address.toLowerCase())) {
      allocationErrors.address = "This farmer wallet appears more than once.";
      allocationsValid = false;
    }

    if (quantity === null) {
      allocationErrors.quantityKg = "Enter a whole number of kilograms.";
      allocationsValid = false;
    } else if (quantity <= 0n) {
      allocationErrors.quantityKg = "Quantity must be greater than zero.";
      allocationsValid = false;
    }

    if (Object.keys(allocationErrors).length > 0) {
      errors.allocations![allocation.id] = allocationErrors;
    }

    if (address && !allocationErrors.address) {
      seenAddresses.add(address.toLowerCase());
      farmers.push(address);
    } else {
      allocationsValid = false;
    }

    if (quantity !== null && quantity > 0n && !allocationErrors.quantityKg) {
      allocationTotal += quantity;
      quantitiesKg.push(quantity);
    } else {
      allocationsValid = false;
    }
  }

  if (
    totalQuantityKg !== null &&
    totalQuantityKg > 0n &&
    allocationTotal !== totalQuantityKg
  ) {
    errors.form = `Allocations total ${formatQuantityKg(
      allocationTotal,
    )}, but the batch total is ${formatQuantityKg(totalQuantityKg)}.`;
    allocationsValid = false;
  }

  const hasScalarErrors = Boolean(
    errors.batchId ||
      errors.cropId ||
      errors.totalQuantityKg ||
      errors.salePriceInrPerTonne ||
      errors.form,
  );

  if (
    !allocationsValid ||
    hasScalarErrors ||
    Object.keys(errors.allocations ?? {}).length > 0 ||
    batchId === null ||
    cropId === null ||
    totalQuantityKg === null ||
    salePriceInrPerTonne === null
  ) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      batchId,
      cropId,
      totalQuantityKg,
      salePriceInrPerTonne,
      farmers,
      quantitiesKg,
    },
  };
}
