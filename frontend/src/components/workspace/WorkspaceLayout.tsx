import {
  ClipboardPlus,
  History,
  LayoutDashboard,
  Search,
  ShieldCheck,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuthoritativeRole } from "../../hooks/useAuthoritativeRole";
import { useWeb3Wallet } from "../../providers/Web3WalletContext";
import { ConnectWalletButton } from "../wallet/ConnectWalletButton";
import { NetworkSelector } from "../network/NetworkSelector";
import { NetworkMismatchBanner } from "../network/NetworkMismatchBanner";
import { truncateAddress } from "../../lib/format";
import "./workspace.css";

export type WorkspaceArea = "farmer" | "manager" | "shared";

export function WorkspaceLayout({ area = "shared" }: { area?: WorkspaceArea }) {
  void area;
  const web3 = useWeb3Wallet();
  const { role } = useAuthoritativeRole(web3.connected);

  // Dynamic role-appropriate navigation
  const navItems = role === "farmer"
    ? [
        { to: "/app/farmer", label: "Farmer Dashboard", icon: LayoutDashboard, end: true },
        { to: "/app/farmer/history", label: "My Produce Allocations", icon: History },
        { to: "/app/batches", label: "Batch Explorer", icon: Search },
      ]
    : role === "fpo_admin"
    ? [
        { to: "/app/manager", label: "Manager Dashboard", icon: LayoutDashboard, end: true },
        { to: "/app/manager/record", label: "Record Batch", icon: ClipboardPlus },
        { to: "/app/batches", label: "Batch Explorer", icon: Search },
        ...(web3.isOwner
          ? [{ to: "/app/manager/authorize", label: "Manager Admin", icon: ShieldCheck }]
          : []),
      ]
    : [
        { to: "/app/batches", label: "Batch Explorer", icon: Search },
      ];

  return (
    <div className="mm-workspace mm-container">
      <div className="mm-workspace__topline">
        <div>
          <p className="mm-workspace__eyebrow">
            MandiMint · Agricultural Batch Traceability on MST Blockchain
          </p>
          <p className="mm-workspace__identity">
            {web3.connected ? (
              <>
                <span className="mm-identity__source">
                  Connected Account:
                </span>{" "}
                <code>{truncateAddress(web3.address!, 8, 6)}</code>

                {/* Role Pill */}
                {role && (
                  <span
                    className="mm-role-pill"
                    style={{
                      marginLeft: "0.5rem",
                      background: "var(--color-soft-sage)",
                      color: "var(--color-deep-forest)",
                      fontWeight: 600,
                    }}
                  >
                    {role === "farmer" ? "🌾 Farmer" : "🏢 FPO Manager"}
                  </span>
                )}

                {/* On-Chain Privileges Pill */}
                {web3.isOwner ? (
                  <span className="mm-role-pill mm-role-pill--owner" style={{ marginLeft: "0.5rem" }}>
                    Contract Owner
                  </span>
                ) : web3.isManager ? (
                  <span className="mm-role-pill mm-role-pill--manager" style={{ marginLeft: "0.5rem" }}>
                    Authorized On-Chain Manager
                  </span>
                ) : role === "fpo_admin" ? (
                  <span
                    className="mm-role-pill"
                    style={{
                      marginLeft: "0.5rem",
                      background: "var(--color-warning-bg)",
                      color: "var(--color-warning)",
                    }}
                  >
                    Unauthorized On-Chain
                  </span>
                ) : null}
              </>
            ) : (
              <span style={{ color: "var(--color-secondary-text)" }}>
                Public Explorer Mode · Connect your wallet to access your dashboard
              </span>
            )}
          </p>
        </div>

        {/* Dual-Network Selector & Single Consolidated Wallet Entry Point */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <NetworkSelector />
          <ConnectWalletButton />
        </div>
      </div>

      {/* Network Mismatch Warning Banner */}
      <NetworkMismatchBanner />

      {/* Role-Appropriate Navigation */}
      <nav className="mm-workspace-nav" aria-label="Workspace navigation">
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
            <Icon aria-hidden="true" size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
