const E164_PATTERN = /^\+\d{8,15}$/;

export function normalizePhoneNumber(input: string): string | null {
  const compact = input.trim().replace(/[\s().-]/g, "");
  if (!compact) {
    return null;
  }

  if (compact.startsWith("+")) {
    return E164_PATTERN.test(compact) ? compact : null;
  }

  if (compact.startsWith("00")) {
    const converted = `+${compact.slice(2)}`;
    return E164_PATTERN.test(converted) ? converted : null;
  }

  const digits = compact.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return `+91${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  return null;
}

export function formatPhoneNumber(phoneNumber: string | null): string {
  if (!phoneNumber) {
    return "—";
  }

  if (phoneNumber.startsWith("+91") && phoneNumber.length === 13) {
    return `+91 ${phoneNumber.slice(3, 8)} ${phoneNumber.slice(8)}`;
  }

  return phoneNumber;
}

export function maskPhoneNumber(phoneNumber: string | null): string {
  if (!phoneNumber) {
    return "—";
  }

  if (phoneNumber.length <= 5) {
    return phoneNumber;
  }

  return `${phoneNumber.slice(0, 3)}•••••${phoneNumber.slice(-2)}`;
}
