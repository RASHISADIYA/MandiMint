import { Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { useLandingNavigation } from "../../hooks/useLandingNavigation";
import "./footer.css";

const FOOTER_LINKS = [
  { id: "home", label: "Home" },
  { id: "how-it-works", label: "How It Works" },
  { id: "benefits", label: "Benefits" },
] as const;

export function Footer() {
  const goToSection = useLandingNavigation();

  return (
    <footer className="mm-footer">
      <div className="mm-container">
        <div className="mm-footer__inner">
          <div className="mm-footer__brand">
            <p className="mm-footer__brand-name">
              <Sprout aria-hidden="true" width={22} height={22} />
              MandiMint
            </p>
            <p className="mm-footer__tagline">
              Append-only on-chain recordkeeping for crop sale batches and farmer
              quantity allocations on MST Testnet. No payments or personal data on-chain.
            </p>
          </div>
          <nav className="mm-footer__links" aria-label="Footer">
            {FOOTER_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                className="mm-footer__link"
                onClick={() => goToSection(link.id)}
              >
                {link.label}
              </button>
            ))}
            <Link to="/auth">Sign In</Link>
          </nav>
        </div>
        <p className="mm-footer__meta">
          MandiMint MVP — smart contract recordkeeping only; not a payment or escrow system.
        </p>
      </div>
    </footer>
  );
}
