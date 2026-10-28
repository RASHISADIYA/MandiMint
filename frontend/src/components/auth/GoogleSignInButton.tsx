import { isPrivyConfigured } from "../../config/env";
import { GoogleSignInButtonPlaceholder } from "./GoogleSignInButtonPlaceholder";
import { GoogleSignInPrivyButton } from "./GoogleSignInPrivyButton";

export interface GoogleSignInButtonProps {
  className?: string;
  showStatusBadge?: boolean;
  disabled?: boolean;
}

export function GoogleSignInButton(props: GoogleSignInButtonProps) {
  if (!isPrivyConfigured()) {
    return <GoogleSignInButtonPlaceholder {...props} />;
  }
  return <GoogleSignInPrivyButton {...props} />;
}
