import { afterEach, describe, expect, it, vi } from "vitest";
import {
  roleGrantsFarmerAccess,
  roleGrantsManagerAccess,
} from "../services/role/userRoleService";
import {
  clearStoredRoles,
  getRoleForUser,
  isMandiMintRole,
  setRoleForUser,
} from "./roles";

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
  it("grants farmer UX only for farmer", () => {
    expect(roleGrantsFarmerAccess("farmer")).toBe(true);
    expect(roleGrantsFarmerAccess("fpo_admin")).toBe(false);
  });
});

describe("stored local role persistence", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function makeWindow() {
    const store = new Map<string, string>();
    return {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
        key: (index: number) => [...store.keys()][index] ?? null,
        get length() {
          return store.size;
        },
      },
      dispatchEvent: () => true,
    };
  }

  it("saves and restores a Farmer role", () => {
    vi.stubGlobal("window", makeWindow());
    setRoleForUser("user-1", "farmer");
    expect(getRoleForUser("user-1")).toBe("farmer");
  });

  it("saves and restores an FPO Admin role", () => {
    vi.stubGlobal("window", makeWindow());
    setRoleForUser("user-2", "fpo_admin");
    expect(getRoleForUser("user-2")).toBe("fpo_admin");
  });

  it("returns null for an unknown or invalid stored role", () => {
    const win = makeWindow();
    win.localStorage.setItem("mandimint.role.user-3", "admin");
    vi.stubGlobal("window", win);
    expect(getRoleForUser("user-3")).toBeNull();
  });

  it("clears stored roles", () => {
    const win = makeWindow();
    vi.stubGlobal("window", win);
    setRoleForUser("user-4", "farmer");
    clearStoredRoles();
    expect(getRoleForUser("user-4")).toBeNull();
  });
});
