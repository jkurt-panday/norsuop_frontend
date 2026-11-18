import { Link, useParams } from "react-router";
import { ApiError } from "../../api/client";
import { type Ledger } from "./api";
import { useLedgerBalance } from "./queries";
export function LedgerBalancePage({ ledger }: { ledger: Ledger }) {
  const id = Number(useParams().studentId);
  const query = useLedgerBalance(ledger, Number.isFinite(id) ? id : undefined);
  if (query.isPending)
    return (
      <main className="bootstrap-card">
        <p>Loading balance…</p>
      </main>
    );
  if (query.isError)
    return (
      <main className="bootstrap-card">
        <h1>Unable to load balance</h1>
        <p>
          {query.error instanceof ApiError
            ? query.error.message
            : "Balance loading failed."}
        </p>
        <Link to={`/${ledger}-ledger`}>Back</Link>
      </main>
    );
  return (
    <main className="form-card">
      <Link to={`/${ledger}-ledger`}>← Ledger</Link>
      <h1>Student balance</h1>
      <pre className="activity-preview">
        {JSON.stringify(query.data.summary, null, 2)}
      </pre>
      <div className="request-list">
        {query.data.transactions.map((record) => (
          <article className="request-row" key={record.id}>
            <span>
              {record.transaction_date} · {record.particulars}
            </span>
            <strong>₱{Number(record.amount).toFixed(2)}</strong>
          </article>
        ))}
      </div>
    </main>
  );
}
