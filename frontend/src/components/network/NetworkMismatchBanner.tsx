import { AlertTriangle, ArrowRightLeft } from "lucide-react";
import { useWeb3Wallet } from "../../providers/Web3WalletContext";
import { getNetworkConfigByChainId } from "../../config/networks";

export function NetworkMismatchBanner() {
  const {
    connected,
    chainId,
    networkName,
    selectedNetworkConfig,
    isNetworkMismatch,
    switchWalletToSelectedNetwork,
    setSelectedNetwork,
  } = useWeb3Wallet();

  if (!connected || !isNetworkMismatch) {
    return null;
  }

  const walletNetwork = chainId ? getNetworkConfigByChainId(chainId) : null;
  const connectedLabel = walletNetwork ? walletNetwork.name : (networkName || `Chain ID ${chainId}`);

  return (
    <div
      role="alert"
      style={{
        margin: "1rem 0",
        padding: "0.85rem 1.15rem",
        background: "#fef2f2",
        border: "1px solid #f87171",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.75rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
        <AlertTriangle
          size={20}
          style={{ color: "#dc2626", marginTop: "2px", flexShrink: 0 }}
          aria-hidden="true"
        />
        <div>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "0.875rem",
              color: "#991b1b",
            }}
          >
            Network Mismatch Detected
          </p>
          <p
            style={{
              margin: "0.2rem 0 0 0",
              fontSize: "0.8125rem",
              color: "#7f1d1d",
            }}
          >
            MandiMint workspace is set to <strong>{selectedNetworkConfig.name}</strong> (Chain #{selectedNetworkConfig.chainId}),
            but your connected wallet is on <strong>{connectedLabel}</strong>.
            Blockchain writes are blocked until networks match to prevent accidental cross-chain transactions.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginLeft: "auto" }}>
        <button
          type="button"
          onClick={switchWalletToSelectedNetwork}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.45rem 0.85rem",
            background: "#dc2626",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            fontSize: "0.8125rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <ArrowRightLeft size={14} />
          Switch Wallet to {selectedNetworkConfig.name}
        </button>

        {walletNetwork && (
          <button
            type="button"
            onClick={() => setSelectedNetwork(walletNetwork.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.45rem 0.85rem",
              background: "#ffffff",
              color: "#991b1b",
              border: "1px solid #fca5a5",
              borderRadius: "6px",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Switch Workspace to {walletNetwork.name}
          </button>
        )}
      </div>
    </div>
  );
}
