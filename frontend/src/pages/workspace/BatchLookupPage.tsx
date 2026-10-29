import {
  ArrowRight,
  History,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StatusBadge } from "../../components/ui/StatusBadge";
import {
  getRecordedBatches,
  getSampleBatches,
  type VerifiedBatchRecord,
} from "../../lib/blockchain/mandiMintContract";
import { getCropById } from "../../lib/blockchain/crops";
import { parseWholeNumber } from "../../lib/format";
import { useWeb3Wallet } from "../../providers/Web3WalletContext";

export function BatchLookupPage() {
  const navigate = useNavigate();
  const web3 = useWeb3Wallet();
  const [batchId, setBatchId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recordedBatches, setRecordedBatches] = useState<VerifiedBatchRecord[]>([]);
  const sampleBatches = getSampleBatches();

  useEffect(() => {
    setRecordedBatches(getRecordedBatches(web3.selectedNetwork));
  }, [web3.selectedNetwork]);

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
            hint="Enter a positive integer (e.g. 101, 102, 103)"
            inputMode="numeric"
            placeholder="e.g. 101"
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

      {/* Recorded Batches Grid or Honest Empty State */}
      <section className="mm-panel" style={{ marginTop: "1rem" }}>
        <div className="mm-panel__head">
          <div>
            <p className="mm-panel__eyebrow">On-Chain Records</p>
            <h2 className="mm-panel__title">Recorded Batches on {web3.selectedNetworkConfig.name}</h2>
          </div>
          <StatusBadge variant={recordedBatches.length > 0 ? "success" : "neutral"}>
            {recordedBatches.length > 0 ? `${recordedBatches.length} Batches On-Chain` : "No Records"}
          </StatusBadge>
        </div>

        {recordedBatches.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem 1.5rem",
              background: "#f9fafb",
              borderRadius: "8px",
              border: "1px dashed #d1d5db",
              marginTop: "0.75rem",
            }}
          >
            <p style={{ fontSize: "1.75rem", margin: "0 0 0.5rem 0" }}>🔍</p>
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#374151", fontSize: "1.05rem" }}>
              No Batches Recorded on {web3.selectedNetworkConfig.name} Yet
            </h3>
            <p style={{ margin: "0 auto 1.25rem auto", maxWidth: "480px", color: "#6b7280", fontSize: "0.85rem" }}>
              Enter a batch ID in the search box above to query the MandiMint smart contract directly, or record an on-chain batch using the FPO Manager workspace.
            </p>
            {web3.isContractConfigured && (
              <Link to="/app/manager/record" className="mm-btn mm-btn--primary">
                Record a Batch on {web3.selectedNetworkConfig.name} →
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="mm-panel__text">
              The following batches were recorded on-chain and can be verified through the smart contract:
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

      {/* Illustrative Sample Records Section (Clearly Labelled - Not On-Chain) */}
      <section className="mm-panel" style={{ marginTop: "1rem" }}>
        <div className="mm-panel__head">
          <div>
            <p className="mm-panel__eyebrow">Prototype Demonstration Model</p>
            <h2 className="mm-panel__title">Illustrative Sample Records — Not On-Chain</h2>
          </div>
          <StatusBadge variant="neutral">Offline Sample Data</StatusBadge>
        </div>

        <p className="mm-panel__text" style={{ fontSize: "0.85rem", color: "#52645b" }}>
          The following 3 sample batches illustrate how crop records and multi-farmer distributions look in MandiMint.
          These are demonstration examples and have not been recorded on the {web3.selectedNetworkConfig.name} blockchain:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1rem",
            marginTop: "1.25rem",
          }}
        >
          {sampleBatches.map((batch) => {
            const crop = getCropById(batch.cropId);
            const grossVal = (batch.totalQuantityKg * batch.salePriceInrPerTonne) / 1000;

            return (
              <div
                key={batch.batchId}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: "#f1f5f9",
                        color: "#475569",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "9999px",
                      }}
                    >
                      Sample #{batch.batchId}
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

                  <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#64748b" }}>
                    Gross Value: <strong>₹{grossVal.toLocaleString()}</strong> · {batch.farmers.length} Farmers
                  </div>
                  <div style={{ marginTop: "0.35rem" }}>
                    <span style={{ fontSize: "0.7rem", color: "#64748b", background: "#f1f5f9", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                      Illustrative Sample (Offline)
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9" }}>
                  <Link
                    to={`/app/batches/${batch.batchId}`}
                    className="mm-btn mm-btn--outline"
                    style={{ width: "100%", justifyContent: "center", fontSize: "0.8rem", padding: "0.4rem 0.75rem" }}
                  >
                    Inspect Sample Details →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
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
