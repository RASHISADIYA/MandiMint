import {
  Info,
  PlusCircle,
  RefreshCw,
  Search,
  Sprout,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useFarmerHistory } from "../../hooks/useMandiMintReads";
import { useWeb3Wallet } from "../../providers/Web3WalletContext";
import { readBatch, type MandiMintBatch } from "../../lib/blockchain/mandiMintContract";
import { getCropById } from "../../lib/blockchain/crops";
import { formatTimestamp, truncateAddress } from "../../lib/format";

export function FarmerDashboardPage() {
  const {
    connected,
    address,
    isManager,
    isOwner,
    selectedNetwork,
    selectedNetworkConfig,
    isNetworkMismatch,
  } = useWeb3Wallet();

  // Load genuine farmer allocations for this wallet from the smart contract
  const history = useFarmerHistory(connected ? address : null);
  const [enrichedBatches, setEnrichedBatches] = useState<Record<string, MandiMintBatch>>({});
  const [loadingBatchDetails, setLoadingBatchDetails] = useState(false);

  // When farmer allocations arrive, fetch batch details for each allocation
  useEffect(() => {
    if (!history.data || history.data.length === 0) {
      setEnrichedBatches({});
      return;
    }

    let isMounted = true;
    setLoadingBatchDetails(true);

    const fetchDetails = async () => {
      const results: Record<string, MandiMintBatch> = {};
      for (const row of history.data!) {
        try {
          const batch = await readBatch(row.batchId, selectedNetwork);
          results[row.batchId.toString()] = batch;
        } catch {
          // If individual batch read fails, continue
        }
      }
      if (isMounted) {
        setEnrichedBatches(results);
        setLoadingBatchDetails(false);
      }
    };

    void fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [history.data, selectedNetwork]);

  // Calculate genuine summary statistics
  const stats = useMemo(() => {
    if (!history.data || history.data.length === 0) {
      return {
        batchCount: 0,
        totalQuantityKg: 0n,
        recentBatchId: null as bigint | null,
      };
    }

    const count = history.data.length;
    const totalKg = history.data.reduce((sum, item) => sum + item.quantityKg, 0n);
    const recent = history.data[history.data.length - 1]?.batchId ?? null;

    return {
      batchCount: count,
      totalQuantityKg: totalKg,
      recentBatchId: recent,
    };
  }, [history.data]);

  return (
    <div className="mm-page">
      {/* Farmer Dashboard Header */}
      <header className="mm-page-head">
        <div>
          <p className="mm-page-head__eyebrow">
            <Sprout size={14} aria-hidden="true" />
            Farmer Workspace
          </p>
          <h1 className="mm-page-head__title">Farmer Dashboard</h1>
          <p className="mm-page-head__lead">
            Manage your produce records and track agricultural batches on MST Blockchain.
          </p>
        </div>

        {/* Primary Action Button */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          {isManager || isOwner ? (
            <Link
              to="/app/manager/record"
              className="mm-btn mm-btn--primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            >
              <PlusCircle size={16} /> Record New Batch
            </Link>
          ) : (
            <Link
              to="/app/batches"
              className="mm-btn mm-btn--outline"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Search size={16} /> Explore All Batches
            </Link>
          )}
        </div>
      </header>

      {/* Contract & Permission Notice */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
          padding: "0.85rem 1.25rem",
          background: "var(--color-surface)",
          border: "1px solid var(--color-borders)",
          borderRadius: "var(--radius-lg)",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
          <Wallet size={16} style={{ color: "var(--color-agricultural-green)" }} />
          <span>Connected Farmer Wallet:</span>
          <code>{truncateAddress(address || "", 8, 6)}</code>
          <StatusBadge variant={!isNetworkMismatch ? "success" : "warning"}>
            {selectedNetworkConfig.name}
          </StatusBadge>
        </div>

        <button
          type="button"
          onClick={history.reload}
          disabled={history.status === "loading"}
          className="mm-btn mm-btn--ghost"
          style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
        >
          <RefreshCw size={13} className={history.status === "loading" ? "mm-spin" : ""} /> Refresh Records
        </button>
      </div>

      {/* Genuine Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div className="mm-dashboard-stat-card">
          <span className="mm-dashboard-stat-card__label">My Recorded Batches</span>
          <span className="mm-dashboard-stat-card__value">
            {history.status === "loading" ? "…" : stats.batchCount}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--color-secondary-text)" }}>
            Verified on MST Blockchain
          </span>
        </div>

        <div className="mm-dashboard-stat-card">
          <span className="mm-dashboard-stat-card__label">Total Produce Traced</span>
          <span className="mm-dashboard-stat-card__value">
            {history.status === "loading"
              ? "…"
              : `${stats.totalQuantityKg.toLocaleString()} kg`}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--color-secondary-text)" }}>
            Cumulative delivery weight
          </span>
        </div>

        <div className="mm-dashboard-stat-card">
          <span className="mm-dashboard-stat-card__label">Recent Batch Activity</span>
          <span className="mm-dashboard-stat-card__value" style={{ fontSize: "1.25rem" }}>
            {history.status === "loading"
              ? "…"
              : stats.recentBatchId
              ? `#${stats.recentBatchId.toString()}`
              : "None"}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--color-secondary-text)" }}>
            {stats.recentBatchId ? "Confirmed on-chain" : "No recent allocations"}
          </span>
        </div>

        <div className="mm-dashboard-stat-card">
          <span className="mm-dashboard-stat-card__label">Record Status</span>
          <span className="mm-dashboard-stat-card__value" style={{ fontSize: "1.25rem", color: "var(--color-success)" }}>
            Auditable
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--color-secondary-text)" }}>
            Append-only smart contract
          </span>
        </div>
      </div>

      {/* Batch Recording Permission Guidance for Farmers */}
      {!isManager && !isOwner && (
        <div
          style={{
            padding: "1rem 1.25rem",
            background: "var(--color-neutral-bg)",
            border: "1px solid var(--color-borders)",
            borderRadius: "var(--radius-lg)",
            marginBottom: "2rem",
            fontSize: "0.85rem",
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-start",
          }}
        >
          <Info size={18} style={{ color: "var(--color-agricultural-green)", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong>How Produce Batch Recording Works:</strong> In physical mandi market yards,
            grain weighment, quality testing, and aggregation are recorded by authorized FPO/Mandi managers.
            When the manager submits a batch on MST Blockchain, your farmer wallet address receives an
            immutable allocation. To record batches yourself, request on-chain manager authorization from
            the MandiMint contract administrator.
          </div>
        </div>
      )}

      {/* Verified Produce Records Table / Empty State */}
      <section className="mm-panel">
        <div className="mm-panel__head">
          <div>
            <p className="mm-panel__eyebrow">On-Chain Traceability History</p>
            <h2 className="mm-panel__title">My Produce Allocations</h2>
          </div>
          <span className="mm-tag mm-tag--green">MST Blockchain Verified</span>
        </div>

        {history.status === "loading" ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--color-secondary-text)" }}>
            <p>Querying MST Testnet for farmer allocations…</p>
          </div>
        ) : history.status === "error" ? (
          <div
            style={{
              padding: "1.5rem",
              background: "var(--color-error-bg)",
              border: "1px solid var(--color-error)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-error)",
              fontSize: "0.875rem",
            }}
          >
            <p style={{ margin: "0 0 0.5rem 0", fontWeight: 600 }}>Could not read farmer history from contract:</p>
            <p style={{ margin: 0 }}>{history.error}</p>
          </div>
        ) : !history.data || history.data.length === 0 ? (
          <EmptyState
            icon={Sprout}
            title="No batches recorded yet"
            description="Your agricultural produce deliveries will appear here as soon as an authorized Mandi or FPO Manager registers your lot on the MandiMint smart contract."
            action={
              <Link to="/app/batches" className="mm-btn mm-btn--primary">
                Browse Public Verified Batches
              </Link>
            }
          />
        ) : (
          <div className="mm-table-wrap" style={{ marginTop: "1rem" }}>
            <table className="mm-table">
              <thead>
                <tr>
                  <th scope="col">Batch ID</th>
                  <th scope="col">Crop Variety</th>
                  <th scope="col">My Allocated Weight</th>
                  <th scope="col">Batch Recorded Date</th>
                  <th scope="col">Manager</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {history.data.map((row) => {
                  const batchDetails = enrichedBatches[row.batchId.toString()];
                  const crop = batchDetails ? getCropById(batchDetails.cropId) : null;

                  return (
                    <tr key={row.batchId.toString()}>
                      <td>
                        <strong style={{ color: "var(--color-deep-forest)" }}>
                          #{row.batchId.toString()}
                        </strong>
                      </td>
                      <td>
                        {crop ? (
                          <span>
                            {crop.name} <span style={{ opacity: 0.6 }}>({crop.hindiName})</span>
                          </span>
                        ) : loadingBatchDetails ? (
                          <span style={{ color: "var(--color-secondary-text)" }}>Loading…</span>
                        ) : (
                          "Agricultural Produce"
                        )}
                      </td>
                      <td>
                        <strong style={{ color: "var(--color-agricultural-green)" }}>
                          {row.quantityKg.toLocaleString()} kg
                        </strong>
                      </td>
                      <td>
                        {batchDetails?.createdAt ? (
                          formatTimestamp(batchDetails.createdAt)
                        ) : (
                          "Confirmed on-chain"
                        )}
                      </td>
                      <td>
                        {batchDetails?.manager ? (
                          <code>{truncateAddress(batchDetails.manager, 6, 4)}</code>
                        ) : (
                          "Authorized Manager"
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/app/batches/${row.batchId.toString()}`}
                          className="mm-btn mm-btn--outline"
                          style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
