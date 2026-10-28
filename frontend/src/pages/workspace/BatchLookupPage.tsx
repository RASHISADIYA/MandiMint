import { ArrowRight, History, Search } from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { parseWholeNumber } from "../../lib/format";

export function BatchLookupPage() {
  const navigate = useNavigate();
  const [batchId, setBatchId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const parsed = parseWholeNumber(batchId);
      if (parsed === null || parsed <= 0n) {
        setError("Enter a batch ID greater than zero.");
        return;
      }

      setError(null);
      navigate(`/app/batches/${parsed.toString()}`);
    },
    [batchId, navigate],
  );

  return (
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <p className="mm-page-head__eyebrow">
            <Search size={14} aria-hidden="true" />
            Public records
          </p>
          <h1 className="mm-page-head__title">Find a recorded batch</h1>
          <p className="mm-page-head__lead">
            The contract exposes reads by batch ID, not a global list. Enter the
            numeric ID assigned when the batch was recorded.
          </p>
        </div>
      </header>

      <div className="mm-two-col">
        <section className="mm-panel">
          <h2 className="mm-panel__title">Look up by batch ID</h2>
          <p className="mm-panel__text">
            Batch and allocation data is public and append-only.
          </p>
          <form onSubmit={handleSubmit} className="mm-inline-form">
            <Input
              label="Batch ID"
              inputMode="numeric"
              placeholder="e.g. 1024"
              value={batchId}
              onChange={(event) => {
                setBatchId(event.target.value);
                setError(null);
              }}
              error={error ?? undefined}
              required
            />
            <Button type="submit" leadingIcon={<Search size={16} aria-hidden="true" />}>
              Find batch
            </Button>
          </form>
        </section>

        <section className="mm-panel">
          <div className="mm-panel__head">
            <div>
              <p className="mm-panel__eyebrow">Farmer view</p>
              <h2 className="mm-panel__title">Looking for your own records?</h2>
            </div>
            <History aria-hidden="true" className="mm-panel__icon" />
          </div>
          <p className="mm-panel__text">
            Query all batch IDs and allocated quantities for a wallet address.
            Farmers can use their embedded wallet address.
          </p>
          <Link to="/app/farmer" className="mm-text-link">
            Open farmer history <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
