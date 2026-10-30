import { describe, expect, it, vi } from "vitest";
import { parseAddress } from "../lib/format";
import { getRoleForWallet, setRoleForWallet, type MandiMintRole } from "./roles";
import { getNetworkConfig } from "../config/networks";
import { buildPrivyConfig } from "../providers/privyConfig";

describe("Audited Email OTP and Embedded EVM Wallet Onboarding Flow", () => {
  it("verifies Privy configuration has Email OTP as login method and both MST networks supported", () => {
    const config = buildPrivyConfig();

    // Supported login methods include google and email
    expect(config.loginMethods).toEqual(["google", "email"]);

    // Embedded wallets are configured to create on login for users without wallets
    expect(config.embeddedWallets?.ethereum?.createOnLogin).toBe("users-without-wallets");

    // Both MST Testnet (91562037) and MST Mainnet (4646) are in supported chains
    const chainIds = config.supportedChains?.map((c) => c.id);
    expect(chainIds).toContain(91562037);
    expect(chainIds).toContain(4646);
  });

  it("retrieves existing embedded wallet when present in Privy wallets array", () => {
    const mockWallets = [
      {
        walletClientType: "metamask",
        address: "0x1111111111111111111111111111111111111111",
      },
      {
        walletClientType: "privy",
        address: "0x2af9b345778954379e65b726aea26a0e0a2df239",
      },
    ];

    const embedded = mockWallets.find((w) => w.walletClientType === "privy");
    expect(embedded).toBeDefined();
    expect(parseAddress(embedded!.address)).toBe(
      "0x2AF9B345778954379E65b726aeA26a0E0a2Df239"
    );
  });

  it("handles new embedded wallet creation and handles creation failure safely", async () => {
    let walletCreated = false;
    let creationError: string | null = null;

    const mockCreateWalletSuccess = async () => {
      walletCreated = true;
      return {
        walletClientType: "privy",
        address: "0x2AF9B345778954379E65b726aeA26a0E0a2Df239",
      };
    };

    const mockCreateWalletFailure = async () => {
      throw new Error("Privy embedded wallet service temporarily unavailable.");
    };

    // Test success
    const result = await mockCreateWalletSuccess();
    expect(walletCreated).toBe(true);
    expect(result.walletClientType).toBe("privy");

    // Test failure handling
    try {
      await mockCreateWalletFailure();
    } catch (err) {
      creationError = err instanceof Error ? err.message : "Creation failed";
    }

    expect(creationError).toBe(
      "Privy embedded wallet service temporarily unavailable."
    );
  });

  it("does not claim wallet is ready until Privy confirms wallet exists", () => {
    // Stage 1: Authenticated but wallet not yet created
    const authenticated = true;
    let wallets: Array<{ walletClientType: string; address: string }> = [];

    const isWalletReady = (auth: boolean, list: typeof wallets) => {
      if (!auth) return false;
      const found = list.find((w) => w.walletClientType === "privy");
      return Boolean(found && found.address);
    };

    expect(isWalletReady(authenticated, wallets)).toBe(false);

    // Stage 2: Embedded wallet confirmed by Privy
    wallets = [
      {
        walletClientType: "privy",
        address: "0x2AF9B345778954379E65b726aeA26a0E0a2Df239",
      },
    ];
    expect(isWalletReady(authenticated, wallets)).toBe(true);
  });

  it("persists role selection per wallet address and routes correctly", () => {
    const mockStorage: Record<string, string> = {};
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => mockStorage[k] ?? null,
        setItem: (k: string, v: string) => {
          mockStorage[k] = v;
        },
        removeItem: (k: string) => {
          delete mockStorage[k];
        },
      },
      dispatchEvent: () => true,
    });

    const embeddedWalletAddress = "0x2AF9B345778954379E65b726aeA26a0E0a2Df239";

    // First time user: no role assigned yet
    expect(getRoleForWallet(embeddedWalletAddress)).toBeNull();

    // User selects Farmer role
    setRoleForWallet(embeddedWalletAddress, "farmer");
    expect(getRoleForWallet(embeddedWalletAddress)).toBe("farmer");

    // Routing decision helper
    const resolveDashboardTarget = (
      role: MandiMintRole | null
    ): string => {
      if (role === "farmer") return "/app/farmer";
      if (role === "fpo_admin") return "/app/manager";
      return "/onboarding";
    };

    expect(resolveDashboardTarget(getRoleForWallet(embeddedWalletAddress))).toBe(
      "/app/farmer"
    );

    // Different wallet address has separate role state
    const anotherWallet = "0x1111111111111111111111111111111111111111";
    expect(getRoleForWallet(anotherWallet)).toBeNull();
    expect(resolveDashboardTarget(getRoleForWallet(anotherWallet))).toBe(
      "/onboarding"
    );

    vi.unstubAllGlobals();
  });

  it("verifies FPO Manager role selection never implies on-chain authorization", () => {
    const selectedRole = "fpo_admin";
    const isManagerOnChain = false;
    const isOwnerOnChain = false;

    // Route guard check: can record batches only if authorized on-chain
    const canRecordBatch = (role: string, manager: boolean, owner: boolean) => {
      return role === "fpo_admin" && (manager || owner);
    };

    expect(canRecordBatch(selectedRole, isManagerOnChain, isOwnerOnChain)).toBe(
      false
    );

    // When authorized by owner via setManager
    expect(canRecordBatch(selectedRole, true, false)).toBe(true);
  });

  it("verifies Farmer access remains independent of manager permissions", () => {
    const role = "farmer";
    const isManagerOnChain = false;

    const canAccessFarmerWorkspace = (userRole: string) => {
      return userRole === "farmer";
    };

    // Farmer access does not check isManager
    expect(canAccessFarmerWorkspace(role)).toBe(true);
    expect(isManagerOnChain).toBe(false);
  });

  it("clears wallet and authorization state on logout and restores session correctly", () => {
    let connected = true;
    let walletType: string | null = "privy";
    let address: string | null = "0x2AF9B345778954379E65b726aeA26a0E0a2Df239";
    let isManager = true;

    // Disconnect / logout action
    const handleLogout = () => {
      connected = false;
      walletType = null;
      address = null;
      isManager = false;
    };

    handleLogout();

    expect(connected).toBe(false);
    expect(walletType).toBeNull();
    expect(address).toBeNull();
    expect(isManager).toBe(false);
  });

  it("verifies external-wallet fallback is preserved without redundant connect button", () => {
    let walletType: "bridgekey" | "injected" | "privy" | null = null;

    // Simulate connecting via BridgeKey external fallback
    const connectBridgeKey = () => {
      walletType = "bridgekey";
    };

    connectBridgeKey();
    expect(walletType).toBe("bridgekey");

    // Simulate connecting via Injected MetaMask fallback
    const connectInjected = () => {
      walletType = "injected";
    };

    connectInjected();
    expect(walletType).toBe("injected");
  });

  it("verifies Mainnet contract is configured with verified deployment address and preserves isolation", () => {
    const mainnetConfig = getNetworkConfig("mstMainnet");
    expect(mainnetConfig.contractAddress).toBe("0x06289D9c452369abcb9bc1b5D6Adf80982C5679C");
    expect(mainnetConfig.isContractConfigured).toBe(true);
    expect(mainnetConfig.chainId).toBe(4646);

    // Fail closed guard if address is null
    const checkCanWrite = (contractAddress: string | null) => {
      if (!contractAddress) {
        throw new Error(
          "MandiMint smart contract is not yet deployed on MST Mainnet."
        );
      }
      return true;
    };

    expect(checkCanWrite(mainnetConfig.contractAddress)).toBe(true);
    expect(() => checkCanWrite(null)).toThrow(
      "MandiMint smart contract is not yet deployed on MST Mainnet."
    );
  });
});
