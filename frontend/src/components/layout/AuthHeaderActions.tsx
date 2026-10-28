import { usePrivy } from "@privy-io/react-auth";
import { Link } from "react-router-dom";
import { isPrivyConfigured } from "../../config/env";
import { AccountMenu } from "../account/AccountMenu";
import { Button } from "../ui/Button";

function SignedOutActions() {
  return (
    <>
      <Link to="/auth" className="mm-btn mm-btn--ghost mm-header-signin">
        Sign In
      </Link>
      <Link to="/auth" className="mm-btn mm-btn--primary mm-header-cta">
        Get Started
      </Link>
    </>
  );
}

function PrivyHeaderActions() {
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return (
      <Button variant="ghost" type="button" disabled aria-busy="true">
        Loading…
      </Button>
    );
  }

  if (!authenticated) {
    return <SignedOutActions />;
  }

  return <AccountMenu compact />;
}

export function AuthHeaderActions() {
  if (!isPrivyConfigured()) {
    return <SignedOutActions />;
  }
  return <PrivyHeaderActions />;
}

export function AuthHeaderActionsFallback() {
  return null;
}
