import { getAddress, formatUnits } from "ethers";

const INDIAN_NUMBER_FORMAT = new Intl.NumberFormat("en-IN");
const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});
export function parseWholeNumber(value: string): bigint | null {
  const normalized = value.trim().replace(/,/g, "");
  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  try {
    return BigInt(normalized);
  } catch {
    return null;
  }
}

const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

export function parseAddress(value: string): string | null {
  const trimmed = value.trim();
  if (!EVM_ADDRESS_REGEX.test(trimmed)) {
    return null;
  }

  try {
    return getAddress(trimmed.toLowerCase());
  } catch {
    return null;
  }
}

export function formatIndianInteger(value: bigint): string {
  return INDIAN_NUMBER_FORMAT.format(value);
}

export function formatQuantityKg(value: bigint): string {
  return `${formatIndianInteger(value)} kg`;
}

export function formatInrPerTonne(value: bigint): string {
  return `₹${formatIndianInteger(value)}/tonne`;
}

/**
 * Exact reference value for total kg multiplied by INR/tonne.
 * The app never rounds the displayed amount.
 */
export function formatGrossValue(
  totalQuantityKg: bigint,
  salePriceInrPerTonne: bigint,
): string {
  const numerator = totalQuantityKg * salePriceInrPerTonne;
  const whole = numerator / 1000n;
  const remainder = numerator % 1000n;

  if (remainder === 0n) {
    return `₹${formatIndianInteger(whole)}`;
  }

  return `₹${formatIndianInteger(whole)}.${remainder
    .toString()
    .padStart(3, "0")}`;
}

export function formatTimestamp(seconds: bigint): string {
  if (seconds <= 0n) {
    return "—";
  }

  const milliseconds = Number(seconds) * 1000;
  if (!Number.isFinite(milliseconds)) {
    return "—";
  }

  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return DATE_TIME_FORMAT.format(date);
}

export function truncateAddress(address: string, leading = 6, trailing = 4): string {
  if (address.length <= leading + trailing + 1) {
    return address;
  }
  return `${address.slice(0, leading)}…${address.slice(-trailing)}`;
}

export function formatIntegerInput(value: bigint): string {
  return value.toString();
}

export function formatNativeCurrency(value: bigint | null, decimals = 18): string {
  if (value === null) {
    return "—";
  }
  const formatted = formatUnits(value, decimals);
  return `${formatted} tMSTC`;
}
