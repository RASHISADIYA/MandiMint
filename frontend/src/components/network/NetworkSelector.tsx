import { ChevronDown, Globe, ShieldAlert, Sparkles } from "lucide-react";
import { useCallback, useRef, useState, useEffect } from "react";
import { useWeb3Wallet } from "../../providers/Web3WalletContext";
import {
  SUPPORTED_NETWORKS,
  type NetworkId,
} from "../../config/networks";
import "./network-selector.css";

export function NetworkSelector({ className = "" }: { className?: string }) {
  const {
    selectedNetwork,
    setSelectedNetwork,
    selectedNetworkConfig,
    connected,
    chainId,
    isNetworkMismatch,
    switchWalletToSelectedNetwork,
  } = useWeb3Wallet();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    async (netId: NetworkId) => {
      setIsOpen(false);
      setSelectedNetwork(netId);

      // If wallet is connected and on a different chain, offer switch
      if (connected && chainId !== SUPPORTED_NETWORKS[netId].chainId) {
        try {
          await switchWalletToSelectedNetwork();
        } catch {
          // Handled in Web3 context
        }
      }
    },
    [connected, chainId, setSelectedNetwork, switchWalletToSelectedNetwork]
  );

  const isMainnet = selectedNetwork === "mstMainnet";

  return (
    <div
      className={`mm-net-selector ${className}`}
      ref={dropdownRef}
      style={{ position: "relative" }}
    >
      <button
        type="button"
        className={`mm-net-selector__btn ${
          isMainnet
            ? "mm-net-selector__btn--mainnet"
            : "mm-net-selector__btn--testnet"
        } ${isNetworkMismatch ? "mm-net-selector__btn--mismatch" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title={`Selected: ${selectedNetworkConfig.name}${
          isNetworkMismatch ? " (Wallet chain mismatch)" : ""
        }`}
      >
        <span
          className={`mm-net-dot ${
            !connected
              ? "mm-net-dot--offline"
              : isNetworkMismatch
              ? "mm-net-dot--mismatch"
              : isMainnet
              ? "mm-net-dot--mainnet"
              : "mm-net-dot--testnet"
          }`}
          aria-hidden="true"
        />

        <span className="mm-net-selector__name">
          {selectedNetworkConfig.name}
        </span>

        <span
          className={`mm-net-badge ${
            isMainnet ? "mm-net-badge--mainnet" : "mm-net-badge--testnet"
          }`}
        >
          {selectedNetworkConfig.badge}
        </span>

        {isNetworkMismatch && (
          <span title="Wallet is on a different network than MandiMint">
            <ShieldAlert size={14} className="mm-net-mismatch-icon" />
          </span>
        )}

        <ChevronDown
          size={13}
          className={`mm-net-chevron ${isOpen ? "mm-net-chevron--open" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="mm-net-dropdown"
          role="listbox"
          aria-label="Select MST Network"
        >
          <div className="mm-net-dropdown__header">
            <Globe size={13} aria-hidden="true" />
            <span>Select Network</span>
          </div>

          <div className="mm-net-dropdown__options">
            {/* MST Testnet */}
            <button
              type="button"
              role="option"
              aria-selected={selectedNetwork === "mstTestnet"}
              className={`mm-net-option ${
                selectedNetwork === "mstTestnet" ? "mm-net-option--active" : ""
              }`}
              onClick={() => handleSelect("mstTestnet")}
            >
              <div className="mm-net-option__left">
                <span className="mm-net-dot mm-net-dot--testnet" />
                <div>
                  <div className="mm-net-option__title-row">
                    <span className="mm-net-option__title">MST Testnet</span>
                    <span className="mm-net-badge mm-net-badge--testnet">TESTNET</span>
                  </div>
                  <p className="mm-net-option__sub">
                    Chain 91562037 · Verified MandiMint Contract
                  </p>
                </div>
              </div>
              {selectedNetwork === "mstTestnet" && (
                <span className="mm-net-option__check">✓</span>
              )}
            </button>

            {/* MST Mainnet */}
            <button
              type="button"
              role="option"
              aria-selected={selectedNetwork === "mstMainnet"}
              className={`mm-net-option ${
                selectedNetwork === "mstMainnet" ? "mm-net-option--active" : ""
              }`}
              onClick={() => handleSelect("mstMainnet")}
            >
              <div className="mm-net-option__left">
                <span className="mm-net-dot mm-net-dot--mainnet" />
                <div>
                  <div className="mm-net-option__title-row">
                    <span className="mm-net-option__title">MST Mainnet</span>
                    <span className="mm-net-badge mm-net-badge--mainnet">MAINNET</span>
                  </div>
                  <p className="mm-net-option__sub">
                    Chain 4646 · Production (Contract Undeployed)
                  </p>
                </div>
              </div>
              {selectedNetwork === "mstMainnet" && (
                <span className="mm-net-option__check">✓</span>
              )}
            </button>
          </div>

          <div className="mm-net-dropdown__footer">
            <Sparkles size={11} />
            <span>MandiMint keeps Testnet and Mainnet strictly isolated.</span>
          </div>
        </div>
      )}
    </div>
  );
}
