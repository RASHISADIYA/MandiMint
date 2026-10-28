import { ExternalLink, RefreshCw, ShieldCheck, Wallet } from "lucide-react";
import { useWalletOnboarding } from "../../hooks/useWalletOnboarding";
import { getExplorerAddressUrl } from "../../lib/blockchain/mandiMintContract";
import { truncateAddress } from "../../lib/format";
import { Button } from "../ui/Button";
import { ErrorBanner } from "../ui/ErrorBanner";
import { StatusBadge } from "../ui/StatusBadge";
import "./wallet-setup.css";

interface WalletSetupCardProps {
  title?: string;
  compact?: boolean;
}

export function WalletSetupCard({
  title = "Embedded wallet",
  compact = false,
}: WalletSetupCardProps) {
  const {
    state,
    walletAddress,
    walletError,
    networkError,
    mstChain,
    mstConfigured,
    createEmbeddedWallet,
    switchToMst,
  } = useWalletOnboarding();

  const explorerUrl = walletAddress ? getExplorerAddressUrl(walletAddress) : null;

  if (state === "session_restoring" || state === "checking_wallet") {
    return (
      <section className="mm-wallet-setup" aria-label={title}>
        <h2 className="mm-wallet-setup__title">{title}</h2>
        <StatusBadge variant="pending">Checking wallet…</StatusBadge>
      </section>
    );
  }

  if (state === "wallet_missing") {
    return (
      <section className="mm-wallet-setup" aria-label={title}>
        <div className="mm-wallet-setup__heading">
          <span className="mm-wallet-setup__icon" aria-hidden="true">
            <Wallet />
          </span>
          <div>
            <h2 className="mm-wallet-setup__title">{title} not created yet</h2>
            <p className="mm-wallet-setup__text">
              Your phone sign-in is complete. Create a Privy embedded wallet as a
              separate step—this does not send a blockchain transaction.
            </p>
          </div>
        </div>
        <Button
          type="button"
          leadingIcon={<Wallet size={16} aria-hidden="true" />}
          onClick={() => void createEmbeddedWallet()}
        >
          Create embedded wallet
        </Button>
      </section>
    );
  }

  if (state === "creating_wallet") {
    return (
      <section className="mm-wallet-setup" aria-label={title}>
        <h2 className="mm-wallet-setup__title">{title}</h2>
        <StatusBadge variant="pending">Creating embedded wallet…</StatusBadge>
        <p className="mm-wallet-setup__text">
          Privy is provisioning your wallet. Keep this tab open.
        </p>
      </section>
    );
  }

  if (state === "wallet_creation_failed") {
    return (
      <section className="mm-wallet-setup" aria-label={title}>
        <h2 className="mm-wallet-setup__title">{title}</h2>
        <ErrorBanner
          message={walletError ?? "Embedded wallet creation failed."}
          onRetry={() => void createEmbeddedWallet()}
        />
      </section>
    );
  }

  return (
    <section className="mm-wallet-setup" aria-label={title}>
      <div className="mm-wallet-setup__heading">
        <span className="mm-wallet-setup__icon" aria-hidden="true">
          <Wallet />
        </span>
        <div>
          <h2 className="mm-wallet-setup__title">{title}</h2>
          <p className="mm-wallet-setup__text">
            Managed by Privy. MandiMint never sees your private key.
          </p>
        </div>
      </div>

      <dl className="mm-wallet-setup__details">
        <div>
          <dt>Address</dt>
          <dd>
            <code>{walletAddress ? truncateAddress(walletAddress, 10, 8) : "—"}</code>
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="mm-wallet-setup__link"
              >
                Explorer <ExternalLink size={12} aria-hidden="true" />
              </a>
            )}
          </dd>
        </div>
        <div>
          <dt>Network</dt>
          <dd>
            {mstChain
              ? `${mstChain.name} · chain ${mstChain.id}`
              : "MST Testnet not configured"}
          </dd>
        </div>
      </dl>

      {state === "wallet_ready" && (
        <StatusBadge variant="success">
          <ShieldCheck size={14} aria-hidden="true" />
          Wallet ready on MST Testnet
        </StatusBadge>
      )}

      {state === "network_unconfigured" && (
        <ErrorBanner
          message="Your embedded wallet exists, but MST Testnet env vars are missing. Reads and writes stay disabled until the official chain ID and RPC are configured."
        />
      )}

      {state === "network_switch_failed" && (
        <ErrorBanner
          message={networkError ?? "Could not switch the wallet to MST Testnet."}
          onRetry={() => void switchToMst()}
          retryLabel="Retry switch"
        />
      )}

      {!mstConfigured && (
        <p className="mm-wallet-setup__note">
          Set <code>VITE_MST_TESTNET_CHAIN_ID</code> and{" "}
          <code>VITE_MST_TESTNET_RPC_URL</code> to the official MST Testnet values.
          No fallback network is used.
        </p>
      )}

      {compact ? null : (
        <div className="mm-wallet-setup__actions">
          {state === "network_switch_failed" && (
            <Button
              type="button"
              variant="outline"
              leadingIcon={<RefreshCw size={16} aria-hidden="true" />}
              onClick={() => void switchToMst()}
            >
              Switch network
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
