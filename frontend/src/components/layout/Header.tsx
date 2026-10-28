import { Menu, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLandingNavigation } from "../../hooks/useLandingNavigation";
import { AuthHeaderActions } from "./AuthHeaderActions";
import { Logo } from "./Logo";
import "./header.css";

const NAV_LINKS = [
  { id: "home", label: "Home" },
  { id: "how-it-works", label: "How It Works" },
  { id: "benefits", label: "Benefits" },
] as const;

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const goToSection = useLandingNavigation();
  const isLanding = location.pathname === "/";

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const handleSectionClick = useCallback(
    (sectionId: string) => {
      goToSection(sectionId);
      closeMobile();
    },
    [closeMobile, goToSection],
  );

  return (
    <header className={["mm-header", isLanding ? "" : "mm-header--inner"]
      .filter(Boolean)
      .join(" ")}>
      <div className="mm-container mm-header__inner">
        <Logo />
        {isLanding && (
          <nav className="mm-nav" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                className="mm-nav__link"
                type="button"
                onClick={() => handleSectionClick(link.id)}
              >
                {link.label}
              </button>
            ))}
            <Link className="mm-nav__link" to="/auth">
              Sign In
            </Link>
          </nav>
        )}
        <div
          className={[
            "mm-header__actions",
            isLanding ? "" : "mm-header__actions--always",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <AuthHeaderActions />
        </div>
        {isLanding && (
          <button
            type="button"
            className="mm-menu-toggle"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span className="visually-hidden">
              {mobileOpen ? "Close menu" : "Open menu"}
            </span>
            {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        )}
      </div>
      {isLanding && (
        <nav
          id="mobile-nav"
          className={["mm-mobile-nav", mobileOpen ? "mm-mobile-nav--open" : ""]
            .filter(Boolean)
            .join(" ")}
          aria-label="Mobile"
          aria-hidden={!mobileOpen}
        >
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              className="mm-mobile-nav__link"
              type="button"
              onClick={() => handleSectionClick(link.id)}
            >
              {link.label}
            </button>
          ))}
          <Link
            className="mm-mobile-nav__link"
            to="/auth"
            onClick={closeMobile}
          >
            Sign In
          </Link>
          <div className="mm-mobile-nav__cta">
            <Link to="/auth" className="mm-btn mm-btn--secondary mm-btn--full">
              Get Started
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
