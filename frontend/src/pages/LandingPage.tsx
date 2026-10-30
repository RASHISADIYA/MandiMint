import {
  ArrowRight,
  ClipboardList,
  ExternalLink,
  Eye,
  Flame,
  Globe,
  Layers,
  Leaf,
  Link2,
  Shield,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ConnectWalletButton } from "../components/wallet/ConnectWalletButton";
import { useWeb3Wallet, MST_NETWORKS } from "../providers/Web3WalletContext";
import { useAuthoritativeRole } from "../hooks/useAuthoritativeRole";
import "./landing.css";

export function LandingPage() {
  const { connected } = useWeb3Wallet();
  const { role } = useAuthoritativeRole(connected);

  const dashboardTarget = role === "farmer"
    ? "/app/farmer"
    : role === "fpo_admin"
    ? "/app/manager"
    : "/onboarding";

  return (
    <>
      {/* Hero Section */}
      <section id="home" className="mm-hero mm-container" aria-labelledby="hero-title">
        <div className="mm-hero__grid">
          <div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              <span className="mm-tag mm-tag--gold" style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}>
                🏆 MST Buildathon 2.0 Project
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  background: "var(--color-success-bg)",
                  color: "var(--color-success)",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "4px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <span className="mm-status-dot mm-status-dot--green" />
                Live on MST Testnet (91562037)
              </span>
            </div>

            <h1 id="hero-title" className="mm-hero__title" style={{ lineHeight: 1.15 }}>
              Traceable crop batches, verified farmer allocations
            </h1>

            <p className="mm-hero__lead">
              MandiMint provides an auditable, append-only recordkeeping system for agricultural
              produce market committees (mandis) and Farmer Producer Organizations (FPOs) on the
              high-performance <strong>MST Blockchain</strong>.
            </p>

            {/* Single Clear Entry Point */}
            <div className="mm-hero__actions" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              {connected ? (
                <Link to={dashboardTarget} className="mm-btn mm-btn--primary" style={{ padding: "0.65rem 1.25rem" }}>
                  Go to {role ? (role === "farmer" ? "Farmer Dashboard" : "FPO Dashboard") : "Role Selection"} <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ) : (
                <ConnectWalletButton variant="primary" />
              )}
              <Link to="/app/batches" className="mm-btn mm-btn--outline" style={{ padding: "0.65rem 1rem" }}>
                <Layers size={16} /> Batch Explorer
              </Link>
            </div>

            <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem 1rem", alignItems: "center", fontSize: "0.8rem", color: "#64748b" }}>
              <span>
                Verified Contract:{" "}
                <a
                  href="https://testnet.mstscan.com/address/0x06289D9c452369abcb9bc1b5D6Adf80982C5679C"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#059669", fontWeight: 600, textDecoration: "underline" }}
                >
                  0x06289D...5679C
                </a>
              </span>
              <span className="mm-hide-mobile">·</span>
              <a
                href={MST_NETWORKS.testnet.faucetUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#ea580c", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}
              >
                <Flame size={13} /> Claim Free tMSTC
              </a>
            </div>
          </div>

          {/* Visual Hero Panel with Agricultural Image & Translucent Treatment */}
          <aside
            className="mm-hero-visual"
            style={{
              backgroundImage: `linear-gradient(rgba(247, 246, 239, 0.88), rgba(247, 246, 239, 0.94)), url('/agriculture_hero.jpg')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: "1px solid var(--color-borders)",
              boxShadow: "0 8px 30px rgba(33, 78, 52, 0.08)",
            }}
            aria-label="Record flow overview"
          >
            <div className="mm-hero-visual__badge">
              <StatusBadge variant="success">MST Blockchain Native</StatusBadge>
            </div>
            <div className="mm-hero-visual__diagram">
              <div className="mm-hero-visual__row">
                <Store className="mm-hero-visual__row-icon" size={22} aria-hidden="true" />
                <div>
                  <p className="mm-hero-visual__row-title">Authorized FPO Manager</p>
                  <p className="mm-hero-visual__row-text">
                    Signs sale batch with strict whole-kg farmer allocation conservation
                  </p>
                </div>
              </div>
              <div className="mm-hero-visual__row">
                <Link2 className="mm-hero-visual__row-icon" size={22} aria-hidden="true" />
                <div>
                  <p className="mm-hero-visual__row-title">MST Blockchain Smart Contract</p>
                  <p className="mm-hero-visual__row-text">
                    Permanent cryptographic timestamp and immutable proof of delivery
                  </p>
                </div>
              </div>
              <div className="mm-hero-visual__row">
                <Users className="mm-hero-visual__row-icon" size={22} aria-hidden="true" />
                <div>
                  <p className="mm-hero-visual__row-title">Farmer &amp; Public Transparency</p>
                  <p className="mm-hero-visual__row-text">
                    Instant auditability on MSTScan without storing PII on-chain
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* MST Buildathon 2.0 Verification Hub */}
      <section className="mm-section mm-container" style={{ paddingTop: "1rem" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
            color: "#ffffff",
            borderRadius: "16px",
            padding: "clamp(1.25rem, 4vw, 2rem)",
            boxShadow: "0 20px 40px rgba(6, 78, 59, 0.25)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <span
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "#fef08a",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.25rem 0.6rem",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Mandatory Track Requirements
              </span>
              <h2 style={{ margin: "0.5rem 0 0.25rem 0", fontSize: "1.75rem", color: "#ffffff", fontWeight: 800 }}>
                MST Buildathon Verification Hub
              </h2>
              <p style={{ margin: 0, color: "#a7f3d0", fontSize: "0.95rem", maxWidth: "600px" }}>
                Everything evaluators and judges need to independently inspect, test, and verify
                MandiMint on the MST Blockchain network.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <a
                href="https://testnet.mstscan.com/address/0x06289D9c452369abcb9bc1b5D6Adf80982C5679C"
                target="_blank"
                rel="noopener noreferrer"
                className="mm-btn"
                style={{ background: "#ffffff", color: "#064e3b", fontWeight: 700, fontSize: "0.85rem" }}
              >
                <Globe size={15} /> MSTScan Contract <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* 4 Track Requirement Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
              gap: "1rem",
              marginTop: "1.5rem",
            }}
          >
            <div style={{ background: "rgba(255, 255, 255, 0.1)", borderRadius: "10px", padding: "1.25rem" }}>
              <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.8rem", color: "#6ee7b7", fontWeight: 700 }}>
                1. MEANINGFUL MST USAGE
              </p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#f0fdf4" }}>
                Full agricultural batch traceability with on-chain equality constraints:
                <code>∑(quantities) == totalQuantityKg</code>.
              </p>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.1)", borderRadius: "10px", padding: "1.25rem" }}>
              <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.8rem", color: "#6ee7b7", fontWeight: 700 }}>
                2. TESTNET + MAINNET READY
              </p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#f0fdf4" }}>
                Deployed on MST Testnet (Chain ID 91562037). Mainnet deployment script and configs baked in.
              </p>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.1)", borderRadius: "10px", padding: "1.25rem" }}>
              <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.8rem", color: "#6ee7b7", fontWeight: 700 }}>
                3. WEB3 WALLET INTEGRATION
              </p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#f0fdf4" }}>
                BridgeKey, MetaMask, and standard EIP-1193 wallets supported for 1-click connect, network verification, and transaction signing.
              </p>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.1)", borderRadius: "10px", padding: "1.25rem" }}>
              <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.8rem", color: "#6ee7b7", fontWeight: 700 }}>
                4. AUDITABLE ALLOCATIONS
              </p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#f0fdf4" }}>
                Smart contract enforces strict whole-kg conservation: sum of farmer allocations must equal total batch weight before confirmation.
              </p>
            </div>
          </div>

          {/* On-Chain Protocol Verification & Status */}
          <div style={{ marginTop: "1.5rem", background: "rgba(0, 0, 0, 0.2)", borderRadius: "10px", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#6ee7b7" }}>
                LIVE BLOCKCHAIN PROTOCOL DEPLOYMENT:
              </p>
              <span style={{ fontSize: "0.75rem", color: "#a7f3d0" }}>
                MST Testnet · Chain #91562037 · Verified Smart Contract
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "1rem", marginTop: "0.5rem" }}>
              <div style={{ background: "rgba(255, 255, 255, 0.06)", padding: "0.75rem 1rem", borderRadius: "8px" }}>
                <span style={{ display: "block", fontSize: "0.75rem", color: "#a7f3d0" }}>Contract Address</span>
                <code style={{ fontSize: "0.8rem", color: "#ffffff", wordBreak: "break-all" }}>
                  0x06289D9c452369abcb9bc1b5D6Adf80982C5679C
                </code>
              </div>
              <div style={{ background: "rgba(255, 255, 255, 0.06)", padding: "0.75rem 1rem", borderRadius: "8px" }}>
                <span style={{ display: "block", fontSize: "0.75rem", color: "#a7f3d0" }}>On-Chain Verification</span>
                <span style={{ fontSize: "0.85rem", color: "#ffffff", fontWeight: 600 }}>
                  Append-Only &amp; Zero Offline Mock Records
                </span>
              </div>
            </div>
            <div style={{ marginTop: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "#d1fae5", flexWrap: "wrap", gap: "0.5rem" }}>
              <span>Batches and farmer distributions are audited directly on the MST Testnet blockchain.</span>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <a
                  href="https://testnet.mstscan.com/address/0x06289D9c452369abcb9bc1b5D6Adf80982C5679C"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#6ee7b7", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                >
                  Verify on MSTScan ↗
                </a>
                <Link to="/app/batches" style={{ color: "#fef08a", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                  Open Batch Explorer →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="mm-section mm-container" aria-labelledby="how-title">
        <header className="mm-section-header">
          <h2 id="how-title" className="mm-section-title">
            How MandiMint works
          </h2>
          <p className="mm-section-lead">
            Structured, validated on-chain recordkeeping. Authorized managers submit
            batches; anyone can audit farmer allocations through the smart contract.
          </p>
        </header>
        <div className="mm-card-grid mm-card-grid--3">
          <Card
            icon={<ClipboardList aria-hidden="true" />}
            title="Step 1: Record Batch"
            description="An authorized manager calls recordBatch with commodity ID, total quantity (kg), sale price (INR/tonne), and individual farmer allocations."
          />
          <Card
            icon={<Shield aria-hidden="true" />}
            title="Step 2: On-Chain Constraints"
            description="The contract validates nonzero values, duplicate farmer prevention, and mathematically enforces that farmer allocation quantities sum exactly to the total batch weight."
          />
          <Card
            icon={<Eye aria-hidden="true" />}
            title="Step 3: Public Ledger Audit"
            description="Query getBatch, getBatchAllocations, or getFarmerBatches anytime. Records are append-only, tamper-evident, and open to farmers and financial institutions."
          />
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="mm-section mm-container" aria-labelledby="benefits-title">
        <header className="mm-section-header">
          <h2 id="benefits-title" className="mm-section-title">
            Real-World Impact for Indian Agriculture
          </h2>
          <p className="mm-section-lead">
            Eliminating reconciliation disputes between FPOs, APMC Mandis, and smallholder farmers.
          </p>
        </header>
        <div className="mm-card-grid mm-card-grid--3">
          <Card title="For Smallholder Farmers" icon={<Leaf aria-hidden="true" />}>
            <p>
              Wallet-linked verifiable proof of harvest delivery helps build digital credit
              profiles for agricultural loans, crop insurance claims, and government subsidy verification.
            </p>
          </Card>
          <Card title="For FPOs &amp; Mandi Traders" icon={<Store aria-hidden="true" />}>
            <p>
              Eliminates paper slip manipulation. Transparent aggregation gives buyers full
              traceability back to individual farmer lots without revealing sensitive private identity data.
            </p>
          </Card>
          <Card title="MST Blockchain Advantages" icon={<Sparkles aria-hidden="true" />}>
            <p>
              Ultra-fast block confirmation times, negligible gas fees paid in MSTC, and high
              throughput make MST Blockchain the ideal EVM layer for high-volume agri-commodity recordkeeping.
            </p>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="mm-section mm-container">
        <div className="mm-cta-panel">
          <h2>Experience MandiMint on MST Blockchain</h2>
          <p>
            Connect your wallet to record crop batches, or explore existing
            verified batches on the MST Testnet blockchain explorer.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginTop: "1rem" }}>
            <Link to="/app" className="mm-btn mm-btn--primary">
              Launch App Workspace <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link to="/app/batches" className="mm-btn mm-btn--secondary">
              Browse Batch Explorer
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
