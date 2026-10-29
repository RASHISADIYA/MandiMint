import {
  History,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { Input } from "../../components/ui/Input";
import { SkeletonCard } from "../../components/ui/LoadingSkeleton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useFarmerHistory } from "../../hooks/useMandiMintReads";
import { useWalletOnboarding } from "../../hooks/useWalletOnboarding";
import { useWeb3Wallet } from "../../providers/Web3WalletContext";
import {
  getRecordedBatches,
  getSampleBatches,
} from "../../lib/blockchain/mandiMintContract";
import {
  formatQuantityKg,
  parseAddress,
  truncateAddress,
} from "../../lib/format";

export function FarmerHistoryPage() {
  const { walletAddress } = useWalletOnboarding();
  const web3 = useWeb3Wallet();

  const activeAddress = web3.connected ? web3.address : walletAddress;

  const [addressInput, setAddressInput] = useState("");
  const [queriedAddress, setQueriedAddress] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const history = useFarmerHistory(queriedAddress, web3.selectedNetwork);

  useEffect(() => {
    if (activeAddress && queriedAddress === null && addressInput === "") {
      setAddressInput(activeAddress);
      setQueriedAddress(activeAddress);
    }
  }, [activeAddress, queriedAddress, addressInput]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const parsed = parseAddress(addressInput);
      if (!parsed) {
        setInputError("Enter a valid 40-hex EVM wallet address.");
        return;
      }

      setInputError(null);
      setQueriedAddress(parsed);
    },
    [addressInput],
  );

  const useMyWallet = useCallback(() => {
    if (!activeAddress) return;
    setAddressInput(activeAddress);
    setInputError(null);
    setQueriedAddress(activeAddress);
  }, [activeAddress]);

  const recordedBatches = useMemo(
    () => getRecordedBatches(web3.selectedNetwork),
    [web3.selectedNetwork],
  );
  const sampleBatches = useMemo(() => getSampleBatches(), []);

  // Illustrative samples matching this address (offline demonstration only)
  const sampleMatches = useMemo(() => {
    if (!queriedAddress) return [];
    const lower = queriedAddress.toLowerCase();
    return sampleBatches
      .filter((b) =>
        b.farmers.some((f) => f.address.toLowerCase() === lower),
      )
      .map((b) => {
        const match = b.farmers.find(
          (f) => f.address.toLowerCase() === lower,
        );
        return {
          batchId: b.batchId,
          cropName: b.cropName,
          mandiName: b.mandiName,
          quantityKg: match?.quantityKg ?? 0,
        };
      });
  }, [queriedAddress, sampleBatches]);

  // Live on-chain allocations from MandiMint smart contract
  const onChainRows = useMemo(() => {
    if (!history.data || history.data.length === 0) return [];
    return history.data.map((r) => {
      const match = recordedBatches.find(
        (b) => BigInt(b.batchId) === r.batchId,
      );
      return {
        batchId: r.batchId,
        quantityKg: r.quantityKg,
        cropName: match ? match.cropName : `Batch #${r.batchId.toString()}`,
        mandiName: match ? match.mandiName : "On-Chain Mandi",
      };
    });
  }, [history.data, recordedBatches]);

  const totalKg = useMemo(() => {
    return onChainRows.reduce((sum, r) => sum + r.quantityKg, 0n);
  }, [onChainRows]);

  return (
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <p className="mm-page-head__eyebrow">
            <History size={14} aria-hidden="true" />
            Farmer Produce History
          </p>
          <h1 className="mm-page-head__title">
            Farmer Delivery Portfolio
          </h1>
          <p className="mm-page-head__lead">
            Query any farmer wallet address to retrieve all associated crop sale batches,
            allocated kilograms, and cryptographic verification on {web3.selectedNetworkConfig.name}.
          </p>
        </div>
      </header>

      {/* Address Query Panel */}
      <section className="mm-panel">
        <div className="mm-panel__head">
          <div>
            <p className="mm-panel__eyebrow">Query On-Chain Records ({web3.selectedNetworkConfig.name})</p>
            <h2 className="mm-panel__title">Farmer Wallet Lookup</h2>
          </div>
          <Search aria-hidden="true" className="mm-panel__icon" />
        </div>

        <form onSubmit={handleSubmit} className="mm-inline-form">
          <div style={{ flex: 1 }}>
            <Input
              label="Farmer EVM Wallet Address"
              hint="40-hex EVM address"
              placeholder="0x..."
              value={addressInput}
              onChange={(event) => {
                setAddressInput(event.target.value);
                setInputError(null);
              }}
              error={inputError ?? undefined}
              required
            />
          </div>
          <div className="mm-button-row">
            <Button
              type="submit"
              leadingIcon={<Search size={16} aria-hidden="true" />}
            >
              Lookup Allocations
            </Button>
            {activeAddress && (
              <Button type="button" variant="outline" onClick={useMyWallet}>
                Use Connected Wallet
              </Button>
            )}
          </div>
        </form>
      </section>

      {/* Results Section */}
      {queriedAddress && (
        <section className="mm-panel" style={{ marginTop: "1rem" }}>
          <div className="mm-panel__head">
            <div>
              <p className="mm-panel__eyebrow">
                Auditable Ledger for <code>{truncateAddress(queriedAddress, 8, 6)}</code>
              </p>
              <h2 className="mm-panel__title">On-Chain Delivery History</h2>
            </div>
            {onChainRows.length > 0 && (
              <StatusBadge variant="success">
                Verified On {web3.selectedNetworkConfig.name}
              </StatusBadge>
            )}
          </div>

          {history.status === "loading" && <SkeletonCard />}

          {history.status === "error" && (
            <ErrorBanner
              message={
                history.error ??
                `Failed to query farmer delivery history on ${web3.selectedNetworkConfig.name}.`
              }
            />
          )}

          {history.status === "success" && (
            <>
              <div className="mm-stat-grid" style={{ marginBottom: "1.25rem" }}>
                <div className="mm-dashboard-stat-card">
                  <span className="mm-dashboard-stat-card__label">Verified On-Chain Batches</span>
                  <span className="mm-dashboard-stat-card__value">
                    {onChainRows.length}
                  </span>
                </div>
                <div className="mm-dashboard-stat-card">
                  <span className="mm-dashboard-stat-card__label">Total Produce Delivered</span>
                  <span className="mm-dashboard-stat-card__value" style={{ color: "#059669" }}>
                    {formatQuantityKg(totalKg)}
                  </span>
                </div>
              </div>

              {onChainRows.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="No On-Chain Allocations Found"
                  description={`No verified crop delivery records were found for ${truncateAddress(queriedAddress, 6, 4)} on ${web3.selectedNetworkConfig.name}. Delivery records are registered by authorized FPO Managers when batch deliveries are recorded.`}
                />
              ) : (
                <div className="mm-table-wrap">
                  <table className="mm-table">
                    <thead>
                      <tr>
                        <th>Batch ID</th>
                        <th>Produce Crop</th>
                        <th>Mandi Market</th>
                        <th>Allocated Quantity</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {onChainRows.map((row) => (
                        <tr key={row.batchId.toString()}>
                          <td style={{ fontWeight: 700, color: "#174c3c" }}>
                            #{row.batchId.toString()}
                          </td>
                          <td style={{ fontWeight: 600 }}>{row.cropName}</td>
                          <td style={{ color: "#6b7280" }}>{row.mandiName}</td>
                          <td style={{ fontWeight: 600, color: "#059669" }}>
                            {formatQuantityKg(row.quantityKg)}
                          </td>
                          <td>
                            <Link
                              to={`/app/batches/${row.batchId.toString()}`}
                              className="mm-btn mm-btn--outline"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                            >
                              View Batch Proof →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {sampleMatches.length > 0 && (
            <div
              style={{
                marginTop: "1.5rem",
                padding: "1rem",
                background: "#f9fafb",
                border: "1px dashed #d1d5db",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#4b5563",
                  }}
                >
                  Illustrative Sample Data Reference (Offline Demonstration)
                </span>
                <span className="mm-tag mm-tag--neutral">Sample Only</span>
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#6b7280",
                  margin: "0 0 0.75rem 0",
                }}
              >
                This address matches an offline mock record in the MandiMint demonstration suite.
                Sample records are not on-chain transactions and do not exist on {web3.selectedNetworkConfig.name}.
              </p>
              <div style={{ fontSize: "0.8rem", color: "#374151" }}>
                {sampleMatches.map((sm) => (
                  <div
                    key={sm.batchId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.25rem 0",
                      borderTop: "1px solid #f3f4f6",
                    }}
                  >
                    <span>
                      Sample #{sm.batchId} — {sm.cropName} ({sm.mandiName})
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      {formatQuantityKg(BigInt(sm.quantityKg))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
