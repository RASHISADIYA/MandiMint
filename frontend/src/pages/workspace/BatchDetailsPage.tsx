import { ArrowLeft, ExternalLink, Layers, Search, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ContractConfigNotice } from "../../components/blockchain/ContractConfigNotice";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { SkeletonCard } from "../../components/ui/LoadingSkeleton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useBatchDetails } from "../../hooks/useMandiMintReads";
import { getExplorerAddressUrl } from "../../lib/blockchain/mandiMintContract";
import {
  formatGrossValue,
  formatInrPerTonne,
  formatQuantityKg,
  formatTimestamp,
  parseWholeNumber,
  truncateAddress,
} from "../../lib/format";

export function BatchDetailsPage() {
  const { batchId: batchIdParam } = useParams<{ batchId: string }>();
  const parsedId = batchIdParam ? parseWholeNumber(batchIdParam) : null;
  const validId = parsedId !== null && parsedId > 0n ? parsedId : null;
  const details = useBatchDetails(validId);

  if (!validId) {
    return (
      <div className="mm-page">
        <header className="mm-page-head">
          <div>
            <p className="mm-page-head__eyebrow">
              <Search size={14} aria-hidden="true" />
              Batch lookup
            </p>
            <h1 className="mm-page-head__title">Invalid batch ID</h1>
            <p className="mm-page-head__lead">
              Batch IDs are positive whole numbers.
            </p>
          </div>
        </header>
        <Link to="/app/batches" className="mm-text-link">
          <ArrowLeft size={15} aria-hidden="true" /> Back to batch lookup
        </Link>
      </div>
    );
  }

  return (
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <p className="mm-page-head__eyebrow">
            <Layers size={14} aria-hidden="true" />
            On-chain batch
          </p>
          <h1 className="mm-page-head__title">
            Batch #{validId.toString()}
          </h1>
          <p className="mm-page-head__lead">
            Public contract record. Quantities are whole kilograms; prices are
            whole INR per metric tonne.
          </p>
        </div>
        <Link to="/app/batches" className="mm-outline-link">
          <ArrowLeft size={15} aria-hidden="true" /> Find another batch
        </Link>
      </header>

      {details.status === "loading" && <SkeletonCard />}

      {details.status === "unconfigured" && (
        <ContractConfigNotice />
      )}

      {details.status === "error" && (
        <ErrorBanner
          message={details.error ?? "Could not read this batch."}
          onRetry={details.reload}
        />
      )}

      {details.status === "success" && details.data && (
        <>
          <div className="mm-stat-grid">
            <div className="mm-stat-card">
              <span className="mm-stat-card__label">Total quantity</span>
              <span className="mm-stat-card__value">
                {formatQuantityKg(details.data.totalQuantityKg)}
              </span>
            </div>
            <div className="mm-stat-card">
              <span className="mm-stat-card__label">Sale price</span>
              <span className="mm-stat-card__value">
                {formatInrPerTonne(details.data.salePriceInrPerTonne)}
              </span>
            </div>
            <div className="mm-stat-card">
              <span className="mm-stat-card__label">Reference gross value</span>
              <span className="mm-stat-card__value">
                {formatGrossValue(
                  details.data.totalQuantityKg,
                  details.data.salePriceInrPerTonne,
                )}
              </span>
            </div>
            <div className="mm-stat-card">
              <span className="mm-stat-card__label">Farmer allocations</span>
              <span className="mm-stat-card__value">
                {details.data.allocations.length}
              </span>
            </div>
          </div>

          <div className="mm-two-col">
            <section className="mm-panel" aria-labelledby="batch-meta-title">
              <h2 id="batch-meta-title" className="mm-panel__title">
                Batch metadata
              </h2>
              <dl className="mm-detail-list">
                <div>
                  <dt>Batch ID</dt>
                  <dd>
                    <code>{details.data.batchId.toString()}</code>
                  </dd>
                </div>
                <div>
                  <dt>Crop ID</dt>
                  <dd>
                    <code>{details.data.cropId.toString()}</code>
                  </dd>
                </div>
                <div>
                  <dt>Recorded by</dt>
                  <dd>
                    <code title={details.data.manager}>
                      {truncateAddress(details.data.manager, 10, 8)}
                    </code>
                    {getExplorerAddressUrl(details.data.manager) && (
                      <a
                        href={getExplorerAddressUrl(details.data.manager) ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="mm-inline-link"
                      >
                        Explorer <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Recorded at</dt>
                  <dd>{formatTimestamp(details.data.createdAt)}</dd>
                </div>
              </dl>
              <p className="mm-panel__note">
                This contract has no update, delete, or payment functions. The
                record is append-only.
              </p>
            </section>

            <section className="mm-panel" aria-labelledby="allocations-title">
              <div className="mm-panel__head">
                <div>
                  <h2 id="allocations-title" className="mm-panel__title">
                    Farmer allocations
                  </h2>
                  <p className="mm-panel__text">
                    Wallet addresses are public. Names and phone numbers are not
                    stored on-chain.
                  </p>
                </div>
                <UserRound aria-hidden="true" className="mm-panel__icon" />
              </div>

              <div className="mm-table-wrap">
                <table className="mm-table">
                  <caption className="visually-hidden">
                    Farmer wallet addresses and allocated quantities
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Farmer wallet</th>
                      <th scope="col">Allocated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.data.allocations.map((allocation) => (
                      <tr key={allocation.farmer}>
                        <td>
                          <code title={allocation.farmer}>
                            {truncateAddress(allocation.farmer, 10, 8)}
                          </code>
                        </td>
                        <td>{formatQuantityKg(allocation.quantityKg)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {details.data.allocations.length === 0 && (
                <p className="mm-panel__text">
                  The contract returned no allocations for this batch.
                </p>
              )}
            </section>
          </div>

          <div className="mm-inline-hint">
            <StatusBadge variant="neutral">Read-only record</StatusBadge>
            Gross value is a reference calculation and does not indicate a payment.
          </div>
        </>
      )}
    </div>
  );
}
