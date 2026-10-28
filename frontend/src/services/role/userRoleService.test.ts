import { describe, expect, it } from "vitest";
import { mapAuthoritativeRoleFromProfile } from "./userRoleService";

describe("mapAuthoritativeRoleFromProfile", () => {
  it("returns verified farmer role from backend payload", () => {
    const result = mapAuthoritativeRoleFromProfile({
      privyUserId: "did:privy:abc",
      role: "farmer",
      displayName: "Test Farmer",
    });
    expect(result.status).toBe("verified");
    expect(result.role).toBe("farmer");
    expect(result.displayName).toBe("Test Farmer");
    expect(result.source).toBe("backend");
  });

  it("returns unassigned when role is null", () => {
    const result = mapAuthoritativeRoleFromProfile({
      privyUserId: "did:privy:abc",
      role: null,
    });
    expect(result.status).toBe("unassigned");
    expect(result.role).toBeNull();
    expect(result.source).toBe("backend");
  });

  it("accepts fpo_admin without defaulting (no manager fallback)", () => {
    const result = mapAuthoritativeRoleFromProfile({
      privyUserId: "did:privy:abc",
      role: "fpo_admin" as "farmer",
    });
    expect(result.status).toBe("verified");
    expect(result.role).toBe("fpo_admin");
    expect(result.source).toBe("backend");
  });

  it("returns unassigned for invalid role values", () => {
    const result = mapAuthoritativeRoleFromProfile({
      privyUserId: "did:privy:abc",
      role: "superuser" as "farmer",
    });
    expect(result.status).toBe("unassigned");
    expect(result.role).toBeNull();
    expect(result.source).toBe("backend");
  });
});
