import {
  ClipboardPlus,
  History,
  LayoutDashboard,
  Search,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { ROLE_LABELS } from "../../auth/roles";
import { useAuthoritativeRole } from "../../hooks/useAuthoritativeRole";
import { useWalletOnboarding } from "../../hooks/useWalletOnboarding";
import { AccountMenu } from "../account/AccountMenu";
import { ContractConfigNotice } from "../blockchain/ContractConfigNotice";
import { formatPhoneNumber } from "../../auth/phone";
import "./workspace.css";

export type WorkspaceArea = "farmer" | "manager" | "shared";

export function WorkspaceLayout({ area }: { area: WorkspaceArea }) {
  const { profile } = useWalletOnboarding();
  const roleState = useAuthoritativeRole(true);
  const role = roleState.role;

  const farmerNav = [
    { to: "/app/farmer", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/app/farmer/history", label: "My history", icon: History },
    { to: "/app/batches", label: "Find batch", icon: Search },
  ];

  const managerNav = [
    { to: "/app/manager", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/app/manager/record", label: "Record batch", icon: ClipboardPlus },
    { to: "/app/batches", label: "Find batch", icon: Search },
  ];

  const homePath = role === "fpo_admin" ? "/app/manager" : "/app/farmer";
  const sharedNav = [
    { to: homePath, label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/app/batches", label: "Find batch", icon: Search, end: true },
  ];

  const navItems =
    area === "farmer"
      ? farmerNav
      : area === "manager"
        ? managerNav
        : sharedNav;

  return (
    <div className="mm-workspace mm-container">
      <div className="mm-workspace__topline">
        <div>
          <p className="mm-workspace__eyebrow">
            {area === "manager"
              ? "FPO manager workspace"
              : area === "farmer"
                ? "Farmer workspace"
                : "Shared batch records"}
          </p>
          <p className="mm-workspace__identity">
            {formatPhoneNumber(profile?.phone ?? null) ||
              profile?.email ||
              "Signed in"}
            {role
              ? ` · ${ROLE_LABELS[role]} ${
                  roleState.source === "local" ? "(local)" : "(verified)"
                }`
              : " · Role verifying…"}
          </p>
        </div>
        <AccountMenu compact />
      </div>

      <nav className="mm-workspace-nav" aria-label="Workspace">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              ["mm-workspace-nav__link", isActive ? "mm-workspace-nav__link--active" : ""]
                .filter(Boolean)
                .join(" ")
            }
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <ContractConfigNotice />

      <Outlet />
    </div>
  );
}
