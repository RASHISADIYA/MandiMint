import {
  CheckCircle2,
  ClipboardPlus,
  ExternalLink,
  Flame,
  Plus,
  Send,
  Trash2,
  Wallet,
} from "lucide-react";
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { Input } from "../../components/ui/Input";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useManagerStatus } from "../../hooks/useMandiMintReads";
import { useAuthoritativeRole } from "../../hooks/useAuthoritativeRole";
import { useWalletOnboarding } from "../../hooks/useWalletOnboarding";
import { useWeb3Wallet } from "../../providers/Web3WalletContext";
import { CROPS_CATALOG, getCropById } from "../../lib/blockchain/crops";
import { getExplorerTxUrl } from "../../config/networks";
import {
  formatContractError,
  estimateRecordBatchGas,
  readBatchDetails,
  submitRecordBatch,
} from "../../lib/blockchain/mandiMintContract";
import {
  formatGrossValue,
  formatQuantityKg,
  parseWholeNumber,
  truncateAddress,
} from "../../lib/format";
import {
  validateRecordBatch,
  type AllocationDraft,
  type RecordBatchDraft,
  type RecordBatchErrors,
} from "../../lib/validation";

type TransactionState =
  | { status: "idle" }
  | { status: "signing" }
  | { status: "pending"; hash: string; batchId: bigint }
  | {
      status: "confirmed";
      hash: string;
      batchId: bigint;
      blockNumber: number;
      readbackVerified: boolean;
      readbackTotalKg?: bigint;
      readbackFarmersCount?: number;
    }
  | {
      status: "failed";
      hash: string | null;
      batchId: bigint | null;
      message: string;
    };

function createAllocation(): AllocationDraft {
  return {
    id: crypto.randomUUID(),
    address: "",
    quantityKg: "",
  };
}

function createDraft(): RecordBatchDraft {
  return {
    batchId: "",
    cropId: "1",
    totalQuantityKg: "",
    salePriceInrPerTonne: "28500",
    allocations: [
      { id: crypto.randomUUID(), address: "", quantityKg: "" },
    ],
  };
}

function PageHeader() {
  return (
    <header className="mm-page-head">
      <div>
        <p className="mm-page-head__eyebrow">
          <ClipboardPlus size={14} aria-hidden="true" />
          FPO Manager On-Chain Action
        </p>
        <h1 className="mm-page-head__title">Record a crop sale batch</h1>
        <p className="mm-page-head__lead">
          Record crop batches and farmer quantity allocations on MST Blockchain Testnet.
          The smart contract guarantees immutable auditability and validates whole-kg sum equality.
        </p>
      </div>
    </header>
  );
}

export function RecordBatchPage() {
  const { role } = useAuthoritativeRole(true);
  const { walletAddress, embeddedWallet } = useWalletOnboarding();
  const web3 = useWeb3Wallet();

  const activeAddress = web3.connected ? web3.address : walletAddress;
  const activeSigner = web3.connected ? web3.signer : embeddedWallet;

  const manager = useManagerStatus(
    role === "fpo_admin" ? walletAddress : null,
  );

  const isAuthorizedManager = web3.connected
    ? web3.isManager || web3.isOwner
    : manager.data === true;

  const [draft, setDraft] = useState<RecordBatchDraft>(createDraft);
  const [errors, setErrors] = useState<RecordBatchErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<TransactionState>({
    status: "idle",
  });
  const [preflightStatus, setPreflightStatus] = useState<"idle" | "checking">("idle");

  const summary = useMemo(() => {
    const total = parseWholeNumber(draft.totalQuantityKg);
    const price = parseWholeNumber(draft.salePriceInrPerTonne);
    const allocationTotal = draft.allocations.reduce((sum, allocation) => {
      const quantity = parseWholeNumber(allocation.quantityKg);
      return sum + (quantity ?? 0n);
    }, 0n);

    const difference = total !== null ? allocationTotal - total : null;
    const grossValue =
      total !== null && total > 0n && price !== null && price > 0n
        ? formatGrossValue(total, price)
        : null;

    return { total, price, allocationTotal, difference, grossValue };
  }, [draft.totalQuantityKg, draft.salePriceInrPerTonne, draft.allocations]);

  const busy =
    transaction.status === "signing" ||
    transaction.status === "pending" ||
    preflightStatus === "checking";

  const updateField = useCallback(
    (field: keyof Omit<RecordBatchDraft, "allocations">, value: string) => {
      setDraft((current) => ({ ...current, [field]: value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setFormError(null);
    },
    [],
  );

  const handleCropSelect = useCallback((cropId: string, defaultPrice: string) => {
    setDraft((curr) => ({
      ...curr,
      cropId,
      salePriceInrPerTonne: defaultPrice,
    }));
    setErrors((curr) => ({ ...curr, cropId: undefined, salePriceInrPerTonne: undefined }));
  }, []);

  const updateAllocation = useCallback(
    (id: string, field: "address" | "quantityKg", value: string) => {
      setDraft((current) => ({
        ...current,
        allocations: current.allocations.map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ),
      }));
      setErrors((current) => ({
        ...current,
        allocations: current.allocations
          ? {
              ...current.allocations,
              [id]: {
                ...current.allocations[id],
                [field]: undefined,
              },
            }
          : undefined,
      }));
      setFormError(null);
    },
    [],
  );

  const addAllocation = useCallback(() => {
    setDraft((current) => ({
      ...current,
      allocations: [...current.allocations, createAllocation()],
    }));
  }, []);

  const removeAllocation = useCallback((id: string) => {
    setDraft((current) => {
      if (current.allocations.length <= 1) return current;
      return {
        ...current,
        allocations: current.allocations.filter((item) => item.id !== id),
      };
    });
  }, []);

  const resetForm = useCallback(() => {
    setDraft(createDraft());
    setErrors({});
    setFormError(null);
    setTransaction({ status: "idle" });
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFormError(null);

      const result = validateRecordBatch(draft);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }

      if (!activeSigner) {
        setFormError("Connect your wallet before recording a batch.");
        return;
      }

      if (!web3.isContractConfigured) {
        setFormError(
          `MandiMint smart contract is not deployed on ${web3.selectedNetworkConfig.name}. Switch to MST Testnet to record batches on the verified contract.`,
        );
        return;
      }

      if (web3.isNetworkMismatch) {
        setFormError(
          `Connected wallet is on chain #${web3.chainId}, but MandiMint workspace is set to ${web3.selectedNetworkConfig.name} (#${web3.selectedNetworkConfig.chainId}). Switch your wallet network to proceed.`,
        );
        return;
      }

      // Check gas preflight
      if (preflightStatus === "idle") {
        setPreflightStatus("checking");
        try {
          const preflightResult = await estimateRecordBatchGas(
            activeSigner,
            result.value,
            web3.selectedNetwork,
          );

          if (preflightResult.status === "insufficient") {
            setFormError(
              `Insufficient ${web3.selectedNetworkConfig.currency.symbol} balance for gas on ${web3.selectedNetworkConfig.name}. Please fund your wallet and try again.`,
            );
            setPreflightStatus("idle");
            return;
          }
        } catch {
          // Continue if preflight network call fails
        }
        setPreflightStatus("idle");
      }

      setErrors({});
      setTransaction({ status: "signing" });

      try {
        const response = await submitRecordBatch(
          activeSigner,
          result.value,
          web3.selectedNetwork,
        );
        setTransaction({
          status: "pending",
          hash: response.hash,
          batchId: result.value.batchId,
        });

        const receipt = await response.wait();
        const blockNumber = receipt?.blockNumber ?? 0;

        // Perform live smart contract readback verification to confirm the recorded data
        let readbackVerified = false;
        let readbackTotalKg: bigint | undefined;
        let readbackFarmersCount: number | undefined;

        try {
          const onChainBatch = await readBatchDetails(
            result.value.batchId,
            web3.selectedNetwork,
          );
          if (onChainBatch && onChainBatch.batchId === result.value.batchId) {
            readbackVerified = true;
            readbackTotalKg = onChainBatch.totalQuantityKg;
            readbackFarmersCount = onChainBatch.allocations.length;
          }
        } catch {
          // Readback may encounter transient node propagation delay immediately after mining
          readbackVerified = false;
        }

        setTransaction({
          status: "confirmed",
          hash: response.hash,
          batchId: result.value.batchId,
          blockNumber,
          readbackVerified,
          readbackTotalKg,
          readbackFarmersCount,
        });

        // Store custom batch in network-isolated storage for explorer visibility
        try {
          const storageKey = `mandimint_custom_batches_${web3.selectedNetwork}`;
          const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
          stored.unshift({
            batchId: Number(result.value.batchId),
            cropId: Number(result.value.cropId),
            cropName: getCropById(result.value.cropId).name,
            mandiName: "MST Verified Mandi",
            totalQuantityKg: Number(result.value.totalQuantityKg),
            salePriceInrPerTonne: Number(result.value.salePriceInrPerTonne),
            txHash: response.hash,
            manager: activeAddress,
            status: "confirmed",
            createdAt: Math.floor(Date.now() / 1000),
            networkId: web3.selectedNetwork,
            farmers: result.value.farmers.map((addr, idx) => ({
              address: addr,
              quantityKg: Number(result.value.quantitiesKg[idx]),
            })),
          });
          localStorage.setItem(storageKey, JSON.stringify(stored));
        } catch {
          // Ignore local storage sync failures
        }
      } catch (error) {
        setTransaction({
          status: "failed",
          hash: null,
          batchId: result.value.batchId,
          message: formatContractError(error),
        });
      }
    },
    [draft, activeSigner, activeAddress, preflightStatus, web3],
  );

  const selectedCrop = getCropById(draft.cropId || 1n);

  return (
    <div className="mm-page">
      <PageHeader />

      {/* Wallet Connection Status */}
      {!activeAddress ? (
        <section className="mm-panel" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🌾</div>
          <h2 className="mm-panel__title" style={{ marginBottom: "0.5rem" }}>
            Connect Wallet to Record Batches
          </h2>
          <p className="mm-panel__text" style={{ maxWidth: "480px", margin: "0 auto 1.5rem auto" }}>
            Recording a crop batch requires an authorized manager wallet on MST Blockchain.
            Connect your wallet to sign transactions.
          </p>
          <Button
            type="button"
            variant="primary"
            onClick={web3.connectBridgeKey}
            leadingIcon={<Wallet size={16} />}
          >
            Sign In / Connect Wallet
          </Button>
        </section>
      ) : !web3.isContractConfigured ? (
        <section className="mm-panel" style={{ borderLeft: "4px solid #f59e0b", padding: "1.5rem" }}>
          <div className="mm-panel__head">
            <div>
              <StatusBadge variant="warning">Contract Undeployed on {web3.selectedNetworkConfig.name}</StatusBadge>
              <h2 className="mm-panel__title" style={{ marginTop: "0.5rem" }}>
                {web3.selectedNetworkConfig.name} Write Actions Disabled
              </h2>
            </div>
          </div>
          <p className="mm-panel__text">
            The MandiMint smart contract is not yet deployed on {web3.selectedNetworkConfig.name} (Chain #{web3.selectedNetworkConfig.chainId}).
            To test live batch recording, validation, and immutable allocations, switch to <strong>MST Testnet</strong> where our verified contract is live.
          </p>
          <div style={{ marginTop: "1rem" }}>
            <Button
              type="button"
              variant="primary"
              onClick={web3.switchToMstTestnet}
            >
              Switch to MST Testnet (91562037) →
            </Button>
          </div>
        </section>
      ) : !isAuthorizedManager ? (
        <section className="mm-panel" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div className="mm-panel__head">
            <div>
              <StatusBadge variant="warning">Wallet Not Authorized As Manager</StatusBadge>
              <h2 className="mm-panel__title" style={{ marginTop: "0.5rem" }}>
                Connected Wallet: <code>{truncateAddress(activeAddress, 8, 6)}</code>
              </h2>
            </div>
          </div>
          <p className="mm-panel__text">
            This wallet is connected to {web3.selectedNetworkConfig.name}, but is not yet recorded as an authorized manager on the {web3.selectedNetworkConfig.name} MandiMint smart contract.
            Only authorized managers can invoke <code>recordBatch</code>.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
            <Link to="/app/manager/authorize" className="mm-btn mm-btn--primary">
              Open Manager Authorization Page →
            </Link>
            {web3.isTestnet && web3.selectedNetworkConfig.faucetUrl && (
              <a
                href={web3.selectedNetworkConfig.faucetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mm-btn mm-btn--outline"
              >
                <Flame size={14} /> Get Testnet tMSTC
              </a>
            )}
          </div>
        </section>
      ) : null}

      {/* Success Receipt Modal / Card */}
      {transaction.status === "confirmed" && (
        <section
          className="mm-panel"
          style={{
            background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
            border: "2px solid #86efac",
            padding: "clamp(1rem, 4vw, 2rem)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <CheckCircle2 size={32} style={{ color: "#16a34a" }} />
            <div>
              <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#14532d", fontWeight: 700 }}>
                Batch #{transaction.batchId.toString()} Recorded On-Chain!
              </h2>
              <p style={{ margin: "0.25rem 0 0 0", color: "#166534", fontSize: "0.9rem" }}>
                Transaction confirmed in {web3.selectedNetworkConfig.name} Block #{transaction.blockNumber}.
              </p>
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: "1rem 1.25rem",
              borderRadius: "8px",
              border: "1px solid #bbf7d0",
              marginBottom: "1rem",
              fontFamily: "monospace",
              fontSize: "0.85rem",
              wordBreak: "break-all",
            }}
          >
            <strong>Tx Hash:</strong> {transaction.hash}
          </div>

          {transaction.readbackVerified ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1rem",
                background: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #86efac",
                marginBottom: "1.25rem",
                fontSize: "0.85rem",
                color: "#166534",
              }}
            >
              <CheckCircle2 size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
              <span>
                <strong>Smart Contract Readback Verified:</strong> Batch #{transaction.batchId.toString()}{" "}
                confirmed on {web3.selectedNetworkConfig.name} with{" "}
                {transaction.readbackTotalKg !== undefined ? formatQuantityKg(transaction.readbackTotalKg) : ""}{" "}
                across {transaction.readbackFarmersCount ?? 0} farmer allocations.
              </span>
            </div>
          ) : (
            <div
              style={{
                padding: "0.75rem 1rem",
                background: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #fed7aa",
                marginBottom: "1.25rem",
                fontSize: "0.85rem",
                color: "#9a3412",
              }}
            >
              Transaction confirmed in block #{transaction.blockNumber}. Readback verification pending node propagation.
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <a
              href={getExplorerTxUrl(web3.selectedNetwork, transaction.hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="mm-btn mm-btn--primary"
            >
              <ExternalLink size={15} /> View on {web3.selectedNetworkConfig.name} Explorer
            </a>
            <Link
              to={`/app/batches/${transaction.batchId.toString()}`}
              className="mm-btn mm-btn--outline"
            >
              View Batch Details Page →
            </Link>
            <Button type="button" variant="ghost" onClick={resetForm}>
              Record Another Batch
            </Button>
          </div>
        </section>
      )}

      {/* Main Record Batch Form */}
      {transaction.status !== "confirmed" && (
        <form onSubmit={handleSubmit} noValidate>
          {formError && <ErrorBanner message={formError} />}
          {transaction.status === "failed" && (
            <ErrorBanner message={transaction.message} />
          )}

          {/* Step 1: Crop Selection */}
          <section className="mm-panel">
            <div className="mm-panel__head">
              <div>
                <p className="mm-panel__eyebrow">Select Agricultural Produce</p>
                <h2 className="mm-panel__title">Commodity Selection</h2>
              </div>
              <span style={{ fontSize: "1.5rem" }}>{selectedCrop.emoji}</span>
            </div>

            <p className="mm-panel__text">
              Choose an agricultural commodity or enter a custom crop ID. MandiMint maps
              standard crop categories with typical mandi reference prices.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 150px), 1fr))",
                gap: "0.5rem",
                marginTop: "1rem",
              }}
            >
              {CROPS_CATALOG.slice(0, 8).map((crop) => {
                const isSelected = draft.cropId === crop.id.toString();
                return (
                  <button
                    key={crop.id.toString()}
                    type="button"
                    onClick={() =>
                      handleCropSelect(
                        crop.id.toString(),
                        crop.defaultPriceInrPerTonne.toString(),
                      )
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "8px",
                      border: isSelected ? "2px solid #10b981" : "1px solid #e5e7eb",
                      background: isSelected ? "#ecfdf5" : "#ffffff",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{ fontSize: "1.25rem" }}>{crop.emoji}</span>
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#111827" }}>
                        {crop.name}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>
                        ₹{(Number(crop.defaultPriceInrPerTonne) / 1000).toFixed(0)}k/T
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 2: Batch Details */}
          <section className="mm-panel">
            <div className="mm-panel__head">
              <div>
                <p className="mm-panel__eyebrow">Batch Identifiers &amp; Quantities</p>
                <h2 className="mm-panel__title">Sale Parameters</h2>
              </div>
            </div>

            <div className="mm-form-grid">
              <Input
                label="Batch ID"
                hint="Unique whole number (e.g. 104)"
                inputMode="numeric"
                value={draft.batchId}
                onChange={(e) => updateField("batchId", e.target.value)}
                error={errors.batchId}
                disabled={busy}
                required
              />
              <Input
                label="Crop ID"
                hint="Numerical commodity identifier"
                inputMode="numeric"
                value={draft.cropId}
                onChange={(e) => updateField("cropId", e.target.value)}
                error={errors.cropId}
                disabled={busy}
                required
              />
              <Input
                label="Total Quantity (kg)"
                hint="Whole kilograms for entire batch"
                inputMode="numeric"
                value={draft.totalQuantityKg}
                onChange={(e) => updateField("totalQuantityKg", e.target.value)}
                error={errors.totalQuantityKg}
                disabled={busy}
                required
              />
              <Input
                label="Sale Price (INR / Metric Tonne)"
                hint="Whole INR per tonne (1 tonne = 1,000 kg)"
                inputMode="numeric"
                value={draft.salePriceInrPerTonne}
                onChange={(e) => updateField("salePriceInrPerTonne", e.target.value)}
                error={errors.salePriceInrPerTonne}
                disabled={busy}
                required
              />
            </div>

            {/* Reference Gross Value Preview */}
            {summary.grossValue && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem 1rem",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  color: "#334155",
                }}
              >
                📊 <strong>Estimated Gross Batch Value:</strong> {summary.grossValue} (
                {formatQuantityKg(summary.total ?? 0n)} @ ₹
                {Number(summary.price ?? 0n).toLocaleString()} / MT)
              </div>
            )}
          </section>

          {/* Step 3: Farmer Allocations with Visual Tracker */}
          <section className="mm-panel">
            <div className="mm-panel__head">
              <div>
                <p className="mm-panel__eyebrow">Farmer Quantity Breakdown</p>
                <h2 className="mm-panel__title">Farmer Wallet Allocations</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addAllocation}
                disabled={busy}
                leadingIcon={<Plus size={15} />}
              >
                Add Farmer
              </Button>
            </div>

            <p className="mm-panel__text">
              Each farmer&apos;s wallet address receives a tamper-evident on-chain allocation.
              The smart contract requires the sum of all farmer quantities to match the total exactly.
            </p>

            {/* Dynamic Visual Allocation Tracker */}
            {summary.total !== null && summary.total > 0n && (
              <div
                style={{
                  margin: "1rem 0",
                  padding: "0.85rem 1rem",
                  borderRadius: "8px",
                  background:
                    summary.difference === 0n
                      ? "#f0fdf4"
                      : summary.difference !== null && summary.difference > 0n
                      ? "#fef2f2"
                      : "#fffbeb",
                  border:
                    summary.difference === 0n
                      ? "1px solid #86efac"
                      : summary.difference !== null && summary.difference > 0n
                      ? "1px solid #fca5a5"
                      : "1px solid #fde68a",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  <span>
                    Allocated: {summary.allocationTotal.toLocaleString()} kg / {summary.total.toLocaleString()} kg
                  </span>
                  <span>
                    {summary.difference === 0n ? (
                      <span style={{ color: "#16a34a" }}>✓ Perfectly Matched (100%)</span>
                    ) : summary.difference !== null && summary.difference > 0n ? (
                      <span style={{ color: "#dc2626" }}>Over by {summary.difference.toLocaleString()} kg</span>
                    ) : (
                      <span style={{ color: "#d97706" }}>Remaining: {(-summary.difference!).toLocaleString()} kg</span>
                    )}
                  </span>
                </div>
                <div style={{ height: "8px", background: "#e5e7eb", borderRadius: "9999px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(
                        100,
                        Number((summary.allocationTotal * 100n) / summary.total),
                      )}%`,
                      background:
                        summary.difference === 0n
                          ? "#10b981"
                          : summary.difference !== null && summary.difference > 0n
                          ? "#ef4444"
                          : "#f59e0b",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Farmer Rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
              {draft.allocations.map((alloc, index) => {
                const allocError = errors.allocations?.[alloc.id];
                return (
                  <div
                    key={alloc.id}
                    className="mm-record-allocation-row"
                  >
                    <div className="mm-record-allocation-row__addr">
                      <Input
                        label={`Farmer #${index + 1} EVM Address`}
                        placeholder="0x..."
                        value={alloc.address}
                        onChange={(e) => updateAllocation(alloc.id, "address", e.target.value)}
                        error={allocError?.address}
                        disabled={busy}
                        required
                      />
                    </div>
                    <div className="mm-record-allocation-row__qty">
                      <Input
                        label="Quantity (kg)"
                        placeholder="e.g. 1500"
                        inputMode="numeric"
                        value={alloc.quantityKg}
                        onChange={(e) => updateAllocation(alloc.id, "quantityKg", e.target.value)}
                        error={allocError?.quantityKg}
                        disabled={busy}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAllocation(alloc.id)}
                      disabled={busy || draft.allocations.length <= 1}
                      title="Remove farmer"
                      className="mm-record-allocation-row__remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Submission Bar */}
          <div className="mm-submission-bar">
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>
                Ready to record batch on {web3.selectedNetworkConfig.name}?
              </p>
              <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.8rem", color: "#6b7280" }}>
                Transaction will be signed by {activeAddress ? truncateAddress(activeAddress, 6, 4) : "your connected wallet"}
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={busy || !activeSigner}
              leadingIcon={<Send size={16} />}
            >
              {transaction.status === "signing"
                ? "Signing in Wallet…"
                : transaction.status === "pending"
                ? "Confirming on MST Chain…"
                : "Record Batch On-Chain"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
