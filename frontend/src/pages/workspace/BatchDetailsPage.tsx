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
import {
  getRecordedBatches,
  getSampleBatches,
} from "../../lib/blockchain/mandiMintContract";
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

  // Check if this batch exists in locally recorded on-chain transactions for this network
  const recordedMatch = useMemo(() => {
    if (!validId) return null;
    const numId = Number(validId);
    const recorded = getRecordedBatches(web3.selectedNetwork);
    return recorded.find((b) => b.batchId === numId) ?? null;
  }, [validId, web3.selectedNetwork]);

  // Check if this batch is an illustrative sample batch
  const sampleMatch = useMemo(() => {
    if (!validId) return null;
    const numId = Number(validId);
    const samples = getSampleBatches();
    return samples.find((b) => b.batchId === numId) ?? null;
  }, [validId]);

  // Determine active data and whether it is a sample or genuinely on-chain
  const isOnChain = details.status === "success" && details.data !== null;
  const isSampleData = !isOnChain && Boolean(sampleMatch);

  const activeData = useMemo(() => {
    if (isOnChain && details.data) {
      return {
        ...details.data,
        txHash: recordedMatch?.txHash ?? null,
        isSample: false,
      };
    }
    if (sampleMatch) {
      return {
        batchId: BigInt(sampleMatch.batchId),
        cropId: BigInt(sampleMatch.cropId),
        totalQuantityKg: BigInt(sampleMatch.totalQuantityKg),
        salePriceInrPerTonne: BigInt(sampleMatch.salePriceInrPerTonne),
        manager: sampleMatch.manager,
        createdAt: BigInt(sampleMatch.createdAt),
        txHash: null,
        isSample: true,
        allocations: sampleMatch.farmers.map((f) => ({
          farmer: f.address,
          quantityKg: BigInt(f.quantityKg),
        })),
      };
    }
    return null;
  }, [isOnChain, details.data, recordedMatch, sampleMatch]);

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

  const crop = activeData ? getCropById(activeData.cropId) : null;

  return (
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                background: isSampleData ? "#f1f5f9" : "#ecfdf5",
                color: isSampleData ? "#475569" : "#065f46",
                padding: "0.2rem 0.5rem",
                borderRadius: "9999px",
              }}
            >
              {isSampleData ? `Sample #${validId.toString()}` : `Batch #${validId.toString()}`}
            </span>
            <StatusBadge variant={isSampleData ? "neutral" : "success"}>
              {isSampleData ? "Illustrative Sample (Offline)" : `Verified On ${web3.selectedNetworkConfig.name}`}
            </StatusBadge>
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
            {isSampleData
              ? `Illustrative sample record demonstrating commodity data structures and whole-kg conservation. This batch is not committed to the ${web3.selectedNetworkConfig.name} blockchain.`
              : `Tamper-evident crop record stored on ${web3.selectedNetworkConfig.name}. All quantities and farmer allocations are cryptographically verified.`}
          </p>
        </div>
        <Link to="/app/batches" className="mm-outline-link">
          <ArrowLeft size={15} aria-hidden="true" /> Find another batch
        </Link>
      </header>

      {/* Illustrative Sample Notice */}
      {isSampleData && (
        <div
          style={{
            margin: "0 0 1.5rem 0",
            padding: "1rem 1.25rem",
            background: "#fffbeb",
            border: "1px solid #fef3c7",
            borderRadius: "8px",
            fontSize: "0.85rem",
            color: "#92400e",
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>ℹ️</span>
          <div>
            <strong>Illustrative Sample Record:</strong> Batch #{validId.toString()} is demonstration sample data used to illustrate crop attributes and farmer distribution calculations. It has not been signed or broadcast to the {web3.selectedNetworkConfig.name} blockchain. No on-chain transaction hash, block confirmation, or explorer verification exists for this record.
          </div>
        </div>
      )}

      {details.status === "loading" && !activeData && <SkeletonCard />}

      {details.status === "error" && !activeData && (
        <ErrorBanner
          message={details.error ?? `No batch was found with ID #${validId.toString()} on ${web3.selectedNetworkConfig.name}.`}
          onRetry={details.reload}
        />
      )}

      {activeData && (
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
                  <p className="mm-panel__eyebrow">
                    {isSampleData ? "Data Specifications" : "Cryptographic Record"}
                  </p>
                  <h2 id="batch-meta-title" className="mm-panel__title">
                    {isSampleData ? "Sample Metadata" : "On-Chain Metadata"}
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
                    {isSampleData ? (
                      <span className="mm-tag mm-tag--neutral">Illustrative Sample (Offline)</span>
                    ) : (
                      <span className="mm-tag mm-tag--green">On-Chain Verified ({web3.selectedNetworkConfig.name})</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Crop Category</dt>
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
                    {!isSampleData && (
                      <a
                        href={getExplorerAddressUrl(web3.selectedNetwork, activeData.manager)}
                        target="_blank"
                        rel="noreferrer"
                        className="mm-inline-link"
                        style={{ marginLeft: "0.5rem" }}
                      >
                        {web3.selectedNetworkConfig.name} Explorer <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    )}
                  </dd>
                </div>
                {activeData.txHash && (
                  <div>
                    <dt>Transaction Hash</dt>
                    <dd>
                      <a
                        href={getExplorerTxUrl(web3.selectedNetwork, activeData.txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="mm-inline-link"
                      >
                        {truncateAddress(activeData.txHash, 10, 8)} <ExternalLink size={12} />
                      </a>
                    </dd>
                  </div>
                )}
                <div>
                  <dt>Block Timestamp</dt>
                  <dd>{formatTimestamp(activeData.createdAt)}</dd>
                </div>
                <div>
                  <dt>Contract Verification</dt>
                  <dd>
                    {isSampleData ? (
                      <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                        None (Offline Prototype Model)
                      </span>
                    ) : web3.selectedNetworkConfig.contractAddress ? (
                      <a
                        href={getExplorerAddressUrl(web3.selectedNetwork, web3.selectedNetworkConfig.contractAddress)}
                        target="_blank"
                        rel="noreferrer"
                        className="mm-inline-link"
                      >
                        MandiMint Contract on {web3.selectedNetworkConfig.name} <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span style={{ color: "#b45309", fontSize: "0.85rem" }}>
                        Contract Undeployed on {web3.selectedNetworkConfig.name}
                      </span>
                    )}
                  </dd>
                </div>
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
                              {isSampleData ? (
                                <span className="mm-tag mm-tag--neutral" style={{ fontSize: "0.65rem", padding: "1px 4px" }}>
                                  Sample Farmer
                                </span>
                              ) : (
                                <a
                                  href={getExplorerAddressUrl(web3.selectedNetwork, allocation.farmer)}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="View on Explorer"
                                >
                                  <ExternalLink size={11} style={{ color: "#059669" }} />
                                </a>
                              )}
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
