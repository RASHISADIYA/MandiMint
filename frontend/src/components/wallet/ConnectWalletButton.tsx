import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Flame,
  Globe,
  LogOut,
  RefreshCw,
  UserCheck,
  Wallet,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWeb3Wallet } from "../../providers/Web3WalletContext";
import { useAuthoritativeRole } from "../../hooks/useAuthoritativeRole";
import { ROLE_LABELS } from "../../auth/roles";
import { truncateAddress } from "../../lib/format";
import "./bridgekey-button.css";

interface ConnectWalletButtonProps {
  className?: string;
  variant?: "primary" | "outline" | "compact";
}

export function ConnectWalletButton({
  className = "",
  variant = "primary",
}: ConnectWalletButtonProps) {
  const navigate = useNavigate();
  const {
    connected,
    address,
    networkName,
    isTestnet,
    isCorrectNetwork,
    balance,
    isManager,
    isOwner,
    isConnecting,
    error,
    connectBridgeKey,
    connectInjected,
    disconnect,
    switchWalletToSelectedNetwork,
    selectedNetworkConfig,
    isNetworkMismatch,
    refreshState,
  } = useWeb3Wallet();

  const { role } = useAuthoritativeRole(connected);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address]);

  const handleDisconnect = useCallback(() => {
    setMenuOpen(false);
    disconnect();
    navigate("/");
  }, [disconnect, navigate]);

  if (!connected) {
    return (
      <>
        <button
          type="button"
          className={`mm-bridgekey-btn mm-bridgekey-btn--connect ${
            variant === "outline" ? "mm-bridgekey-btn--outline" : ""
          } ${className}`}
          onClick={() => setModalOpen(true)}
          disabled={isConnecting}
          title="Sign in or connect your Web3 wallet"
        >
          <Wallet size={16} aria-hidden="true" />
          <span className="mm-bridgekey-btn__text">
            {isConnecting ? "Connecting…" : "Sign In / Connect Wallet"}
          </span>
        </button>

        {modalOpen && (
          <div className="mm-modal-overlay" onClick={() => setModalOpen(false)}>
            <div
              className="mm-modal-card"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="wallet-modal-title"
            >
              <div className="mm-modal-card__head">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Wallet size={18} style={{ color: "var(--color-primary)" }} />
                  <h3 id="wallet-modal-title" className="mm-modal-card__title">
                    Sign In / Connect Wallet
                  </h3>
                </div>
                <button
                  type="button"
                  className="mm-modal-card__close"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>

              <p className="mm-modal-card__desc">
                Connect your Web3 wallet to record agricultural batches, track produce
                allocations, and verify records on MST Blockchain.
              </p>

              {error && (
                <div
                  style={{
                    padding: "0.6rem 0.8rem",
                    marginBottom: "1rem",
                    background: "var(--color-error-bg)",
                    border: "1px solid var(--color-error)",
                    borderRadius: "6px",
                    color: "var(--color-error)",
                    fontSize: "0.825rem",
                  }}
                >
                  ⚠️ {error}
                </div>
              )}

              <div className="mm-wallet-options">
                <button
                  type="button"
                  className="mm-wallet-option mm-wallet-option--primary"
                  onClick={async () => {
                    setModalOpen(false);
                    try {
                      await connectBridgeKey();
                    } catch {
                      await connectInjected();
                    }
                  }}
                >
                  <div className="mm-wallet-option__left">
                    <span className="mm-wallet-option__icon">🌉</span>
                    <div>
                      <p className="mm-wallet-option__name">
                        BridgeKey Wallet
                        <span className="mm-tag mm-tag--gold">Official</span>
                      </p>
                      <p className="mm-wallet-option__hint">
                        MST Blockchain official non-custodial extension
                      </p>
                    </div>
                  </div>
                  <span className="mm-wallet-option__arrow">→</span>
                </button>

                <button
                  type="button"
                  className="mm-wallet-option"
                  onClick={async () => {
                    setModalOpen(false);
                    await connectInjected();
                  }}
                >
                  <div className="mm-wallet-option__left">
                    <span className="mm-wallet-option__icon">🦊</span>
                    <div>
                      <p className="mm-wallet-option__name">Browser Web3 / MetaMask</p>
                      <p className="mm-wallet-option__hint">
                        Any EIP-1193 compatible browser wallet
                      </p>
                    </div>
                  </div>
                  <span className="mm-wallet-option__arrow">→</span>
                </button>

                <a
                  href="https://chromewebstore.google.com/detail/bridgekey/bfjojdcfenehemjgjlepdjomkpginlkg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mm-wallet-install-link"
                >
                  Don&apos;t have BridgeKey? Install extension{" "}
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`mm-bridgekey-user ${className}`}>
      {/* Network & Balance Pill */}
      <div className="mm-bridgekey-pill">
        <span
          className={`mm-status-dot ${
            isCorrectNetwork ? "mm-status-dot--green" : "mm-status-dot--amber"
          }`}
          aria-hidden="true"
        />
        <span className="mm-bridgekey-pill__network">
          {networkName || (isCorrectNetwork ? "MST Testnet" : "Wrong Network")}
        </span>
        {balance !== null && (
          <span className="mm-bridgekey-pill__balance">
            {balance} {isTestnet ? "tMSTC" : "MSTC"}
          </span>
        )}
      </div>

      {/* Account Button */}
      <button
        type="button"
        className="mm-bridgekey-btn mm-bridgekey-btn--active"
        onClick={() => setMenuOpen((o) => !o)}
        aria-expanded={menuOpen}
        aria-haspopup="true"
      >
        <Wallet size={15} style={{ color: "var(--color-primary)" }} />
        <span className="mm-bridgekey-btn__addr">
          {truncateAddress(address!, 6, 4)}
        </span>
        {role && (
          <span
            style={{
              fontSize: "0.7rem",
              background: "var(--color-soft-sage)",
              color: "var(--color-deep-forest)",
              padding: "0.1rem 0.4rem",
              borderRadius: "4px",
              fontWeight: 600,
            }}
          >
            {ROLE_LABELS[role]}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`mm-bridgekey-btn__chevron ${menuOpen ? "mm-bridgekey-btn__chevron--open" : ""}`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div
          className="mm-bridgekey-menu"
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mm-bridgekey-menu__head">
            <p className="mm-bridgekey-menu__label">Connected Account</p>
            <div className="mm-bridgekey-menu__address-row">
              <code className="mm-bridgekey-menu__code" title={address!}>
                {truncateAddress(address!, 8, 6)}
              </code>
              <button
                type="button"
                className="mm-bridgekey-menu__action-icon"
                onClick={handleCopy}
                title="Copy full address"
              >
                {copied ? <Check size={14} style={{ color: "var(--color-success)" }} /> : <Copy size={14} />}
              </button>
            </div>

            {/* Role & Privileges Badge */}
            <div style={{ marginTop: "0.5rem" }}>
              {isOwner ? (
                <span className="mm-tag mm-tag--gold">Contract Owner</span>
              ) : isManager ? (
                <span className="mm-tag mm-tag--green">Authorized Manager</span>
              ) : role === "farmer" ? (
                <span className="mm-tag mm-tag--green">Farmer Workspace</span>
              ) : role === "fpo_admin" ? (
                <span className="mm-tag mm-tag--amber">FPO Manager (Unverified On-Chain)</span>
              ) : (
                <span className="mm-tag mm-tag--gray">Role Not Selected</span>
              )}
            </div>
          </div>

          <div className="mm-bridgekey-menu__body">
            {/* Wrong Network / Network Mismatch Warning */}
            {isNetworkMismatch && (
              <div
                style={{
                  padding: "0.6rem 0.8rem",
                  margin: "0.5rem",
                  background: "var(--color-warning-bg)",
                  border: "1px solid var(--color-warning)",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                }}
              >
                <p style={{ margin: "0 0 0.4rem 0", fontWeight: 600, color: "var(--color-warning)" }}>
                  ⚠️ Network Mismatch
                </p>
                <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                  MandiMint is set to {selectedNetworkConfig.name}, but your wallet is on another chain.
                </p>
                <button
                  type="button"
                  className="mm-btn mm-btn--primary"
                  onClick={switchWalletToSelectedNetwork}
                  style={{ width: "100%", fontSize: "0.75rem", padding: "0.3rem" }}
                >
                  Switch Wallet to {selectedNetworkConfig.name}
                </button>
              </div>
            )}

            {/* Faucet Link */}
            {isTestnet && selectedNetworkConfig.faucetUrl && (
              <a
                href={selectedNetworkConfig.faucetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mm-bridgekey-menu__item"
                role="menuitem"
              >
                <Flame size={15} style={{ color: "var(--color-warning)" }} />
                <span>Claim Free tMSTC</span>
                <ExternalLink size={12} style={{ marginLeft: "auto", opacity: 0.6 }} />
              </a>
            )}

            {/* Explorer Link */}
            <a
              href={`${selectedNetworkConfig.explorerUrl.replace(/\/$/, "")}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mm-bridgekey-menu__item"
              role="menuitem"
            >
              <Globe size={15} />
              <span>View on {selectedNetworkConfig.name} Explorer</span>
              <ExternalLink size={12} style={{ marginLeft: "auto", opacity: 0.6 }} />
            </a>

            {/* Switch Role link */}
            <Link
              to="/onboarding"
              className="mm-bridgekey-menu__item"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              <UserCheck size={15} />
              <span>Switch Workspace Role</span>
            </Link>

            {/* Refresh State */}
            <button
              type="button"
              className="mm-bridgekey-menu__item"
              onClick={async () => {
                await refreshState();
              }}
              role="menuitem"
            >
              <RefreshCw size={15} />
              <span>Refresh Balance</span>
            </button>
          </div>

          <div className="mm-bridgekey-menu__foot">
            <button
              type="button"
              className="mm-bridgekey-menu__disconnect"
              onClick={handleDisconnect}
              role="menuitem"
            >
              <LogOut size={14} />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
