import { ArrowRight, History, Search, Wallet } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { Input } from "../../components/ui/Input";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { WalletSetupCard } from "../../components/wallet/WalletSetupCard";
import { useFarmerHistory } from "../../hooks/useMandiMintReads";
import { useAuthoritativeRole } from "../../hooks/useAuthoritativeRole";
import { useWalletOnboarding } from "../../hooks/useWalletOnboarding";
import {
  formatQuantityKg,
  parseAddress,
  truncateAddress,
} from "../../lib/format";

export function FarmerHistoryPage() {
  const { walletAddress, state: walletState } = useWalletOnboarding();
  const { role } = useAuthoritativeRole(true);
  const [addressInput, setAddressInput] = useState("");
  const [queriedAddress, setQueriedAddress] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const history = useFarmerHistory(queriedAddress);

  useEffect(() => {
    if (walletAddress && queriedAddress === null && addressInput === "") {
      setAddressInput(walletAddress);
      setQueriedAddress(walletAddress);
    }
  }, [walletAddress, queriedAddress, addressInput]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const parsed = parseAddress(addressInput);
      if (!parsed) {
        setInputError("Enter a valid EVM wallet address.");
        return;
      }

      setInputError(null);
      setQueriedAddress(parsed);
    },
    [addressInput],
  );

  const useMyWallet = useCallback(() => {
    if (!walletAddress) {
      return;
    }
    setAddressInput(walletAddress);
    setInputError(null);
    setQueriedAddress(walletAddress);
  }, [walletAddress]);

  const totalKg =
    history.data?.reduce((sum, row) => sum + row.quantityKg, 0n) ?? 0n;

  return (
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <p className="mm-page-head__eyebrow">
            <History size={14} aria-hidden="true" />
            Allocation history
          </p>
          <h1 className="mm-page-head__title">
            {role === "farmer" ? "Your recorded crop allocations" : "Farmer history"}
          </h1>
          <p className="mm-page-head__lead">
            Read every batch linked to a wallet address, with the allocated quantity
            in whole kilograms. Only wallet addresses are public on-chain.
          </p>
        </div>
      </header>

      {walletState !== "wallet_ready" && (
        <>
          <WalletSetupCard title="Your wallet" />
          <p className="mm-panel__note">
            You can still query any public wallet address below. Create your own
            wallet to use the one-click “Use my wallet” action.
          </p>
        </>
      )}

      <section className="mm-panel">
        <div className="mm-panel__head">
          <div>
            <p className="mm-panel__eyebrow">Wallet lookup</p>
            <h2 className="mm-panel__title">Select a farmer wallet</h2>
          </div>
          <Wallet aria-hidden="true" className="mm-panel__icon" />
        </div>

        <form onSubmit={handleSubmit} className="mm-address-form">
          <Input
            label="Farmer wallet address"
            placeholder="0x…"
            className="mm-mono-input"
            value={addressInput}
            onChange={(event) => {
              setAddressInput(event.target.value);
              setInputError(null);
            }}
            error={inputError ?? undefined}
            required
          />
          <div className="mm-button-row">
            <Button
              type="submit"
              leadingIcon={<Search size={16} aria-hidden="true" />}
            >
              Load history
            </Button>
            {walletAddress && (
              <Button type="button" variant="outline" onClick={useMyWallet}>
                Use my wallet
              </Button>
            )}
          </div>
        </form>

        {walletAddress && addressInput !== walletAddress && (
          <p className="mm-panel__note">
            Your wallet: <code>{truncateAddress(walletAddress, 10, 8)}</code>
          </p>
        )}
      </section>

      {queriedAddress && (
        <section className="mm-panel" aria-labelledby="history-results-title">
          <div className="mm-panel__head">
            <div>
              <p className="mm-panel__eyebrow">Results</p>
              <h2 id="history-results-title" className="mm-panel__title">
                <code>{truncateAddress(queriedAddress, 10, 8)}</code>
              </h2>
            </div>
            {history.status === "success" && (
              <StatusBadge variant="neutral">
                {history.data?.length ?? 0} batches · {formatQuantityKg(totalKg)}
              </StatusBadge>
            )}
          </div>

          {history.status === "loading" && (
            <StatusBadge variant="pending">Reading contract…</StatusBadge>
          )}

          {history.status === "unconfigured" && (
            <p className="mm-panel__text">
              Configure the MandiMint contract and MST Testnet to read history.
            </p>
          )}

          {history.status === "error" && (
            <ErrorBanner
              message={history.error ?? "Could not read farmer history."}
              onRetry={history.reload}
            />
          )}

          {history.status === "idle" && (
            <p className="mm-panel__text">
              Enter a wallet address to load its allocation history.
            </p>
          )}

          {history.status === "success" && history.data && history.data.length === 0 && (
            <EmptyState
              icon={History}
              title="No recorded allocations"
              description="This wallet does not appear in any recorded batch on the configured contract."
            />
          )}

          {history.status === "success" && history.data && history.data.length > 0 && (
            <div className="mm-table-wrap">
              <table className="mm-table">
                <caption className="visually-hidden">
                  Batch IDs and allocated quantities for this farmer wallet
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Batch ID</th>
                    <th scope="col">Allocated</th>
                    <th scope="col">
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.data.map((row) => (
                    <tr key={row.batchId.toString()}>
                      <td>
                        <code>#{row.batchId.toString()}</code>
                      </td>
                      <td>{formatQuantityKg(row.quantityKg)}</td>
                      <td className="mm-table__action">
                        <Link
                          to={`/app/batches/${row.batchId.toString()}`}
                          className="mm-text-link"
                        >
                          View <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mm-panel__note">
            A wallet address is a public identifier. An allocation record does not
            prove identity, crop quality, or payment.
          </p>
        </section>
      )}
    </div>
  );
}
