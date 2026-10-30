import {
  ArrowLeft,
  ExternalLink,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { SkeletonCard } from "../../components/ui/LoadingSkeleton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useBatchDetails } from "../../hooks/useMandiMintReads";
import { getRecordedBatches } from "../../lib/blockchain/mandiMintContract";
import { getExplorerAddressUrl, getExplorerTxUrl } from "../../config/networks";
import { getCropById } from "../../lib/blockchain/crops";
import {
  formatGrossValue,
  formatInrPerTonne,
  formatQuantityKg,
  formatTimestamp,
  parseWholeNumber,
  truncateAddress,
} from "../../lib/format";
import { useMemo } from "react";
import { useWeb3Wallet } from "../../providers/Web3WalletContext";

export function BatchDetailsPage() {
  const { batchId: batchIdParam } = useParams<{ batchId: string }>();
  const parsedId = batchIdParam ? parseWholeNumber(batchIdParam) : null;
  const validId = parsedId !== null && parsedId > 0n ? parsedId : null;
  const web3 = useWeb3Wallet();
  const details = useBatchDetails(validId, web3.selectedNetwork);

  // Retrieve any supplementary off-chain metadata (e.g. txHash, mandi notes) recorded during client submission
  const recordedMatch = useMemo(() => {
    if (!validId) return null;
    const numId = Number(validId);
    const recorded = getRecordedBatches(web3.selectedNetwork);
    return recorded.find((b) => b.batchId === numId) ?? null;
  }, [validId, web3.selectedNetwork]);

  if (!validId) {
    return (
      <div className="mm-page">
        <header className="mm-page-head">
          <div>
            <p className="mm-page-head__eyebrow">
              <Search size={14} aria-hidden="true" />
              Batch Lookup
            </p>
            <h1 className="mm-page-head__title">Invalid Batch ID</h1>
            <p className="mm-page-head__lead">
              Batch IDs are positive whole numbers.
            </p>
          </div>
        </header>
        <Link to="/app/batches" className="mm-text-link">
          <ArrowLeft size={15} aria-hidden="true" /> Back to batch explorer
        </Link>
      </div>
    );
  }

  const activeData = details.data;
  const crop = activeData ? getCropById(activeData.cropId) : null;
  const txHash = recordedMatch?.txHash ?? null;

  return (
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                background: "#ecfdf5",
                color: "#065f46",
                padding: "0.2rem 0.5rem",
                borderRadius: "9999px",
              }}
            >
              Batch #{validId.toString()}
            </span>
            {details.status === "success" && (
              <StatusBadge variant="success">
                Verified On {web3.selectedNetworkConfig.name}
              </StatusBadge>
            )}
          </div>
          <h1 className="mm-page-head__title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>{crop ? crop.emoji : "🌾"}</span>
            <span>{crop ? crop.name : `Batch #${validId.toString()}`}</span>
            {crop && (
              <span style={{ fontSize: "1.1rem", color: "#6b7280", fontWeight: 400 }}>
                ({crop.hindiName})
              </span>
            )}
          </h1>
          <p className="mm-page-head__lead">
            Tamper-evident crop record stored on {web3.selectedNetworkConfig.name}. All quantities and farmer allocations are cryptographically verified by the smart contract.
          </p>
        </div>
        <Link to="/app/batches" className="mm-outline-link">
          <ArrowLeft size={15} aria-hidden="true" /> Find another batch
        </Link>
      </header>

      {/* Loading State */}
      {details.status === "loading" && <SkeletonCard />}

      {/* Error State */}
      {details.status === "error" && (
        <ErrorBanner
          message={details.error ?? `No batch was found with ID #${validId.toString()} on ${web3.selectedNetworkConfig.name}.`}
          onRetry={details.reload}
        />
      )}

      {/* Successfully Retrieved On-Chain Batch Data */}
      {details.status === "success" && activeData && (
        <>
          {/* Top Metrics Cards */}
          <div className="mm-stat-grid">
            <div className="mm-dashboard-stat-card">
              <span className="mm-dashboard-stat-card__label">Total Batch Weight</span>
              <span className="mm-dashboard-stat-card__value">
                {formatQuantityKg(activeData.totalQuantityKg)}
              </span>
            </div>
            <div className="mm-dashboard-stat-card">
              <span className="mm-dashboard-stat-card__label">Sale Price / MT</span>
              <span className="mm-dashboard-stat-card__value">
                {formatInrPerTonne(activeData.salePriceInrPerTonne)}
              </span>
            </div>
            <div className="mm-dashboard-stat-card">
              <span className="mm-dashboard-stat-card__label">Gross Batch Value</span>
              <span className="mm-dashboard-stat-card__value" style={{ color: "#059669" }}>
                {formatGrossValue(
                  activeData.totalQuantityKg,
                  activeData.salePriceInrPerTonne,
                )}
              </span>
            </div>
            <div className="mm-dashboard-stat-card">
              <span className="mm-dashboard-stat-card__label">Participating Farmers</span>
              <span className="mm-dashboard-stat-card__value">
                {activeData.allocations.length}
              </span>
            </div>
          </div>

          <div className="mm-two-col">
            {/* Metadata Section */}
            <section className="mm-panel" aria-labelledby="batch-meta-title">
              <div className="mm-panel__head">
                <div>
                  <p className="mm-panel__eyebrow">Cryptographic Record</p>
                  <h2 id="batch-meta-title" className="mm-panel__title">
                    On-Chain Metadata
                  </h2>
                </div>
                <ShieldCheck className="mm-panel__icon" />
              </div>

              <dl className="mm-detail-list">
                <div>
                  <dt>Batch ID</dt>
                  <dd>
                    <code>#{activeData.batchId.toString()}</code>
                  </dd>
                </div>
                <div>
                  <dt>Record Status</dt>
                  <dd>
                    <span className="mm-tag mm-tag--green">
                      On-Chain Verified ({web3.selectedNetworkConfig.name})
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Crop Variety</dt>
                  <dd>
                    <span>{crop?.name ?? `Crop #${activeData.cropId.toString()}`}</span>
                  </dd>
                </div>
                <div>
                  <dt>Recorded By Manager</dt>
                  <dd>
                    <code className="mm-address">
                      {truncateAddress(activeData.manager, 8, 6)}
                    </code>
                    <a
                      href={getExplorerAddressUrl(web3.selectedNetwork, activeData.manager)}
                      target="_blank"
                      rel="noreferrer"
                      className="mm-inline-link"
                      style={{ marginLeft: "0.5rem" }}
                    >
                      {web3.selectedNetworkConfig.name} Explorer <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  </dd>
                </div>
                {txHash && (
                  <div>
                    <dt>Transaction Hash</dt>
                    <dd>
                      <a
                        href={getExplorerTxUrl(web3.selectedNetwork, txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="mm-inline-link"
                      >
                        {truncateAddress(txHash, 10, 8)} <ExternalLink size={12} />
                      </a>
                    </dd>
                  </div>
                )}
                <div>
                  <dt>Block Timestamp</dt>
                  <dd>{formatTimestamp(activeData.createdAt)}</dd>
                </div>
                <div>
                  <dt>Smart Contract</dt>
                  <dd>
                    {web3.selectedNetworkConfig.contractAddress ? (
                      <a
                        href={getExplorerAddressUrl(web3.selectedNetwork, web3.selectedNetworkConfig.contractAddress)}
                        target="_blank"
                        rel="noreferrer"
                        className="mm-inline-link"
                      >
                        {truncateAddress(web3.selectedNetworkConfig.contractAddress, 8, 6)} <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span style={{ color: "#b45309", fontSize: "0.85rem" }}>
                        Contract Undeployed on {web3.selectedNetworkConfig.name}
                      </span>
                    )}
                  </dd>
                </div>
                {recordedMatch?.mandiName && (
                  <div>
                    <dt>Market Location</dt>
                    <dd>
                      <span>{recordedMatch.mandiName}</span>
                      <span style={{ fontSize: "0.7rem", color: "#6b7280", marginLeft: "0.5rem" }}>
                        (Supplementary Off-Chain Metadata)
                      </span>
                    </dd>
                  </div>
                )}
              </dl>

              <div
                style={{
                  marginTop: "1.25rem",
                  padding: "0.75rem",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  color: "#166534",
                }}
              >
                🔒 <strong>Append-Only Integrity:</strong> Once recorded by the authorized
                manager, this batch and all farmer quantity allocations cannot be modified,
                re-assigned, or deleted.
              </div>
            </section>

            {/* Farmer Allocations Table */}
            <section className="mm-panel" aria-labelledby="allocations-title">
              <div className="mm-panel__head">
                <div>
                  <p className="mm-panel__eyebrow">Allocation Audit</p>
                  <h2 id="allocations-title" className="mm-panel__title">
                    Farmer Breakdown
                  </h2>
                </div>
                <UserRound aria-hidden="true" className="mm-panel__icon" />
              </div>

              <div className="mm-table-wrap">
                <table className="mm-table">
                  <thead>
                    <tr>
                      <th scope="col">Farmer Wallet</th>
                      <th scope="col">Weight (kg)</th>
                      <th scope="col">Share</th>
                      <th scope="col">Ref Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeData.allocations.map((allocation: { farmer: string; quantityKg: bigint }) => {
                      const sharePercent =
                        activeData.totalQuantityKg > 0n
                          ? (
                              Number(
                                (allocation.quantityKg * 1000n) /
                                  activeData.totalQuantityKg,
                              ) / 10
                            ).toFixed(1)
                          : "0.0";

                      const farmerVal =
                        (allocation.quantityKg *
                          activeData.salePriceInrPerTonne) /
                        1000n;

                      return (
                        <tr key={allocation.farmer}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                              <code title={allocation.farmer}>
                                {truncateAddress(allocation.farmer, 6, 4)}
                              </code>
                              <a
                                href={getExplorerAddressUrl(web3.selectedNetwork, allocation.farmer)}
                                target="_blank"
                                rel="noreferrer"
                                title="View on Explorer"
                              >
                                <ExternalLink size={11} style={{ color: "#059669" }} />
                              </a>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {formatQuantityKg(allocation.quantityKg)}
                          </td>
                          <td style={{ color: "#6b7280" }}>{sharePercent}%</td>
                          <td style={{ color: "#059669", fontWeight: 600 }}>
                            ₹{Number(farmerVal).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
