import { AlertTriangle, Settings2 } from "lucide-react";
import { getMandiMintEnvIssues } from "../../config/blockchain";
import "./contract-notice.css";

export function ContractConfigNotice() {
  const issues = getMandiMintEnvIssues();
  if (issues.length === 0) {
    return null;
  }

  return (
    <aside className="mm-contract-notice" aria-labelledby="contract-notice-title">
      <span className="mm-contract-notice__icon" aria-hidden="true">
        <AlertTriangle />
      </span>
      <div>
        <h2 id="contract-notice-title" className="mm-contract-notice__title">
          Blockchain configuration required
        </h2>
        <p className="mm-contract-notice__text">
          MandiMint does not substitute a test or mock contract. Contract reads and
          writes stay disabled until these official values are provided:
        </p>
        <ul className="mm-contract-notice__list">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
        <p className="mm-contract-notice__hint">
          <Settings2 size={14} aria-hidden="true" /> See{" "}
          <code>frontend/.env.example</code> and the frontend README.
        </p>
      </div>
    </aside>
  );
}
