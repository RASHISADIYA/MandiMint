import {
  ArrowRight,
  CheckCircle2,
  ClipboardPlus,
  ExternalLink,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { isMandiMintReady } from "../../config/blockchain";
import { Button } from "../../components/ui/Button";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { Input } from "../../components/ui/Input";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { WalletSetupCard } from "../../components/wallet/WalletSetupCard";
import { useManagerStatus } from "../../hooks/useMandiMintReads";
import { useAuthoritativeRole } from "../../hooks/useAuthoritativeRole";
import { useWalletOnboarding } from "../../hooks/useWalletOnboarding";
import {
  formatContractError,
  getExplorerTransactionUrl,
  submitRecordBatch,
} from "../../lib/blockchain/mandiMintContract";
import {
  formatGrossValue,
  formatQuantityKg,
  parseWholeNumber,
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
  | { status: "confirmed"; hash: string; batchId: bigint; blockNumber: number }
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
    cropId: "",
    totalQuantityKg: "",
    salePriceInrPerTonne: "",
    allocations: [createAllocation()],
  };
}

function PageHeader() {
  return (
    <header className="mm-page-head">
      <div>
        <p className="mm-page-head__eyebrow">
          <ClipboardPlus size={14} aria-hidden="true" />
          FPO manager action
        </p>
        <h1 className="mm-page-head__title">Record a crop sale batch</h1>
        <p className="mm-page-head__lead">
          Submit whole kilograms and whole INR per metric tonne. The contract
          checks manager authorization, unique farmers, and the exact allocation
          total before storing anything.
        </p>
      </div>
    </header>
  );
}

export function RecordBatchPage() {
  const { role } = useAuthoritativeRole(true);
  const {
    walletAddress,
    embeddedWallet,
    state: walletState,
    mstConfigured,
  } = useWalletOnboarding();
  const manager = useManagerStatus(
    role === "fpo_admin" ? walletAddress : null,
  );

  const [draft, setDraft] = useState<RecordBatchDraft>(createDraft);
  const [errors, setErrors] = useState<RecordBatchErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<TransactionState>({
    status: "idle",
  });

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
  }, [
    draft.totalQuantityKg,
    draft.salePriceInrPerTonne,
    draft.allocations,
  ]);

  const busy =
    transaction.status === "signing" || transaction.status === "pending";

  const updateField = useCallback(
    (field: keyof Omit<RecordBatchDraft, "allocations">, value: string) => {
      setDraft((current) => ({ ...current, [field]: value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
    },
    [],
  );

  const updateAllocation = useCallback(
    (id: string, field: "address" | "quantityKg", value: string) => {
      setDraft((current) => ({
        ...current,
        allocations: current.allocations.map((allocation) =>
          allocation.id === id ? { ...allocation, [field]: value } : allocation,
        ),
      }));
      setErrors((current) => ({
        ...current,
        allocations: {
          ...current.allocations,
          [id]: { ...current.allocations?.[id], [field]: undefined },
        },
      }));
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
    setDraft((current) => ({
      ...current,
      allocations: current.allocations.filter((allocation) => allocation.id !== id),
    }));
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
        setFormError(null);
        window.requestAnimationFrame(() => {
          document
            .querySelector<HTMLInputElement>('[aria-invalid="true"]')
            ?.focus();
        });
        return;
      }

      if (!embeddedWallet) {
        setFormError("Create an embedded wallet before recording a batch.");
        return;
      }

      setErrors({});
      setTransaction({ status: "signing" });

      let hash: string | null = null;
      let submittedBatchId: bigint | null = null;

      try {
        const response = await submitRecordBatch(embeddedWallet, result.value);
        hash = response.hash;
        submittedBatchId = result.value.batchId;

        setTransaction({
          status: "pending",
          hash: response.hash,
          batchId: result.value.batchId,
        });

        const receipt = await response.wait();
        if (!receipt || receipt.status !== 1) {
          throw new Error("The transaction was mined but did not succeed.");
        }

        setTransaction({
          status: "confirmed",
          hash: response.hash,
          batchId: result.value.batchId,
          blockNumber: receipt.blockNumber,
        });
      } catch (err) {
        setTransaction({
          status: "failed",
          hash,
          batchId: submittedBatchId,
          message: formatContractError(err),
        });
      }
    },
    [draft, embeddedWallet],
  );

  if (role !== "fpo_admin") {
    return (
      <div className="mm-page">
        <PageHeader />
        <section className="mm-panel mm-panel--accent">
          <StatusBadge variant="warning">FPO Admin role required</StatusBadge>
          <h2 className="mm-panel__title">This action is limited by role</h2>
          <p className="mm-panel__text">
            Recording batches requires an FPO Admin role, verified by the MandiMint
            backend when it is configured. Your embedded wallet must also be
            authorized on-chain via <code>isManager</code> before the contract accepts
            a batch—even when a local role is used.
          </p>
          <Link to="/app" className="mm-text-link">
            Go to overview <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </div>
    );
  }

  if (!mstConfigured || !isMandiMintReady()) {
    return (
      <div className="mm-page">
        <PageHeader />
        <section className="mm-panel">
          <StatusBadge variant="warning">Contract not configured</StatusBadge>
          <p className="mm-panel__text">
            Batch recording is disabled until the official MST Testnet chain ID,
            RPC URL, and deployed contract address are set. No mock contract or
            placeholder transaction is used.
          </p>
        </section>
      </div>
    );
  }

  if (walletState !== "wallet_ready") {
    return (
      <div className="mm-page">
        <PageHeader />
        <WalletSetupCard title="Manager wallet" />
        <p className="mm-panel__note">
          The record form unlocks after Privy provisions your wallet and the wallet
          is on the configured MST Testnet.
        </p>
      </div>
    );
  }

  if (manager.status === "loading" || manager.status === "idle") {
    return (
      <div className="mm-page">
        <PageHeader />
        <StatusBadge variant="pending">Checking on-chain manager status…</StatusBadge>
      </div>
    );
  }

  if (manager.status === "error") {
    return (
      <div className="mm-page">
        <PageHeader />
        <ErrorBanner
          message={manager.error ?? "Could not read manager status from the contract."}
          onRetry={manager.reload}
        />
      </div>
    );
  }

  if (!manager.data) {
    return (
      <div className="mm-page">
        <PageHeader />
        <section className="mm-panel mm-panel--accent">
          <StatusBadge variant="warning">Wallet not authorized</StatusBadge>
          <h2 className="mm-panel__title">Record batch is read-only for this wallet</h2>
          <p className="mm-panel__text">
            This wallet is not an authorized manager on the contract. Contact the
            contract owner and ask them to authorize it with <code>setManager</code>.
          </p>
          {walletAddress && <code className="mm-address">{walletAddress}</code>}
        </section>
      </div>
    );
  }

  if (transaction.status === "confirmed") {
    const explorerUrl = getExplorerTransactionUrl(transaction.hash);

    return (
      <div className="mm-page">
        <PageHeader />
        <section className="mm-panel mm-panel--success">
          <StatusBadge variant="success">
            <CheckCircle2 size={14} aria-hidden="true" />
            Batch recorded
          </StatusBadge>
          <h2 className="mm-panel__title">
            Batch #{transaction.batchId.toString()} is on-chain
          </h2>
          <p className="mm-panel__text">
            Confirmed in block {transaction.blockNumber.toLocaleString("en-IN")}. The
            record can now be read by anyone through the contract.
          </p>
          <dl className="mm-detail-list">
            <div>
              <dt>Transaction</dt>
              <dd>
                <code>{transaction.hash}</code>
              </dd>
            </div>
          </dl>
          <div className="mm-button-row">
            <Link
              to={`/app/batches/${transaction.batchId.toString()}`}
              className="mm-primary-link"
            >
              View batch <ArrowRight size={16} aria-hidden="true" />
            </Link>
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="mm-outline-link"
              >
                Explorer <ExternalLink size={14} aria-hidden="true" />
              </a>
            )}
            <Button type="button" variant="outline" onClick={resetForm}>
              Record another batch
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mm-page">
      <PageHeader />

      <form className="mm-form-layout" onSubmit={handleSubmit} noValidate>
        <div className="mm-panel">
          <div className="mm-panel__head">
            <div>
              <p className="mm-panel__eyebrow">Batch details</p>
              <h2 className="mm-panel__title">Identifiers and totals</h2>
            </div>
          </div>

          <div className="mm-form-grid">
            <Input
              label="Batch ID"
              hint="Unique, nonzero whole number."
              inputMode="numeric"
              value={draft.batchId}
              onChange={(event) => updateField("batchId", event.target.value)}
              error={errors.batchId}
              disabled={busy}
              required
            />
            <Input
              label="Crop ID"
              hint="Nonzero whole number."
              inputMode="numeric"
              value={draft.cropId}
              onChange={(event) => updateField("cropId", event.target.value)}
              error={errors.cropId}
              disabled={busy}
              required
            />
            <Input
              label="Total quantity (kg)"
              hint="Whole kilograms for the whole batch."
              inputMode="numeric"
              value={draft.totalQuantityKg}
              onChange={(event) =>
                updateField("totalQuantityKg", event.target.value)
              }
              error={errors.totalQuantityKg}
              disabled={busy}
              required
            />
            <Input
              label="Sale price (INR / tonne)"
              hint="Whole INR per metric tonne (1 tonne = 1,000 kg)."
              inputMode="numeric"
              value={draft.salePriceInrPerTonne}
              onChange={(event) =>
                updateField("salePriceInrPerTonne", event.target.value)
              }
              error={errors.salePriceInrPerTonne}
              disabled={busy}
              required
            />
          </div>

          <div className="mm-panel__sub">
            <div className="mm-section-row">
              <div>
                <h3 className="mm-panel__title mm-panel__title--small">
                  Farmer allocations
                </h3>
                <p className="mm-panel__text">
                  Each wallet can appear once. Quantities must sum exactly to the
                  batch total.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                leadingIcon={<Plus size={16} aria-hidden="true" />}
                onClick={addAllocation}
                disabled={busy}
              >
                Add farmer
              </Button>
            </div>

            <div className="mm-allocation-list">
              {draft.allocations.map((allocation, index) => (
                <div key={allocation.id} className="mm-allocation-row">
                  <span className="mm-allocation-row__index">{index + 1}</span>
                  <Input
                    label="Farmer wallet address"
                    placeholder="0x…"
                    className="mm-mono-input"
                    value={allocation.address}
                    onChange={(event) =>
                      updateAllocation(allocation.id, "address", event.target.value)
                    }
                    error={errors.allocations?.[allocation.id]?.address}
                    disabled={busy}
                    required
                  />
                  <Input
                    label="Allocated kg"
                    hint="Whole kilograms."
                    inputMode="numeric"
                    value={allocation.quantityKg}
                    onChange={(event) =>
                      updateAllocation(
                        allocation.id,
                        "quantityKg",
                        event.target.value,
                      )
                    }
                    error={errors.allocations?.[allocation.id]?.quantityKg}
                    disabled={busy}
                    required
                  />
                  <button
                    type="button"
                    className="mm-remove-button"
                    aria-label={`Remove farmer ${index + 1}`}
                    onClick={() => removeAllocation(allocation.id)}
                    disabled={busy || draft.allocations.length === 1}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="mm-form-aside">
          <section className="mm-panel mm-summary" aria-labelledby="summary-title">
            <p className="mm-panel__eyebrow">Before you submit</p>
            <h2 id="summary-title" className="mm-panel__title mm-panel__title--small">
              Allocation summary
            </h2>

            <dl className="mm-detail-list">
              <div>
                <dt>Batch total</dt>
                <dd>
                  {summary.total !== null && summary.total > 0n
                    ? formatQuantityKg(summary.total)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Allocated</dt>
                <dd>{formatQuantityKg(summary.allocationTotal)}</dd>
              </div>
              <div>
                <dt>Difference</dt>
                <dd>
                  {summary.difference === null
                    ? "—"
                    : summary.difference === 0n
                      ? "Balanced"
                      : summary.difference > 0n
                        ? `${formatQuantityKg(summary.difference)} over`
                        : `${formatQuantityKg(-summary.difference)} remaining`}
                </dd>
              </div>
              <div>
                <dt>Reference gross value</dt>
                <dd>{summary.grossValue ?? "—"}</dd>
              </div>
            </dl>

            <p className="mm-panel__note">
              The gross value is a reference calculation only: quantity × price ÷
              1,000, with exact remainder. MandiMint does not transfer or settle
              funds.
            </p>

            {errors.form && <ErrorBanner message={errors.form} />}
            {formError && <ErrorBanner message={formError} />}

            {transaction.status === "signing" && (
              <StatusBadge variant="pending">
                Confirm the transaction in your wallet…
              </StatusBadge>
            )}
            {transaction.status === "pending" && (
              <div className="mm-tx-pending">
                <StatusBadge variant="pending">Transaction pending</StatusBadge>
                <code className="mm-address">{transaction.hash}</code>
                {getExplorerTransactionUrl(transaction.hash) && (
                  <a
                    href={getExplorerTransactionUrl(transaction.hash) ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="mm-text-link"
                  >
                    View on explorer <ExternalLink size={14} aria-hidden="true" />
                  </a>
                )}
              </div>
            )}

            {transaction.status === "failed" && (
              <div className="mm-tx-pending">
                <StatusBadge variant="error">Transaction failed</StatusBadge>
                <ErrorBanner message={transaction.message} />
                {transaction.hash && (
                  <>
                    <code className="mm-address">{transaction.hash}</code>
                    {getExplorerTransactionUrl(transaction.hash) && (
                      <a
                        href={getExplorerTransactionUrl(transaction.hash) ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="mm-text-link"
                      >
                        View failed transaction{" "}
                        <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    )}
                  </>
                )}
              </div>
            )}

            <Button
              type="submit"
              loading={busy}
              disabled={busy}
              leadingIcon={<Send size={16} aria-hidden="true" />}
              className="mm-auth__submit"
            >
              Record batch on-chain
            </Button>

            <p className="mm-panel__note">
              Your wallet will ask you to sign. The contract enforces the same
              validation again; UI checks are not a security boundary.
            </p>
          </section>
        </aside>
      </form>
    </div>
  );
}
