import {
  ArrowRight,
  ClipboardPlus,
  History,
  Search,
  ShieldCheck,
  Sprout,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROLE_LABELS } from "../../auth/roles";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { WalletSetupCard } from "../../components/wallet/WalletSetupCard";
import {
  useFarmerHistory,
  useManagerStatus,
} from "../../hooks/useMandiMintReads";
import { useAuthoritativeRole } from "../../hooks/useAuthoritativeRole";
import { useWalletOnboarding } from "../../hooks/useWalletOnboarding";
import { formatPhoneNumber } from "../../auth/phone";
import { formatQuantityKg, truncateAddress } from "../../lib/format";

export type DashboardMode = "farmer" | "manager";

function AccountCard() {
  const { profile, walletAddress, mstChain, networkVerification } =
    useWalletOnboarding();
  const { role, displayName, status, message, source } =
    useAuthoritativeRole(true);

  return (
    <section className="mm-panel" aria-labelledby="account-title">
      <div className="mm-panel__head">
        <div>
          <p className="mm-panel__eyebrow">Account</p>
          <h2 id="account-title" className="mm-panel__title">
            {displayName ??
              formatPhoneNumber(profile?.phone ?? null) ??
              profile?.email ??
              "Signed in"}
          </h2>
        </div>
        {status === "verified" && role ? (
          <StatusBadge variant={source === "local" ? "warning" : "success"}>
            {ROLE_LABELS[role]} {source === "local" ? "(local)" : "(verified)"}
          </StatusBadge>
        ) : (
          <StatusBadge variant="warning">Role pending verification</StatusBadge>
        )}
      </div>

      {status === "unconfigured" && message && (
        <ErrorBanner message={message} />
      )}

      <dl className="mm-detail-list">
        <div>
          <dt>Application role</dt>
          <dd>
            {role
              ? `${ROLE_LABELS[role]}${source === "local" ? " (local)" : ""}`
              : source === "local"
                ? "Unassigned — choose a local role"
                : "Unassigned — server verification required"}
          </dd>
        </div>
        <div>
          <dt>Embedded wallet</dt>
          <dd>
            {walletAddress ? (
              <code>{truncateAddress(walletAddress, 10, 8)}</code>
            ) : (
              "Not ready"
            )}
          </dd>
        </div>
        <div>
          <dt>MST Testnet</dt>
          <dd>
            {networkVerification.status === "connected" && mstChain
              ? `${mstChain.name} · chain ${mstChain.id} (verified)`
              : mstChain
                ? `${mstChain.name} · pending verification`
                : "Not configured"}
          </dd>
        </div>
      </dl>

      <p className="mm-panel__note">
        {source === "local"
          ? "This role is a local workspace preference, not server-verified. On-chain manager permission is separate and still requires an authorized wallet."
          : "Roles are assigned by the MandiMint backend. On-chain manager permission is separate and requires an authorized wallet."}
      </p>
    </section>
  );
}

function ManagerCard() {
  const { walletAddress } = useWalletOnboarding();
  const { role } = useAuthoritativeRole(true);
  const manager = useManagerStatus(
    role === "fpo_admin" ? walletAddress : null,
  );

  if (role !== "fpo_admin") {
    return null;
  }

  return (
    <section className="mm-panel" aria-labelledby="manager-title">
      <div className="mm-panel__head">
        <div>
          <p className="mm-panel__eyebrow">FPO permission</p>
          <h2 id="manager-title" className="mm-panel__title">
            Manager authorization
          </h2>
        </div>
        <ShieldCheck aria-hidden="true" className="mm-panel__icon" />
      </div>

      {!walletAddress ? (
        <p className="mm-panel__text">
          Your embedded wallet must be ready to check on-chain manager authorization.
        </p>
      ) : manager.status === "loading" ? (
        <StatusBadge variant="pending">Checking contract…</StatusBadge>
      ) : manager.status === "error" ? (
        <ErrorBanner message={manager.error ?? "Could not read manager status."} />
      ) : manager.data ? (
        <>
          <StatusBadge variant="success">Authorized manager</StatusBadge>
          <p className="mm-panel__text">
            This wallet can call <code>recordBatch</code> on the MandiMint contract.
          </p>
          <Link to="/app/manager/record" className="mm-text-link">
            Record a batch <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </>
      ) : (
        <>
          <StatusBadge variant="warning">Not an authorized manager</StatusBadge>
          <p className="mm-panel__text">
            This wallet can read public records but cannot write batches. Ask the
            contract owner to authorize it with <code>setManager</code>.
          </p>
          <code className="mm-address">{walletAddress}</code>
        </>
      )}
    </section>
  );
}

function FarmerSnapshotCard() {
  const { walletAddress } = useWalletOnboarding();
  const { role } = useAuthoritativeRole(true);
  const history = useFarmerHistory(
    role === "farmer" ? walletAddress : null,
  );

  if (role !== "farmer") {
    return null;
  }

  const totalKg =
    history.data?.reduce((sum, row) => sum + row.quantityKg, 0n) ?? 0n;

  return (
    <section className="mm-panel" aria-labelledby="farmer-snapshot-title">
      <div className="mm-panel__head">
        <div>
          <p className="mm-panel__eyebrow">Your records</p>
          <h2 id="farmer-snapshot-title" className="mm-panel__title">
            Allocation snapshot
          </h2>
        </div>
        <Sprout aria-hidden="true" className="mm-panel__icon" />
      </div>

      {!walletAddress ? (
        <p className="mm-panel__text">
          Your embedded wallet address is used to read on-chain allocation history.
        </p>
      ) : history.status === "loading" ? (
        <StatusBadge variant="pending">Reading contract…</StatusBadge>
      ) : history.status === "error" ? (
        <ErrorBanner message={history.error ?? "Could not read farmer history."} />
      ) : history.status === "unconfigured" ? (
        <p className="mm-panel__text">
          Farmer history becomes available when the contract is configured.
        </p>
      ) : (
        <>
          <div className="mm-stat-row">
            <div>
              <span className="mm-stat-row__value">
                {history.data?.length ?? 0}
              </span>
              <span className="mm-stat-row__label">recorded batches</span>
            </div>
            <div>
              <span className="mm-stat-row__value">{formatQuantityKg(totalKg)}</span>
              <span className="mm-stat-row__label">total allocated</span>
            </div>
          </div>
          <Link to="/app/farmer/history" className="mm-text-link">
            View farmer history <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </>
      )}
    </section>
  );
}

export function OverviewPage({ dashboardMode }: { dashboardMode: DashboardMode }) {
  const { role } = useAuthoritativeRole(true);

  const actions = [
    ...(role === "fpo_admin"
      ? [
          {
            to: "/app/manager/record",
            title: "Record a batch",
            description:
              "Submit a validated batch with farmer wallet allocations.",
            icon: ClipboardPlus,
          },
        ]
      : []),
    {
      to: "/app/batches",
      title: "Find a batch",
      description: "Look up a recorded batch by its numeric ID.",
      icon: Search,
    },
    ...(role === "farmer"
      ? [
          {
            to: "/app/farmer/history",
            title: "My allocation history",
            description: "Review batches linked to your embedded wallet.",
            icon: History,
          },
        ]
      : []),
  ];

  const isManagerView = dashboardMode === "manager";

  return (
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <p className="mm-page-head__eyebrow">
            <UserRound size={14} aria-hidden="true" />
            {isManagerView ? "FPO manager workspace" : "Farmer workspace"}
          </p>
          <h1 className="mm-page-head__title">
            {isManagerView
              ? "Publish clear, validated batch records."
              : "Your crop records, linked to your wallet."}
          </h1>
          <p className="mm-page-head__lead">
            MandiMint stores batch and allocation records on MST Testnet. It does
            not move money, hold escrow, or store phone numbers on-chain.
          </p>
        </div>
        {role === "fpo_admin" && isManagerView && (
          <Link to="/app/manager/record" className="mm-primary-link">
            <ClipboardPlus size={16} aria-hidden="true" />
            Record batch
          </Link>
        )}
      </header>

      <div className="mm-overview-grid">
        <AccountCard />
        <WalletSetupCard />
        <ManagerCard />
        <FarmerSnapshotCard />
      </div>

      <section className="mm-quick-actions" aria-labelledby="actions-title">
        <div className="mm-section-row">
          <div>
            <p className="mm-panel__eyebrow">Next steps</p>
            <h2 id="actions-title" className="mm-panel__title">
              What would you like to do?
            </h2>
          </div>
        </div>
        <div className="mm-action-grid">
          {actions.map(({ to, title, description, icon: Icon }) => (
            <Link key={to} to={to} className="mm-action-card">
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

      {!role && (
        <div className="mm-inline-hint">
          Dashboard actions stay limited until a backend-verified or local workspace role is available.
        </div>
      )}
    </div>
  );
}
