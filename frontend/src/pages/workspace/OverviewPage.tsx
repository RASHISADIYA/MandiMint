import {
  ArrowRight,
  ClipboardPlus,
  ExternalLink,
  Flame,
  Globe,
  History,
  Layers,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useManagerStatus, useOnChainBatches } from "../../hooks/useMandiMintReads";
import { useAuthoritativeRole } from "../../hooks/useAuthoritativeRole";
import { useWalletOnboarding } from "../../hooks/useWalletOnboarding";
import { useWeb3Wallet } from "../../providers/Web3WalletContext";
import { getExplorerTxUrl } from "../../config/networks";
import { truncateAddress } from "../../lib/format";

export type DashboardMode = "farmer" | "manager";

interface OverviewPageProps {
  dashboardMode?: DashboardMode;
  mode?: DashboardMode;
}

export function OverviewPage(_props?: OverviewPageProps) {
  void _props;
  const { walletAddress } = useWalletOnboarding();
  const { role } = useAuthoritativeRole(true);
  const web3 = useWeb3Wallet();

  const activeAddress = web3.connected ? web3.address : walletAddress;
  const manager = useManagerStatus(
    role === "fpo_admin" ? walletAddress : null,
    web3.selectedNetwork,
  );

  const batchesQuery = useOnChainBatches(web3.selectedNetwork);
  const recordedBatches = batchesQuery.data ?? [];

  const isManagerOrOwner = web3.connected
    ? web3.isManager || web3.isOwner
    : manager.data === true;

  const actions = [
    {
      to: "/app/manager/record",
      title: "Record a batch",
      description: web3.isContractConfigured
        ? "Submit an on-chain batch with validated farmer allocations."
        : `Deployment pending on ${web3.selectedNetworkConfig.name}.`,
      icon: ClipboardPlus,
      highlight: isManagerOrOwner && web3.isContractConfigured,
    },
    {
      to: "/app/batches",
      title: "Batch Explorer",
      description: "Inspect on-chain batches and cryptographic proofs.",
      icon: Search,
      highlight: false,
    },
    {
      to: "/app/farmer/history",
      title: "Farmer History",
      description: "Review crop sales and allocations linked to any wallet.",
      icon: History,
      highlight: false,
    },
    {
      to: "/app/manager/authorize",
      title: "Manager Authorization",
      description: "Owner administration for authorizing batch manager wallets.",
      icon: ShieldCheck,
      highlight: false,
    },
  ];

  return (
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <p className="mm-page-head__eyebrow">
            <UserRound size={14} aria-hidden="true" />
            Agricultural Produce Traceability Dashboard
          </p>
          <h1 className="mm-page-head__title">
            MandiMint · {web3.selectedNetworkConfig.name} Workspace
          </h1>
          <p className="mm-page-head__lead">
            Tamper-evident recordkeeping for agricultural crop sale batches,
            mandi prices, and farmer allocations on MST Blockchain.
          </p>
        </div>
        <div className="mm-workspace__chip">
          <Wallet size={14} aria-hidden="true" />
          <span>
            {activeAddress
              ? truncateAddress(activeAddress, 6, 4)
              : "No wallet connected"}
          </span>
          {web3.connected && (
            <span style={{ color: "#059669", fontWeight: 700 }}>
              · {web3.balance ?? "0.00"} {web3.selectedNetworkConfig.currency.symbol}
            </span>
          )}
        </div>
      </header>

      {/* Network & Contract Status Banner */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "1rem 1.25rem",
          background: web3.isMainnet
            ? "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
            : "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
          border: web3.isMainnet ? "1px solid #fde68a" : "1px solid #a7f3d0",
          borderRadius: "12px",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 0.25rem 0",
              fontSize: "0.8rem",
              color: web3.isMainnet ? "#92400e" : "#065f46",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {web3.isMainnet ? "🟡" : "🟢"} {web3.selectedNetworkConfig.name} · Chain ID: {web3.selectedNetworkConfig.chainId}
          </p>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#1f2937" }}>
            {web3.selectedNetworkConfig.contractAddress ? (
              <>
                Verified Contract:{" "}
                <a
                  href={`${web3.selectedNetworkConfig.explorerUrl.replace(/\/$/, "")}/address/${web3.selectedNetworkConfig.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: "monospace",
                    color: web3.isMainnet ? "#b45309" : "#059669",
                    fontWeight: 600,
                    textDecoration: "underline",
                  }}
                >
                  {web3.selectedNetworkConfig.contractAddress}
                </a>
              </>
            ) : (
              <span style={{ color: "#92400e", fontWeight: 600 }}>
                Smart Contract Undeployed on Mainnet (Read-Only Mode)
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          {web3.isTestnet && web3.selectedNetworkConfig.faucetUrl && (
            <a
              href={web3.selectedNetworkConfig.faucetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mm-btn mm-btn--secondary"
              style={{
                fontSize: "0.8rem",
                padding: "0.4rem 0.75rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Flame size={14} /> Claim Free tMSTC
            </a>
          )}
          {web3.isMainnet && !web3.isContractConfigured && (
            <button
              type="button"
              onClick={web3.switchToMstTestnet}
              className="mm-btn mm-btn--primary"
              style={{
                fontSize: "0.8rem",
                padding: "0.4rem 0.75rem",
              }}
            >
              Switch to MST Testnet (Verified Contract) →
            </button>
          )}
          <a
            href={web3.selectedNetworkConfig.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mm-btn mm-btn--outline"
            style={{
              fontSize: "0.8rem",
              padding: "0.4rem 0.75rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <Globe size={14} /> {web3.selectedNetworkConfig.name} Explorer <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <div className="mm-overview-grid">
        {/* Wallet & Role Status Card */}
        <section className="mm-panel">
          <div className="mm-panel__head">
            <div>
              <p className="mm-panel__eyebrow">Wallet &amp; Authorization</p>
              <h2 className="mm-panel__title">
                {web3.connected ? "Connected Wallet" : "Web3 Connection"}
              </h2>
            </div>
            {web3.connected ? (
              <StatusBadge variant="success">Active</StatusBadge>
            ) : (
              <StatusBadge variant="neutral">Disconnected</StatusBadge>
            )}
          </div>

          <dl className="mm-details-list">
            <div>
              <dt>Address</dt>
              <dd>
                {activeAddress ? (
                  <code>{truncateAddress(activeAddress, 10, 8)}</code>
                ) : (
                  "Connect wallet to interact"
                )}
              </dd>
            </div>
            <div>
              <dt>Network</dt>
              <dd>
                {web3.connected
                  ? `${web3.networkName || "MST Testnet"} (Chain ${web3.chainId})`
                  : "MST Testnet (91562037)"}
              </dd>
            </div>
            <div>
              <dt>Contract Role</dt>
              <dd>
                {web3.isOwner
                  ? "Contract Owner & Administrator"
                  : web3.isManager
                  ? "Authorized Batch Manager (On-Chain)"
                  : activeAddress
                  ? "Public / Farmer View"
                  : "None"}
              </dd>
            </div>
            <div>
              <dt>Balance</dt>
              <dd>
                {web3.connected
                  ? `${web3.balance ?? "0.00"} ${web3.isTestnet ? "tMSTC" : "MSTC"}`
                  : "Connect wallet to view"}
              </dd>
            </div>
          </dl>

          {!web3.connected && (
            <div style={{ marginTop: "1rem" }}>
              <button
                type="button"
                className="mm-btn mm-btn--primary"
                onClick={web3.connectBridgeKey}
                style={{ width: "100%", justifyContent: "center" }}
              >
                Connect Wallet
              </button>
            </div>
          )}
        </section>

        {/* Contract Statistics Card */}
        <section className="mm-panel">
          <div className="mm-panel__head">
            <div>
              <p className="mm-panel__eyebrow">Smart Contract Metrics</p>
              <h2 className="mm-panel__title">On-Chain Activity</h2>
            </div>
            <Layers aria-hidden="true" className="mm-panel__icon" />
          </div>

          <div className="mm-stat-grid" style={{ marginBottom: "1rem" }}>
            <div className="mm-dashboard-stat-card">
              <span className="mm-dashboard-stat-card__label">Recorded On-Chain Batches</span>
              <span className="mm-dashboard-stat-card__value">
                {recordedBatches.length}
              </span>
            </div>
            <div className="mm-dashboard-stat-card">
              <span className="mm-dashboard-stat-card__label">Total Crops Traced</span>
              <span className="mm-dashboard-stat-card__value">
                {recordedBatches.reduce((acc, b) => acc + (b.totalQuantityKg || 0), 0).toLocaleString()} kg
              </span>
            </div>
          </div>

          <p className="mm-panel__text" style={{ fontSize: "0.85rem", color: "#52645b" }}>
            All on-chain batch records enforce whole-kilogram conservation and nonzero constraints.
            Farmer allocations are immutable and publicly auditable on {web3.selectedNetworkConfig.name}.
          </p>

          <Link to="/app/batches" className="mm-text-link">
            Explore all recorded batches <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </div>

      {/* Quick Action Cards */}
      <section className="mm-quick-actions" aria-labelledby="actions-title">
        <div className="mm-section-row">
          <div>
            <p className="mm-panel__eyebrow">Quick Navigation</p>
            <h2 id="actions-title" className="mm-panel__title">
              What would you like to do?
            </h2>
          </div>
        </div>
        <div className="mm-action-grid">
          {actions.map(({ to, title, description, icon: Icon, highlight }) => (
            <Link
              key={to}
              to={to}
              className="mm-action-card"
              style={highlight ? { borderColor: "#10b981", background: "#f9fdfa" } : undefined}
            >
              <span className="mm-action-card__icon" aria-hidden="true">
                <Icon />
              </span>
              <span className="mm-action-card__title">{title}</span>
              <span className="mm-action-card__text">{description}</span>
              <span className="mm-action-card__link">
                Open <ArrowRight size={14} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recorded Batches On-Chain Table / Empty State */}
      <section className="mm-panel" style={{ marginTop: "1.5rem" }}>
        <div className="mm-panel__head">
          <div>
            <p className="mm-panel__eyebrow">On-Chain Activity</p>
            <h2 className="mm-panel__title">
              Recorded Batches on {web3.selectedNetworkConfig.name}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={batchesQuery.reload}
              disabled={batchesQuery.status === "loading"}
              className="mm-btn mm-btn--ghost"
              style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
              title="Refresh on-chain records"
            >
              <RefreshCw size={13} className={batchesQuery.status === "loading" ? "mm-spin" : ""} /> Refresh
            </button>
            <StatusBadge variant={recordedBatches.length > 0 ? "success" : "neutral"}>
              {batchesQuery.status === "loading"
                ? "Querying On-Chain…"
                : recordedBatches.length > 0
                ? `${recordedBatches.length} Batches On-Chain`
                : "No Records"}
            </StatusBadge>
          </div>
        </div>

        {/* Loading State */}
        {batchesQuery.status === "loading" && (
          <div
            style={{
              textAlign: "center",
              padding: "2.5rem 1.5rem",
              background: "#f9fafb",
              borderRadius: "8px",
              border: "1px dashed #d1d5db",
              marginTop: "0.75rem",
              color: "#4b5563",
            }}
          >
            <RefreshCw size={24} className="mm-spin" style={{ margin: "0 auto 0.75rem auto", display: "block", color: "var(--color-agricultural-green)" }} />
            <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1rem", color: "#1f2937" }}>
              Reading Deployed MandiMint Smart Contract…
            </h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280" }}>
              Querying verified batch logs and allocations on {web3.selectedNetworkConfig.name}.
            </p>
          </div>
        )}

        {/* Error State */}
        {batchesQuery.status === "error" && (
          <div style={{ marginTop: "0.75rem" }}>
            <ErrorBanner
              message={batchesQuery.error ?? `Failed to retrieve batch records from ${web3.selectedNetworkConfig.name}. Please check RPC connection.`}
              onRetry={batchesQuery.reload}
            />
          </div>
        )}

        {/* Empty State: Only when query successfully confirms 0 batches */}
        {batchesQuery.status === "success" && recordedBatches.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "2.5rem 1.5rem",
              background: "#f9fafb",
              borderRadius: "8px",
              border: "1px dashed #d1d5db",
              marginTop: "0.75rem",
            }}
          >
            <p style={{ fontSize: "1.75rem", margin: "0 0 0.5rem 0" }}>🌾</p>
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#374151", fontSize: "1.1rem", fontWeight: 700 }}>
              No batches recorded yet
            </h3>
            <p style={{ margin: "0 auto 1.5rem auto", maxWidth: "520px", color: "#6b7280", fontSize: "0.875rem" }}>
              Create the first verified agricultural batch on MST Testnet.
            </p>
            {web3.isMainnet ? (
              <button
                type="button"
                onClick={web3.switchToMstTestnet}
                className="mm-btn mm-btn--primary"
              >
                Switch to MST Testnet (91562037) →
              </button>
            ) : isManagerOrOwner ? (
              <Link to="/app/manager/record" className="mm-btn mm-btn--primary">
                Record a Batch on MST Testnet →
              </Link>
            ) : (
              <Link to="/app/batches" className="mm-btn mm-btn--outline">
                Query Batch ID on Smart Contract →
              </Link>
            )}
          </div>
        )}

        {/* Populated State */}
        {batchesQuery.status === "success" && recordedBatches.length > 0 && (
          <>
            <p className="mm-panel__text">
              These crop batches have been recorded on the MandiMint smart contract with
              tamper-evident farmer quantity allocations:
            </p>

            <div style={{ overflowX: "auto" }}>
              <table className="mm-table" style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left", fontSize: "0.8rem", color: "#6b7280" }}>
                    <th style={{ padding: "0.75rem 0.5rem" }}>BATCH ID</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>CROP</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>MANDI MARKET</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>QUANTITY</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>PRICE / TONNE</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>FARMERS</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>EXPLORER</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {recordedBatches.map((batch) => (
                    <tr key={batch.batchId} style={{ borderBottom: "1px solid #f3f4f6", fontSize: "0.85rem" }}>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700, color: "#174c3c" }}>
                        #{batch.batchId}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>
                        {batch.cropName}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", color: "#52645b" }}>
                        {batch.mandiName}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>
                        {batch.totalQuantityKg.toLocaleString()} kg
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        ₹{batch.salePriceInrPerTonne.toLocaleString()}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <span className="mm-tag mm-tag--gold">
                          {batch.farmers.length} Farmers
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        {batch.txHash ? (
                          <a
                            href={getExplorerTxUrl(web3.selectedNetwork, batch.txHash)}
                            target="_blank"
                            rel="noreferrer"
                            className="mm-inline-link"
                            style={{ fontSize: "0.75rem" }}
                          >
                            MSTScan <ExternalLink size={10} aria-hidden="true" />
                          </a>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>Contract State</span>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <Link
                          to={`/app/batches/${batch.batchId}`}
                          className="mm-btn mm-btn--outline"
                          style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
