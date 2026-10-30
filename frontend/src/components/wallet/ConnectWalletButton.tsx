import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Flame,
  Globe,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    disconnect,
    switchWalletToSelectedNetwork,
    selectedNetworkConfig,
    isNetworkMismatch,
    refreshState,
  } = useWeb3Wallet();

  const { role } = useAuthoritativeRole(connected);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleCopy = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshState();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  }, [isRefreshing, refreshState]);

  const handleDisconnect = useCallback(() => {
    setMenuOpen(false);
    disconnect();
    navigate("/");
  }, [disconnect, navigate]);

  if (!connected) {
    return (
      <Link
        to="/auth"
        className={`mm-bridgekey-btn mm-bridgekey-btn--connect ${
          variant === "outline" ? "mm-bridgekey-btn--outline" : ""
        } ${className}`}
        title="Sign in to MandiMint"
      >
        <Wallet size={16} aria-hidden="true" />
        <span className="mm-bridgekey-btn__text">
          {isConnecting ? "Connecting…" : "Sign In"}
        </span>
      </Link>
    );
  }

  return (
    <div ref={dropdownRef} className={`mm-bridgekey-user ${className}`}>
      {/* Network & Balance Pill */}
      <div className="mm-bridgekey-pill" title={`Network: ${networkName || selectedNetworkConfig.name}`}>
        <span
          className={`mm-status-dot ${
            isCorrectNetwork ? "mm-status-dot--green" : "mm-status-dot--amber"
          }`}
          aria-hidden="true"
        />
        <span className="mm-bridgekey-pill__network">
          {networkName || (isCorrectNetwork ? selectedNetworkConfig.name : "Wrong Network")}
        </span>
        {balance !== null && (
          <span className="mm-bridgekey-pill__balance">
            {balance} {isTestnet ? "tMSTC" : "MSTC"}
          </span>
        )}
      </div>

      {/* Account Trigger Button */}
      <button
        type="button"
        className={`mm-bridgekey-btn mm-bridgekey-btn--active ${
          menuOpen ? "mm-bridgekey-btn--open" : ""
        }`}
        onClick={() => setMenuOpen((o) => !o)}
        aria-expanded={menuOpen}
        aria-haspopup="true"
        title="Connected account details and shortcuts"
      >
        <span className="mm-bridgekey-btn__icon-wrap">
          <Wallet size={15} />
        </span>
        <span className="mm-bridgekey-btn__addr">
          {truncateAddress(address!, 6, 4)}
        </span>
        {role && (
          <span className="mm-bridgekey-btn__role">
            {ROLE_LABELS[role]}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`mm-bridgekey-btn__chevron ${
            menuOpen ? "mm-bridgekey-btn__chevron--open" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu Popover */}
      {menuOpen && (
        <div
          className="mm-bridgekey-menu"
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Summary */}
          <div className="mm-bridgekey-menu__head">
            <div className="mm-bridgekey-menu__head-top">
              <div className="mm-bridgekey-menu__status-label">
                <span
                  className={`mm-status-dot ${
                    isCorrectNetwork ? "mm-status-dot--green" : "mm-status-dot--amber"
                  }`}
                  aria-hidden="true"
                />
                <span className="mm-bridgekey-menu__label">Connected Account</span>
              </div>
              <span className="mm-bridgekey-menu__net-chip">
                {networkName || (isCorrectNetwork ? selectedNetworkConfig.name : "Unknown Chain")}
              </span>
            </div>

            {/* Address Row Card with 1-Click Copy */}
            <div className="mm-bridgekey-menu__address-card">
              <div className="mm-bridgekey-menu__address-info">
                <code className="mm-bridgekey-menu__code" title={address!}>
                  {truncateAddress(address!, 8, 6)}
                </code>
                {balance !== null && (
                  <span className="mm-bridgekey-menu__balance-text">
                    {balance} {isTestnet ? "tMSTC" : "MSTC"}
                  </span>
                )}
              </div>
              <button
                type="button"
                className={`mm-bridgekey-menu__action-icon ${
                  copied ? "mm-bridgekey-menu__action-icon--copied" : ""
                }`}
                onClick={handleCopy}
                title={copied ? "Copied to clipboard!" : "Copy full address"}
                aria-label="Copy address"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span className="mm-bridgekey-menu__copy-text">
                  {copied ? "Copied" : "Copy"}
                </span>
              </button>
            </div>

            {/* Role & Privileges Badge */}
            <div className="mm-bridgekey-menu__role-row">
              {isOwner ? (
                <span className="mm-tag mm-tag--gold">
                  <Sparkles size={11} aria-hidden="true" />
                  <span>Contract Owner</span>
                </span>
              ) : isManager ? (
                <span className="mm-tag mm-tag--green">
                  <ShieldCheck size={11} aria-hidden="true" />
                  <span>Authorized Manager</span>
                </span>
              ) : role === "farmer" ? (
                <span className="mm-tag mm-tag--green">Farmer Workspace</span>
              ) : role === "fpo_admin" ? (
                <span className="mm-tag mm-tag--amber">FPO Manager (Unverified On-Chain)</span>
              ) : (
                <span className="mm-tag mm-tag--gray">Role Not Selected</span>
              )}
              <span className="mm-bridgekey-menu__chain-note">MST Blockchain</span>
            </div>
          </div>

          <div className="mm-bridgekey-menu__body">
            {/* Wrong Network / Network Mismatch Warning Banner */}
            {isNetworkMismatch && (
              <div className="mm-bridgekey-menu__mismatch-banner">
                <div className="mm-bridgekey-menu__mismatch-head">
                  <span aria-hidden="true">⚠️</span>
                  <p className="mm-bridgekey-menu__mismatch-title">Network Mismatch</p>
                </div>
                <p className="mm-bridgekey-menu__mismatch-desc">
                  MandiMint is configured for <strong>{selectedNetworkConfig.name}</strong>, but your wallet is connected to another network.
                </p>
                <button
                  type="button"
                  className="mm-bridgekey-menu__switch-btn"
                  onClick={switchWalletToSelectedNetwork}
                >
                  Switch Wallet to {selectedNetworkConfig.name}
                </button>
              </div>
            )}

            <p className="mm-bridgekey-menu__section-title">Workspace & Actions</p>

            {/* Faucet Link */}
            {isTestnet && selectedNetworkConfig.faucetUrl && (
              <a
                href={selectedNetworkConfig.faucetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mm-bridgekey-menu__item mm-bridgekey-menu__item--faucet"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <span className="mm-bridgekey-menu__item-icon mm-bridgekey-menu__item-icon--faucet">
                  <Flame size={15} />
                </span>
                <div className="mm-bridgekey-menu__item-text">
                  <span className="mm-bridgekey-menu__item-label">Claim Free tMSTC</span>
                  <span className="mm-bridgekey-menu__item-sub">Testnet faucet for gas</span>
                </div>
                <ExternalLink size={13} className="mm-bridgekey-menu__item-ext" aria-hidden="true" />
              </a>
            )}

            {/* Explorer Link */}
            <a
              href={`${selectedNetworkConfig.explorerUrl.replace(/\/$/, "")}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mm-bridgekey-menu__item"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              <span className="mm-bridgekey-menu__item-icon mm-bridgekey-menu__item-icon--explorer">
                <Globe size={15} />
              </span>
              <div className="mm-bridgekey-menu__item-text">
                <span className="mm-bridgekey-menu__item-label">
                  View on {selectedNetworkConfig.name} Explorer
                </span>
                <span className="mm-bridgekey-menu__item-sub">
                  Verify transactions on-chain
                </span>
              </div>
              <ExternalLink size={13} className="mm-bridgekey-menu__item-ext" aria-hidden="true" />
            </a>

            {/* Switch Role link */}
            <Link
              to="/onboarding"
              className="mm-bridgekey-menu__item"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              <span className="mm-bridgekey-menu__item-icon mm-bridgekey-menu__item-icon--role">
                <UserCheck size={15} />
              </span>
              <div className="mm-bridgekey-menu__item-text">
                <span className="mm-bridgekey-menu__item-label">Switch Workspace Role</span>
                <span className="mm-bridgekey-menu__item-sub">Farmer / Manager mode</span>
              </div>
              <ChevronRight size={14} className="mm-bridgekey-menu__item-ext" aria-hidden="true" />
            </Link>

            {/* Refresh State */}
            <button
              type="button"
              className="mm-bridgekey-menu__item"
              onClick={handleRefresh}
              role="menuitem"
              disabled={isRefreshing}
            >
              <span className="mm-bridgekey-menu__item-icon mm-bridgekey-menu__item-icon--refresh">
                <RefreshCw size={15} className={isRefreshing ? "mm-spin" : ""} />
              </span>
              <div className="mm-bridgekey-menu__item-text">
                <span className="mm-bridgekey-menu__item-label">
                  {isRefreshing ? "Refreshing Balance…" : "Refresh Balance"}
                </span>
                <span className="mm-bridgekey-menu__item-sub">Sync latest on-chain state</span>
              </div>
            </button>
          </div>

          {/* Footer with Disconnect */}
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
