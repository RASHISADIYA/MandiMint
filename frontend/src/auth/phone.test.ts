import { describe, expect, it } from "vitest";
import {
  formatPhoneNumber,
  maskPhoneNumber,
  normalizePhoneNumber,
} from "./phone";

describe("normalizePhoneNumber", () => {
  it("normalizes Indian 10-digit numbers to E.164", () => {
    expect(normalizePhoneNumber("98765 43210")).toBe("+919876543210");
    expect(normalizePhoneNumber("098765-43210")).toBe("+919876543210");
    expect(normalizePhoneNumber("919876543210")).toBe("+919876543210");
  });

  it("accepts explicit E.164 and international prefix", () => {
    expect(normalizePhoneNumber("+91 98765 43210")).toBe("+919876543210");
    expect(normalizePhoneNumber("0044 7700 900123")).toBe("+447700900123");
  });

  it("rejects invalid or unsupported lengths", () => {
    expect(normalizePhoneNumber("")).toBeNull();
    expect(normalizePhoneNumber("12345")).toBeNull();
    expect(normalizePhoneNumber("+12")).toBeNull();
  });
});

describe("phone display helpers", () => {
  it("formats Indian phone numbers", () => {
    expect(formatPhoneNumber("+919876543210")).toBe("+91 98765 43210");
    expect(formatPhoneNumber("+447700900123")).toBe("+447700900123");
    expect(formatPhoneNumber(null)).toBe("—");
  });

  it("masks phone numbers for compact display", () => {
    expect(maskPhoneNumber("+919876543210")).toBe("+91•••••10");
    expect(maskPhoneNumber(null)).toBe("—");
  });
});
