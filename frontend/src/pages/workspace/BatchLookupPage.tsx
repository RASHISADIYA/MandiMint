import {
  ArrowRight,
  ExternalLink,
  History,
  RefreshCw,
  Search,
} from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { Input } from "../../components/ui/Input";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { getCropById } from "../../lib/blockchain/crops";
import { getExplorerTxUrl } from "../../config/networks";
import { parseWholeNumber } from "../../lib/format";
import { useOnChainBatches } from "../../hooks/useMandiMintReads";
import { useWeb3Wallet } from "../../providers/Web3WalletContext";

export function BatchLookupPage() {
  const navigate = useNavigate();
  const web3 = useWeb3Wallet();
  const [batchId, setBatchId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const batchesQuery = useOnChainBatches(web3.selectedNetwork);
  const recordedBatches = batchesQuery.data ?? [];

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const parsed = parseWholeNumber(batchId);
      if (parsed === null || parsed <= 0n) {
        setError("Enter a batch ID greater than zero.");
        return;
      }

      setError(null);
      navigate(`/app/batches/${parsed.toString()}`);
    },
    [batchId, navigate],
  );

  return (
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <p className="mm-page-head__eyebrow">
            <Search size={14} aria-hidden="true" />
            Public Blockchain Explorer
          </p>
          <h1 className="mm-page-head__title">
            Crop Batch Explorer
          </h1>
          <p className="mm-page-head__lead">
            Every recorded crop sale batch on {web3.selectedNetworkConfig.name} is immutable and auditable.
            Look up any batch ID to inspect the crop parameters and farmer allocation breakdown.
          </p>
        </div>
      </header>

      {/* Lookup Form */}
      <section className="mm-panel">
        <div className="mm-panel__head">
          <div>
            <p className="mm-panel__eyebrow">Search on MST Blockchain</p>
            <h2 className="mm-panel__title">Query Batch ID</h2>
          </div>
          <Search aria-hidden="true" className="mm-panel__icon" />
        </div>
        <p className="mm-panel__text">
          Enter the unique numerical identifier assigned to a recorded crop batch.
        </p>
        <form onSubmit={handleSubmit} className="mm-inline-form">
          <Input
            label="Batch ID"
            hint="Enter a positive integer (e.g. 1, 2, 3)"
            inputMode="numeric"
            placeholder="e.g. 1"
            value={batchId}
            onChange={(event) => {
              setBatchId(event.target.value);
              setError(null);
            }}
            error={error ?? undefined}
            required
          />
          <div className="mm-button-row">
            <Button
              type="submit"
              leadingIcon={<Search size={16} aria-hidden="true" />}
            >
              Search Batch
            </Button>
          </div>
        </form>
      </section>

      {/* On-Chain Batches Grid / Loading / Error / Empty States */}
      <section className="mm-panel" style={{ marginTop: "1rem" }}>
        <div className="mm-panel__head">
          <div>
            <p className="mm-panel__eyebrow">On-Chain Records</p>
            <h2 className="mm-panel__title">Recorded Batches on {web3.selectedNetworkConfig.name}</h2>
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
                : "0 Batches"}
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

        {/* Empty State: Only when query succeeds with 0 batches */}
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
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#374151", fontSize: "1.05rem", fontWeight: 700 }}>
              No batches recorded yet
            </h3>
            <p style={{ margin: "0 auto 1.25rem auto", maxWidth: "480px", color: "#6b7280", fontSize: "0.875rem" }}>
              Create the first verified agricultural batch on {web3.selectedNetworkConfig.name}.
            </p>
            {web3.isContractConfigured && (
              <Link to="/app/manager/record" className="mm-btn mm-btn--primary">
                Record First Batch on {web3.selectedNetworkConfig.name} →
              </Link>
            )}
          </div>
        )}

        {/* Populated State */}
        {batchesQuery.status === "success" && recordedBatches.length > 0 && (
          <>
            <p className="mm-panel__text">
              The following batches were retrieved directly from the MandiMint smart contract:
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1rem",
                marginTop: "1.25rem",
              }}
            >
              {recordedBatches.map((batch) => {
                const crop = getCropById(batch.cropId);
                const grossVal = (batch.totalQuantityKg * batch.salePriceInrPerTonne) / 1000;

                return (
                  <div
                    key={batch.batchId}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      padding: "1.25rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
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
                          Batch #{batch.batchId}
                        </span>
                        <span style={{ fontSize: "1.25rem" }}>{crop.emoji}</span>
                      </div>

                      <h3 style={{ margin: "0 0 0.35rem 0", fontSize: "1.05rem", fontWeight: 700, color: "#111827" }}>
                        {batch.cropName}
                      </h3>

                      <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.8rem", color: "#6b7280" }}>
                        📍 {batch.mandiName}
                      </p>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8rem", background: "#f8fafc", padding: "0.6rem", borderRadius: "6px" }}>
                        <div>
                          <span style={{ color: "#64748b", display: "block" }}>Weight</span>
                          <strong style={{ color: "#0f172a" }}>{batch.totalQuantityKg.toLocaleString()} kg</strong>
                        </div>
                        <div>
                          <span style={{ color: "#64748b", display: "block" }}>Price / MT</span>
                          <strong style={{ color: "#0f172a" }}>₹{batch.salePriceInrPerTonne.toLocaleString()}</strong>
                        </div>
                      </div>

                      <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#6b7280" }}>
                        Gross Value: <strong style={{ color: "#059669" }}>₹{grossVal.toLocaleString()}</strong> · {batch.farmers.length} Farmers
                      </div>

                      {batch.txHash && (
                        <div style={{ marginTop: "0.35rem", fontSize: "0.725rem" }}>
                          <a
                            href={getExplorerTxUrl(web3.selectedNetwork, batch.txHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--color-agricultural-green)", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                          >
                            View on MSTScan <ExternalLink size={11} />
                          </a>
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9" }}>
                      <Link
                        to={`/app/batches/${batch.batchId}`}
                        className="mm-btn mm-btn--outline"
                        style={{ width: "100%", justifyContent: "center", fontSize: "0.8rem", padding: "0.4rem 0.75rem" }}
                      >
                        Inspect Batch Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Farmer History Promo */}
      <section className="mm-panel" style={{ marginTop: "1rem" }}>
        <div className="mm-panel__head">
          <div>
            <p className="mm-panel__eyebrow">Farmer Allocation Portfolio</p>
            <h2 className="mm-panel__title">Looking for Farmer Deliveries?</h2>
          </div>
          <History aria-hidden="true" className="mm-panel__icon" />
        </div>
        <p className="mm-panel__text">
          Enter any farmer&apos;s public blockchain wallet address to retrieve all associated
          sale batches, allocated kilograms, and verifiable proof on MST Blockchain.
        </p>
        <Link to="/app/farmer/history" className="mm-text-link">
          Open Farmer History Portal <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
