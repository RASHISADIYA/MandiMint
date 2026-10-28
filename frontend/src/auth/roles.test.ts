import { describe, expect, it } from "vitest";
import {
  roleGrantsFarmerAccess,
  roleGrantsManagerAccess,
} from "../services/role/userRoleService";
import { isMandiMintRole } from "./roles";

describe("isMandiMintRole", () => {
  it("accepts farmer and fpo_admin only", () => {
    expect(isMandiMintRole("farmer")).toBe(true);
    expect(isMandiMintRole("fpo_admin")).toBe(true);
    expect(isMandiMintRole("admin")).toBe(false);
    expect(isMandiMintRole(null)).toBe(false);
  });
});

describe("roleGrantsManagerAccess", () => {
  it("grants manager UX only for fpo_admin from authoritative role", () => {
    expect(roleGrantsManagerAccess("fpo_admin")).toBe(true);
    expect(roleGrantsManagerAccess("farmer")).toBe(false);
    expect(roleGrantsManagerAccess(null)).toBe(false);
  });
});

describe("roleGrantsFarmerAccess", () => {
  it("grants farmer UX only for farmer from authoritative role", () => {
    expect(roleGrantsFarmerAccess("farmer")).toBe(true);
    expect(roleGrantsFarmerAccess("fpo_admin")).toBe(false);
  });
});
