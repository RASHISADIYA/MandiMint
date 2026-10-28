import { ChevronDown, LogOut, Network, UserRound, Wallet } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLE_LABELS } from "../../auth/roles";
import { formatPhoneNumber, maskPhoneNumber } from "../../auth/phone";
import { usePostLoginOnboarding } from "../../hooks/usePostLoginOnboarding";
import { truncateAddress } from "../../lib/format";
import { clearClientRoleHints } from "../../services/role/userRoleService";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";
import "./account-menu.css";

interface AccountMenuProps {
  compact?: boolean;
}

export function AccountMenu({ compact = false }: AccountMenuProps) {
  const menuId = useId();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const {
    ready,
    authenticated,
    profile,
    displayName,
    walletAddress,
    role,
    roleStatus,
    roleSource,
    canSelectLocalRole,
    networkVerification,
    mstChain,
    logout,
    resetRole,
    phase,
  } = usePostLoginOnboarding();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [close, open]);

  const handleLogout = useCallback(async () => {
    close();
    resetRole();
    clearClientRoleHints();
    await logout();
    navigate("/", { replace: true });
  }, [close, logout, navigate, resetRole]);

  const handleChangeLocalRole = useCallback(() => {
    close();
    clearClientRoleHints();
    resetRole();
    navigate("/onboarding", { replace: true });
  }, [close, navigate, resetRole]);

  if (!ready) {
    return (
      <Button variant="ghost" type="button" disabled aria-busy="true">
        Account
      </Button>
    );
  }

  if (!authenticated) {
    return null;
  }

  const networkLabel =
    networkVerification.status === "connected" && mstChain
      ? `${mstChain.name} verified`
      : networkVerification.status === "unconfigured"
        ? "MST not configured"
        : "Network pending";

  const accountLabel =
    displayName ??
    formatPhoneNumber(profile?.phone ?? null) ??
    profile?.email ??
    "Account";

  return (
    <div className="mm-account-menu">
      <button
        ref={buttonRef}
        type="button"
        className="mm-account-menu__trigger"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <UserRound size={16} aria-hidden="true" />
        <span className="mm-account-menu__label">
          {compact ? maskPhoneNumber(profile?.phone ?? null) : accountLabel}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={panelRef}
          id={menuId}
          role="menu"
          className="mm-account-menu__panel"
          aria-label="Account menu"
        >
          <div className="mm-account-menu__section">
            <p className="mm-account-menu__name">{accountLabel}</p>
            {roleStatus === "verified" && role && (
              <StatusBadge
                variant={roleSource === "local" ? "warning" : "success"}
              >
                {ROLE_LABELS[role]}
                {roleSource === "local" ? " · local" : ""}
              </StatusBadge>
            )}
            {roleStatus === "unassigned" && (
              <StatusBadge variant="warning">
                {canSelectLocalRole ? "Choose local role" : "Role pending"}
              </StatusBadge>
            )}
          </div>

          <div className="mm-account-menu__row" role="none">
            <Wallet size={14} aria-hidden="true" />
            <span>
              {walletAddress
                ? truncateAddress(walletAddress, 6, 4)
                : "Wallet not ready"}
            </span>
          </div>

          <div className="mm-account-menu__row" role="none">
            <Network size={14} aria-hidden="true" />
            <span>{networkLabel}</span>
          </div>

          <p className="mm-account-menu__status">
            Setup: {phase.replaceAll("_", " ")}
          </p>

          {roleSource === "local" && (
            <Button
              type="button"
              variant="ghost"
              role="menuitem"
              leadingIcon={<UserRound size={14} aria-hidden="true" />}
              onClick={handleChangeLocalRole}
            >
              Change local role
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            role="menuitem"
            className="mm-account-menu__logout"
            leadingIcon={<LogOut size={14} aria-hidden="true" />}
            onClick={() => void handleLogout()}
          >
            Log out
          </Button>
        </div>
      )}
    </div>
  );
}
