import {
  AlertTriangle,
  ClipboardPlus,
  Flame,
  PlusCircle,
  Search,
  ShieldCheck,
  UserCheck,
  Warehouse,
} from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useWeb3Wallet } from "../../providers/Web3WalletContext";
import { parseWholeNumber, truncateAddress } from "../../lib/format";
import { getExplorerAddressUrl } from "../../config/networks";

export function ManagerDashboardPage() {
  const navigate = useNavigate();
  const {
    address,
    isManager,
    isOwner,
    balance,
    isTestnet,
    networkName,
    selectedNetworkConfig,
    isContractConfigured,
    switchToMstTestnet,
  } = useWeb3Wallet();

  const [lookupId, setLookupId] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleLookup = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const parsed = parseWholeNumber(lookupId);
      if (parsed === null || parsed <= 0n) {
        setLookupError("Please enter a valid numeric batch ID.");
        return;
      }
      setLookupError(null);
      navigate(`/app/batches/${parsed.toString()}`);
    },
    [lookupId, navigate],
  );

  const isAuthorized = isManager || isOwner;

  // If contract is not deployed on this network (e.g. Mainnet)
  if (!isContractConfigured) {
    return (
      <div className="mm-page">
        <header className="mm-page-head">
          <div>
            <p className="mm-page-head__eyebrow">
              <Warehouse size={14} aria-hidden="true" />
              FPO Manager Workspace
            </p>
            <h1 className="mm-page-head__title">Contract Undeployed on {selectedNetworkConfig.name}</h1>
            <p className="mm-page-head__lead">
              The MandiMint smart contract is not yet deployed on {selectedNetworkConfig.name} (Chain #{selectedNetworkConfig.chainId}).
            </p>
          </div>
        </header>

        <section
          className="mm-panel"
          style={{
            borderLeft: "4px solid #f59e0b",
            background: "var(--color-surface)",
          }}
        >
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1.25rem" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#b45309",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={24} />
            </div>

            <div>
              <div style={{ marginBottom: "0.4rem" }}>
                <StatusBadge variant="warning">Mainnet Deployment Pending</StatusBadge>
              </div>
              <h2 className="mm-panel__title" style={{ fontSize: "1.35rem" }}>
                Write Operations Unavailable on {selectedNetworkConfig.name}
              </h2>
            </div>
          </div>

          <p className="mm-panel__text" style={{ lineHeight: 1.6 }}>
            MandiMint is configured and prepared for {selectedNetworkConfig.name}, but smart contracts
            have not been deployed to this network yet. Batch-recording and manager administration
            are disabled until an official deployment occurs.
          </p>

          <p className="mm-panel__text" style={{ lineHeight: 1.6 }}>
            To test live batch recording, grain allocations, and manager role administration, switch to <strong>MST Testnet</strong> where our verified contract is live.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
            <Button
              type="button"
              variant="primary"
              onClick={switchToMstTestnet}
            >
              Switch to MST Testnet (91562037) →
            </Button>
            <Link to="/app/batches" className="mm-btn mm-btn--outline">
              <Search size={15} /> Batch Explorer
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // If connected wallet lacks on-chain manager privileges, show clear unauthorized state
  if (!isAuthorized) {
    return (
      <div className="mm-page">
        <header className="mm-page-head">
          <div>
            <p className="mm-page-head__eyebrow">
              <Warehouse size={14} aria-hidden="true" />
              FPO Manager Workspace
            </p>
            <h1 className="mm-page-head__title">Manager Authorization Required</h1>
            <p className="mm-page-head__lead">
              Privileged management and batch-recording features require on-chain authorization.
            </p>
          </div>
        </header>

        <section
          className="mm-panel"
          style={{
            borderLeft: "4px solid var(--color-warning)",
            background: "var(--color-surface)",
          }}
        >
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1.25rem" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "var(--color-warning-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-warning)",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={24} />
            </div>

            <div>
              <div style={{ marginBottom: "0.4rem" }}>
                <StatusBadge variant="warning">Wallet Not Authorized On-Chain</StatusBadge>
              </div>
              <h2 className="mm-panel__title" style={{ fontSize: "1.35rem" }}>
                Manager Privileges Not Granted on {selectedNetworkConfig.name}
              </h2>
            </div>
          </div>

          <p className="mm-panel__text" style={{ lineHeight: 1.6 }}>
            You selected the <strong>FPO Manager</strong> role, but your connected wallet{" "}
            <code>{truncateAddress(address || "", 8, 6)}</code> has not been granted manager
            privileges on the <strong>{selectedNetworkConfig.name}</strong> MandiMint smart contract.
          </p>

          <dl className="mm-details-list" style={{ margin: "1.25rem 0", background: "var(--color-background)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
            <div>
              <dt>Connected Wallet</dt>
              <dd><code>{address || "Not connected"}</code></dd>
            </div>
            <div>
              <dt>MandiMint Contract</dt>
              <dd>
                {selectedNetworkConfig.contractAddress ? (
                  <a
                    href={`${selectedNetworkConfig.explorerUrl.replace(/\/$/, "")}/address/${selectedNetworkConfig.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--color-agricultural-green)", textDecoration: "underline", fontWeight: 600 }}
                  >
                    {selectedNetworkConfig.contractAddress} ↗
                  </a>
                ) : (
                  <span>Contract Undeployed</span>
                )}
              </dd>
            </div>
            <div>
              <dt>Authorization Method</dt>
              <dd>Contract Owner executes <code>setManager(wallet, true)</code></dd>
            </div>
          </dl>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
            <Link to="/app/batches" className="mm-btn mm-btn--primary">
              <Search size={15} /> Browse Public Batches
            </Link>
            <Link to="/onboarding" className="mm-btn mm-btn--outline">
              <UserCheck size={15} /> Switch to Farmer Workspace
            </Link>
            {isTestnet && selectedNetworkConfig.faucetUrl && (
              <a
                href={selectedNetworkConfig.faucetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mm-btn mm-btn--ghost"
              >
                <Flame size={15} /> Claim Free tMSTC
              </a>
            )}
          </div>
        </section>
      </div>
    );
  }

  // Authorized Manager Dashboard
  return (
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <p className="mm-page-head__eyebrow">
            <Warehouse size={14} aria-hidden="true" />
            Authorized FPO Manager Operations
          </p>
          <h1 className="mm-page-head__title">FPO Manager Dashboard</h1>
          <p className="mm-page-head__lead">
            Manage agricultural produce operations, submit on-chain grain aggregation batches,
            and audit farmer allocations on MST Blockchain.
          </p>
        </div>

        {/* Primary Action Button */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <Link
            to="/app/manager/record"
            className="mm-btn mm-btn--primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1.25rem" }}
          >
            <PlusCircle size={16} /> Record New Batch
          </Link>
          {isOwner && (
            <Link
              to="/app/manager/authorize"
              className="mm-btn mm-btn--outline"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            >
              <ShieldCheck size={16} /> Manager Admin
            </Link>
          )}
        </div>
      </header>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div className="mm-dashboard-stat-card">
          <span className="mm-dashboard-stat-card__label">Authorization Status</span>
          <span className="mm-dashboard-stat-card__value" style={{ fontSize: "1.25rem", color: "var(--color-success)" }}>
            {isOwner ? "Contract Owner" : "Authorized Manager"}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--color-secondary-text)" }}>
            Verified via <code>isManager</code> call
          </span>
        </div>

        <div className="mm-dashboard-stat-card">
          <span className="mm-dashboard-stat-card__label">Active Network</span>
          <span className="mm-dashboard-stat-card__value" style={{ fontSize: "1.25rem" }}>
            {networkName || "MST Testnet"}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--color-secondary-text)" }}>
            Chain ID: {selectedNetworkConfig.chainId}
          </span>
        </div>

        <div className="mm-dashboard-stat-card">
          <span className="mm-dashboard-stat-card__label">Manager Native Balance</span>
          <span className="mm-dashboard-stat-card__value">
            {balance ? `${balance} ${isTestnet ? "tMSTC" : "MSTC"}` : "…"}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--color-secondary-text)" }}>
            Available gas for batch writes
          </span>
        </div>

        <div className="mm-dashboard-stat-card">
          <span className="mm-dashboard-stat-card__label">Smart Contract</span>
          {isContractConfigured && selectedNetworkConfig.contractAddress ? (
            <>
              <span className="mm-dashboard-stat-card__value" style={{ fontSize: "1.05rem", fontFamily: "monospace" }}>
                {truncateAddress(selectedNetworkConfig.contractAddress, 8, 6)}
              </span>
              <span style={{ fontSize: "0.75rem" }}>
                <a
                  href={getExplorerAddressUrl(selectedNetworkConfig.id, selectedNetworkConfig.contractAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--color-agricultural-green)", textDecoration: "underline" }}
                >
                  Verify on MSTScan ↗
                </a>
              </span>
            </>
          ) : (
            <>
              <span className="mm-dashboard-stat-card__value" style={{ fontSize: "0.95rem", color: "#b45309" }}>
                Not deployed
              </span>
              <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                Contract not deployed on {selectedNetworkConfig.name}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        {/* Card 1: Record Batch */}
        <div
          style={{
            padding: "1.5rem",
            background: "var(--color-surface)",
            border: "1px solid var(--color-borders)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-soft-sage)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-deep-forest)",
                }}
              >
                <ClipboardPlus size={20} />
              </div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--color-primary-text)" }}>
                Record Produce Batch
              </h2>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--color-secondary-text)", lineHeight: 1.5, marginBottom: "1.25rem" }}>
              Submit a grain lot with crop variety, total weight, mandi market price,
              and tamper-evident farmer wallet allocations.
            </p>
          </div>
          <Link to="/app/manager/record" className="mm-btn mm-btn--primary" style={{ justifyContent: "center" }}>
            Open Batch Recording Form →
          </Link>
        </div>

        {/* Card 2: Batch Verification Tool */}
        <div
          style={{
            padding: "1.5rem",
            background: "var(--color-surface)",
            border: "1px solid var(--color-borders)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-soft-sage)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-deep-forest)",
                }}
              >
                <Search size={20} />
              </div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--color-primary-text)" }}>
                Verify Batch ID On-Chain
              </h2>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--color-secondary-text)", lineHeight: 1.5, marginBottom: "1rem" }}>
              Look up any recorded batch directly on the contract by its numeric ID.
            </p>

            <form onSubmit={handleLookup} style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                placeholder="e.g. 101"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                style={{
                  flex: 1,
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-borders)",
                  fontSize: "0.875rem",
                }}
              />
              <Button type="submit" variant="secondary" style={{ padding: "0.5rem 0.9rem" }}>
                Verify
              </Button>
            </form>
            {lookupError && (
              <p style={{ color: "var(--color-error)", fontSize: "0.8rem", marginTop: "0.4rem" }}>
                {lookupError}
              </p>
            )}
          </div>
          <div style={{ marginTop: "1rem" }}>
            <Link to="/app/batches" style={{ fontSize: "0.825rem", color: "var(--color-agricultural-green)", textDecoration: "underline" }}>
              Or view all verified batches in explorer →
            </Link>
          </div>
        </div>

        {/* Card 3: Manager Admin (If Owner) */}
        {isOwner && (
          <div
            style={{
              padding: "1.5rem",
              background: "var(--color-surface)",
              border: "1px solid var(--color-borders)",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-soft-sage)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-deep-forest)",
                  }}
                >
                  <ShieldCheck size={20} />
                </div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--color-primary-text)" }}>
                  Contract Administration
                </h2>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--color-secondary-text)", lineHeight: 1.5, marginBottom: "1.25rem" }}>
                As contract owner, authorize or revoke mandi manager addresses to permit
                batch recording on MST Blockchain.
              </p>
            </div>
            <Link to="/app/manager/authorize" className="mm-btn mm-btn--outline" style={{ justifyContent: "center" }}>
              Open Manager Administration →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
