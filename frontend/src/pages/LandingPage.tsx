import {
  ArrowRight,
  ClipboardList,
  Eye,
  Leaf,
  Link2,
  Shield,
  Smartphone,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { isPrivyConfigured } from "../config/env";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { StatusBadge } from "../components/ui/StatusBadge";
import "./landing.css";

export function LandingPage() {
  return (
    <>
      <section id="home" className="mm-hero mm-container" aria-labelledby="hero-title">
        <div className="mm-hero__grid">
          <div>
            <p className="mm-hero__eyebrow">
              <Leaf size={14} aria-hidden="true" />
              MST Testnet recordkeeping
            </p>
            <h1 id="hero-title" className="mm-hero__title">
              A Smarter, More Transparent Agricultural Marketplace
            </h1>
            <p className="mm-hero__lead">
              Bringing farmers and market participants closer through a simpler digital
              experience, with transparency and trust at its core. MandiMint records crop
              sale batches and farmer quantity allocations on-chain for auditable
              recordkeeping—without handling payments or storing personal data.
            </p>
            <div className="mm-hero__actions">
              <Link to="/auth" className="mm-btn mm-btn--primary">
                <Smartphone size={16} aria-hidden="true" />
                Sign in with phone
              </Link>
              <Button
                variant="outline"
                type="button"
                onClick={() =>
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Learn How It Works
              </Button>
            </div>
            <p className="mm-hero__note">
              On-chain data includes batch details, crop identifiers, quantities in whole
              kilograms, sale price in INR per metric tonne, and farmer wallet addresses only.
              A separate embedded wallet is created after phone verification.
            </p>
          </div>
          <aside className="mm-hero-visual" aria-label="Record flow overview">
            <div className="mm-hero-visual__badge">
              <StatusBadge variant="neutral">Append-only records</StatusBadge>
            </div>
            <div className="mm-hero-visual__diagram">
              <div className="mm-hero-visual__row">
                <Store className="mm-hero-visual__row-icon" size={22} aria-hidden="true" />
                <div>
                  <p className="mm-hero-visual__row-title">Authorized manager</p>
                  <p className="mm-hero-visual__row-text">
                    Records a batch with validated farmer allocations
                  </p>
                </div>
              </div>
              <div className="mm-hero-visual__row">
                <Link2 className="mm-hero-visual__row-icon" size={22} aria-hidden="true" />
                <div>
                  <p className="mm-hero-visual__row-title">On-chain batch</p>
                  <p className="mm-hero-visual__row-text">
                    Public, tamper-evident history on MST Testnet
                  </p>
                </div>
              </div>
              <div className="mm-hero-visual__row">
                <Users className="mm-hero-visual__row-icon" size={22} aria-hidden="true" />
                <div>
                  <p className="mm-hero-visual__row-title">Farmer history</p>
                  <p className="mm-hero-visual__row-text">
                    Query allocations by wallet address over time
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mm-section mm-container"
        aria-labelledby="how-title"
      >
        <header className="mm-section-header">
          <h2 id="how-title" className="mm-section-title">
            How MandiMint works
          </h2>
          <p className="mm-section-lead">
            The MVP smart contract focuses on structured, validated records. Managers submit
            batches; anyone can read batch and allocation data through the contract.
          </p>
        </header>
        <div className="mm-card-grid mm-card-grid--3">
          <Card
            icon={<ClipboardList aria-hidden="true" />}
            title="1. Record a batch"
            description="An authorized manager calls recordBatch with crop ID, total quantity (kg), price (INR/tonne), and farmer allocation arrays."
          />
          <Card
            icon={<Shield aria-hidden="true" />}
            title="2. Validation on-chain"
            description="The contract checks nonzero IDs, unique farmers, and that allocation sums match the batch total before anything is stored."
          />
          <Card
            icon={<Eye aria-hidden="true" />}
            title="3. Read & audit"
            description="Use getBatch, getBatchAllocations, and getFarmerBatches to review history. No updates or deletes—records are append-only."
          />
        </div>
      </section>

      <section id="benefits" className="mm-section mm-container" aria-labelledby="benefits-title">
        <header className="mm-section-header">
          <h2 id="benefits-title" className="mm-section-title">
            Benefits for participants
          </h2>
          <p className="mm-section-lead">
            MandiMint supports operational transparency. It does not settle payments, hold
            escrow, or verify real-world crop quality—that remains off-chain.
          </p>
        </header>
        <div className="mm-card-grid mm-card-grid--2">
          <Card title="For farmers" icon={<Leaf aria-hidden="true" />}>
            <p>
              Wallet-linked allocation history helps demonstrate participation in recorded
              batches. Addresses are public identifiers; no names or contact details are stored
              on-chain.
            </p>
          </Card>
          <Card title="For market participants" icon={<Store aria-hidden="true" />}>
            <p>
              Managers with authorization can publish consistent batch structures that others
              can independently verify against the same contract rules and events.
            </p>
          </Card>
        </div>
      </section>

      <section className="mm-section mm-container" aria-labelledby="trust-title">
        <header className="mm-section-header">
          <h2 id="trust-title" className="mm-section-title">
            Transparency and trust
          </h2>
          <p className="mm-section-lead">
            What the contract does—and does not—guarantee, per the project documentation.
          </p>
        </header>
        <Card>
          <ul className="mm-transparency-list">
            <li>
              <Shield size={18} aria-hidden="true" />
              <span>
                <strong>No fund transfers:</strong> The contract does not move tokens, hold
                escrow, or calculate settled payments.
              </span>
            </li>
            <li>
              <Eye size={18} aria-hidden="true" />
              <span>
                <strong>Public read access:</strong> Batch and allocation data is readable by
                anyone; farmer wallets are visible on the ledger.
              </span>
            </li>
            <li>
              <ClipboardList size={18} aria-hidden="true" />
              <span>
                <strong>Manager trust model:</strong> Structural validation is enforced
                on-chain; accuracy of real-world data depends on authorized managers.
              </span>
            </li>
          </ul>
        </Card>
      </section>

      <section className="mm-section mm-container">
        <div className="mm-cta-panel">
          <h2>Ready to explore MandiMint?</h2>
          <p>
            Verify your phone, then complete wallet, network, and role checks.
            Backend roles are used when configured; otherwise you can choose a clearly
            labelled local workspace role. No OTPs, wallets, or transactions are
            simulated.
          </p>
          <Link to="/auth" className="mm-btn mm-btn--secondary">
            Go to secure sign-in
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section
        id="sign-in"
        className="mm-section mm-container"
        aria-labelledby="sign-in-title"
      >
        <div className="mm-sign-in-section">
          <div className="mm-sign-in-section__icon" aria-hidden="true">
            <Wallet />
          </div>
          <h2 id="sign-in-title" className="mm-sign-in-section__title">
            Phone-first access
          </h2>
          <p className="mm-sign-in-section__lead">
            Authentication and wallet setup are separate. Confirm your phone with a
            one-time SMS code, then complete onboarding: embedded wallet, verified MST
            Testnet, and a backend-verified role when configured, or a clearly labelled
            local workspace role otherwise. Your phone number is never written to the
            blockchain.
          </p>
          <Link to="/auth" className="mm-btn mm-btn--primary mm-btn--full">
            Continue with phone
          </Link>
          {!isPrivyConfigured() && (
            <p className="mm-sign-in-section__setup">
              Privy is not configured in this environment. Set{" "}
              <code>VITE_PRIVY_APP_ID</code> and enable SMS to use real OTP sign-in.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
