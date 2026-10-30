import {
  ExternalLink,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ZeroAddress } from "ethers";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StatusBadge } from "../../components/ui/StatusBadge";
import {
  updateManagerStatus,
  readOwner,
  readManagerStatus,
} from "../../lib/blockchain/mandiMintContract";
import { useWalletOnboarding } from "../../hooks/useWalletOnboarding";
import { useWeb3Wallet } from "../../providers/Web3WalletContext";
import { parseAddress, truncateAddress } from "../../lib/format";

export function ManagerAuthorizationPage() {
  const { walletAddress, embeddedWallet } = useWalletOnboarding();
  const web3 = useWeb3Wallet();

  const activeAddress = web3.connected ? web3.address : walletAddress;
  const activeSigner = web3.connected ? web3.signer : embeddedWallet;

  const [owner, setOwner] = useState<string | null>(null);
  const [targetAddress, setTargetAddress] = useState("");
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [targetAddressError, setTargetAddressError] = useState<string | null>(null);
  const [checkedStatus, setCheckedStatus] = useState<boolean | null>(null);
  const [actionResult, setActionResult] = useState<{
    status: "idle" | "success" | "error";
    message: string;
    hash: string | null;
  } | null>(null);

  const loadOwner = useCallback(async () => {
    try {
      const ownerAddress = await readOwner(web3.selectedNetwork);
      setOwner(ownerAddress);
    } catch {
      setOwner(
        web3.isTestnet ? "0xEDe9ca4BfA8e06A1fB832F2F19686b329863CEF0" : null,
      );
    }
  }, [web3.selectedNetwork, web3.isTestnet]);

  useEffect(() => {
    loadOwner();
  }, [loadOwner]);

  const isOwner =
    Boolean(activeAddress) &&
    Boolean(owner) &&
    activeAddress?.toLowerCase() === owner?.toLowerCase();

  const handleCheckAddress = useCallback(async () => {
    const parsed = parseAddress(targetAddress);
    if (!parsed) {
      setTargetAddressError("Enter a valid 40-hex EVM address.");
      return;
    }
    setTargetAddressError(null);
    try {
      const status = await readManagerStatus(parsed, web3.selectedNetwork);
      setCheckedStatus(status);
    } catch {
      setCheckedStatus(null);
    }
  }, [targetAddress, web3.selectedNetwork]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setTargetAddressError(null);
      setActionResult(null);

      if (!activeSigner) {
        setTargetAddressError("Connect your wallet before submitting.");
        return;
      }

      if (!web3.isContractConfigured) {
        setTargetAddressError(
          `MandiMint smart contract is not deployed on ${web3.selectedNetworkConfig.name}. Switch to MST Testnet to administer managers.`,
        );
        return;
      }

      if (web3.isNetworkMismatch) {
        setTargetAddressError(
          `Wallet chain #${web3.chainId} does not match ${web3.selectedNetworkConfig.name} (#${web3.selectedNetworkConfig.chainId}). Switch your wallet network.`,
        );
        return;
      }

      if (!isOwner) {
        setTargetAddressError(
          `Connected wallet ${truncateAddress(activeAddress ?? "", 6, 4)} is not the contract owner (${truncateAddress(owner ?? "", 6, 4)}). Only the contract owner can authorize new managers.`,
        );
        return;
      }

      const normalized = parseAddress(targetAddress);
      if (!normalized) {
        setTargetAddressError("Enter a valid EVM wallet address.");
        return;
      }
      if (normalized.toLowerCase() === ZeroAddress.toLowerCase()) {
        setTargetAddressError("The zero address cannot be used for a manager.");
        return;
      }

      setIsAuthorizing(true);
      try {
        const response = await updateManagerStatus(
          activeSigner,
          normalized,
          true,
          web3.selectedNetwork,
        );
        const receipt = await response.wait();
        setActionResult({
          status: "success",
          message: `Wallet ${truncateAddress(normalized)} is now successfully authorized as an on-chain manager! (Confirmed in block ${receipt?.blockNumber})`,
          hash: response.hash,
        });
        setTargetAddress("");
        setCheckedStatus(true);
      } catch (err) {
        setActionResult({
          status: "error",
          message:
            err instanceof Error ? err.message : "Manager authorization failed.",
          hash: null,
        });
      } finally {
        setIsAuthorizing(false);
      }
    },
    [activeSigner, isOwner, targetAddress, activeAddress, owner, web3],
  );

  return (
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <p className="mm-page-head__eyebrow">
            <ShieldCheck size={14} aria-hidden="true" />
            Governance &amp; Permissions
          </p>
          <h1 className="mm-page-head__title">Manager Authorization</h1>
          <p className="mm-page-head__lead">
            The MandiMint smart contract owner can authorize or revoke batch managers.
            Authorized managers can submit verified crop sale batches on-chain.
          </p>
        </div>
      </header>

      {/* Contract & Owner Status Card */}
      <section className="mm-panel">
        <div className="mm-panel__head">
          <div>
            <p className="mm-panel__eyebrow">On-Chain Governance</p>
            <h2 className="mm-panel__title">Contract Ownership</h2>
          </div>
          <StatusBadge variant={isOwner ? "success" : "neutral"}>
            {isOwner ? "Owner Connected" : "View Only"}
          </StatusBadge>
        </div>

        <dl className="mm-details-list">
          <div>
            <dt>Contract Address</dt>
            <dd>
              <a
                href="https://testnet.mstscan.com/address/0x06289D9c452369abcb9bc1b5D6Adf80982C5679C"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#059669", fontFamily: "monospace" }}
              >
                0x06289D9c452369abcb9bc1b5D6Adf80982C5679C <ExternalLink size={12} style={{ display: "inline" }} />
              </a>
            </dd>
          </div>
          <div>
            <dt>Contract Owner</dt>
            <dd>
              <code style={{ color: "#1e293b", fontWeight: 600 }}>
                {owner ?? "Loading on-chain owner…"}
              </code>
            </dd>
          </div>
          <div>
            <dt>Your Connected Wallet</dt>
            <dd>
              {activeAddress ? (
                <code>{activeAddress}</code>
              ) : (
                <span style={{ color: "#9ca3af" }}>No wallet connected</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {/* Authorization Form */}
      <section className="mm-panel">
        <div className="mm-panel__head">
          <div>
            <p className="mm-panel__eyebrow">Grant Manager Permission</p>
            <h2 className="mm-panel__title">Authorize New Manager</h2>
          </div>
          <UserPlus size={20} className="mm-panel__icon" />
        </div>

        {actionResult && (
          <div
            style={{
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              background: actionResult.status === "success" ? "#f0fdf4" : "#fef2f2",
              border: actionResult.status === "success" ? "1px solid #86efac" : "1px solid #fca5a5",
              color: actionResult.status === "success" ? "#166534" : "#991b1b",
            }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>{actionResult.message}</p>
            {actionResult.hash && (
              <a
                href={`https://testnet.mstscan.com/tx/${actionResult.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", marginTop: "0.5rem", color: "#059669" }}
              >
                View Transaction on MSTScan <ExternalLink size={13} />
              </a>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
              <Input
                label="Manager EVM Wallet Address"
                placeholder="0x..."
                value={targetAddress}
                onChange={(e) => {
                  setTargetAddress(e.target.value);
                  setCheckedStatus(null);
                  setTargetAddressError(null);
                }}
                error={targetAddressError ?? undefined}
                hint="Enter the 40-hex wallet address you want to authorize as an FPO manager."
                required
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleCheckAddress}
              style={{ marginBottom: targetAddressError ? "1.5rem" : "0" }}
            >
              Check Status
            </Button>
          </div>

          {checkedStatus !== null && (
            <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: checkedStatus ? "#059669" : "#d97706" }}>
              {checkedStatus
                ? "✓ This wallet is already an authorized manager."
                : "○ This wallet is currently NOT authorized."}
            </p>
          )}

          <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <Button
              type="submit"
              variant="primary"
              disabled={isAuthorizing || !activeSigner}
              leadingIcon={<UserPlus size={16} />}
            >
              {isAuthorizing ? "Authorizing on MST Chain…" : "Authorize Manager On-Chain"}
            </Button>

            {!isOwner && (
              <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                (Transaction requires owner wallet signature)
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Terminal Command Helper for CLI Evaluation */}
      <section className="mm-panel" style={{ background: "#f8fafc" }}>
        <div className="mm-panel__head">
          <div>
            <p className="mm-panel__eyebrow">Terminal Administration</p>
            <h2 className="mm-panel__title">Authorize via Hardhat CLI</h2>
          </div>
        </div>
        <p className="mm-panel__text">
          If you have the deployer private key in your environment, you can also authorize
          any wallet directly from the command line:
        </p>
        <pre
          style={{
            background: "#1e293b",
            color: "#38bdf8",
            padding: "0.85rem 1rem",
            borderRadius: "8px",
            fontSize: "0.85rem",
            overflowX: "auto",
          }}
        >
          MANAGER_ADDRESS=0x... npm run authorize:manager
        </pre>
      </section>
    </div>
  );
}