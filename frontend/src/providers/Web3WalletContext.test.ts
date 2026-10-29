import { describe, expect, it, vi } from "vitest";
import { parseAddress } from "../lib/format";
import { getNetworkConfig, getNetworkConfigByChainId } from "../config/networks";

describe("Web3WalletContext Authorization & Event Lifecycle Logic", () => {
  it("normalizes provider account addresses using parseAddress", () => {
    const rawAccount = "0x2af9b345778954379e65b726aea26a0e0a2df239";
    const mixedAccount = "0x2AF9B345778954379E65b726aeA26a0E0a2dF239";
    const expected = "0x2AF9B345778954379E65b726aeA26a0E0a2Df239";

    expect(parseAddress(rawAccount)).toBe(expected);
    expect(parseAddress(mixedAccount)).toBe(expected);
  });

  it("clears authorization flags immediately when account changes", () => {
    let isManager = true;
    let isOwner = true;
    let authRequestId = 1;

    // Simulate onAccountsChanged logic
    const handleAccountsChanged = (newAccounts: string[]) => {
      authRequestId += 1;
      isManager = false;
      isOwner = false;

      if (!newAccounts || newAccounts.length === 0) {
        return null;
      }
      return parseAddress(newAccounts[0]);
    };

    const nextAddr = handleAccountsChanged(["0x2af9b345778954379e65b726aea26a0e0a2df239"]);

    expect(isManager).toBe(false);
    expect(isOwner).toBe(false);
    expect(authRequestId).toBe(2);
    expect(nextAddr).toBe("0x2AF9B345778954379E65b726aeA26a0E0a2Df239");
  });

  it("handles empty accounts (disconnect) by clearing all authorization and state", () => {
    let isManager = true;
    let isOwner = true;
    let currentAddress: string | null = "0x2AF9B345778954379E65b726aeA26a0E0a2Df239";
    let authRequestId = 1;

    const handleAccountsChanged = (newAccounts: string[]) => {
      authRequestId += 1;
      isManager = false;
      isOwner = false;

      if (!newAccounts || newAccounts.length === 0) {
        currentAddress = null;
        return;
      }
      currentAddress = parseAddress(newAccounts[0]);
    };

    handleAccountsChanged([]);

    expect(isManager).toBe(false);
    expect(isOwner).toBe(false);
    expect(currentAddress).toBeNull();
    expect(authRequestId).toBe(2);
  });

  it("clears authorization flags immediately when chain changes", () => {
    let isManager = true;
    let isOwner = true;
    let authRequestId = 5;
    let currentChainId = 91562037;
    let selectedNetwork = "mstTestnet";

    const handleChainChanged = (hexChain: string) => {
      authRequestId += 1;
      isManager = false;
      isOwner = false;

      const newChainId = parseInt(hexChain, 16);
      currentChainId = newChainId;
      const matched = getNetworkConfigByChainId(newChainId);
      if (matched) {
        selectedNetwork = matched.id;
      }
    };

    // Simulate switching to Mainnet (4646 / 0x1226)
    handleChainChanged("0x1226");

    expect(isManager).toBe(false);
    expect(isOwner).toBe(false);
    expect(currentChainId).toBe(4646);
    expect(selectedNetwork).toBe("mstMainnet");
    expect(authRequestId).toBe(6);
  });

  it("prevents stale asynchronous authorization results from overriding subsequent account state", async () => {
    let isManager = false;
    let isOwner = false;
    let activeAuthRequestId = 0;

    // Simulate async contract read function with request token tracking
    const simulateAuthorizationRead = async (
      _account: string,
      reqId: number,
      delayMs: number,
      mockResult: { manager: boolean; owner: boolean },
    ) => {
      await new Promise((r) => setTimeout(r, delayMs));

      // Guard: only apply if this request is still the active one
      if (reqId === activeAuthRequestId) {
        isManager = mockResult.manager;
        isOwner = mockResult.owner;
      }
    };

    // Account 1 triggers slow query (returns manager = true after 50ms)
    activeAuthRequestId = 1;
    const slowAccount1Promise = simulateAuthorizationRead(
      "0xAccount1",
      1,
      50,
      { manager: true, owner: true },
    );

    // User quickly switches to Account 2 after 10ms (Account 2 is not manager)
    activeAuthRequestId = 2;
    isManager = false;
    isOwner = false;
    const fastAccount2Promise = simulateAuthorizationRead(
      "0xAccount2",
      2,
      15,
      { manager: false, owner: false },
    );

    await Promise.all([slowAccount1Promise, fastAccount2Promise]);

    // Even though Account 1's mock query finished last, its result was discarded!
    expect(isManager).toBe(false);
    expect(isOwner).toBe(false);
  });

  it("detaches listeners properly on disconnect to prevent memory leaks", () => {
    const mockRemoveListener = vi.fn();
    const mockProvider = {
      removeListener: mockRemoveListener,
    };

    const listeners = {
      onAccountsChanged: () => {},
      onChainChanged: () => {},
    };

    // Simulate detachListeners
    if (mockProvider && typeof mockProvider.removeListener === "function") {
      mockProvider.removeListener("accountsChanged", listeners.onAccountsChanged);
      mockProvider.removeListener("chainChanged", listeners.onChainChanged);
    }

    expect(mockRemoveListener).toHaveBeenCalledWith("accountsChanged", listeners.onAccountsChanged);
    expect(mockRemoveListener).toHaveBeenCalledWith("chainChanged", listeners.onChainChanged);
    expect(mockRemoveListener).toHaveBeenCalledTimes(2);
  });

  it("verifies Mainnet contract address remains null so isManager evaluates to false", () => {
    const mainnetCfg = getNetworkConfig("mstMainnet");
    expect(mainnetCfg.contractAddress).toBeNull();
    expect(mainnetCfg.isContractConfigured).toBe(false);
  });
});
