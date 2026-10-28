import { Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import "./logo.css";

export function Logo() {
  return (
    <Link to="/" className="mm-logo" aria-label="MandiMint home">
      <span className="mm-logo__icon" aria-hidden="true">
        <Sprout />
      </span>
      <span>MandiMint</span>
    </Link>
  );
}
