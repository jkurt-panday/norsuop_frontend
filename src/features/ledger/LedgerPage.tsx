import { useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/client";
import { type Ledger } from "./api";
import { useLedgerRecords } from "./queries";
import { LedgerTransactionForm } from "./LedgerTransactionForm";
import { ledgerExportUrl } from "./controls";
import { LedgerImportForm } from "./LedgerImportForm";
import { LedgerActions } from "./LedgerActions";
export function LedgerPage({ ledger }: { ledger: Ledger }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const query = useLedgerRecords(ledger, page, search);
  if (query.isPending)
    return (
      <main className="bootstrap-card">
        <p>Loading ledger…</p>
      </main>
    );
  if (query.isError)
    return (
      <main className="bootstrap-card">
        <h1>Unable to load ledger</h1>
        <p>
          {query.error instanceof ApiError
            ? query.error.message
            : "Ledger loading failed."}
        </p>
      </main>
    );
  return (
    <main className="form-card">
      <Link to="/">← Home</Link>
      <h1>{ledger === "graduate" ? "Graduate" : "Law"} ledger</h1>
      <div className="result-actions">
        <a href={ledgerExportUrl(ledger)} download>
          Export XLSX
        </a>
      </div>
      <LedgerTransactionForm ledger={ledger} />
      <LedgerImportForm ledger={ledger} />
      <LedgerActions ledger={ledger} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
        }}
      >
        <input
          placeholder="Search student or reference"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      <div className="request-list">
        {query.data.data.length === 0 ? (
          <p className="muted">No transactions found.</p>
        ) : (
          query.data.data.map((record) => (
            <article className="request-row" key={record.id}>
              <div>
                <strong>
                  {record.student?.last_name}, {record.student?.first_name}
                </strong>
                <p>
                  {record.particulars} · {record.entry_type}
                </p>
                <small>{record.transaction_date}</small>
              </div>
              <div>
                <span>{record.status}</span>
                <strong>₱{Number(record.amount).toFixed(2)}</strong>
              </div>
            </article>
          ))
        )}
      </div>
      <div className="pagination">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((value) => value - 1)}
        >
          Previous
        </button>
        <span>
          Page {query.data.meta.current_page} of {query.data.meta.last_page}
        </span>
        <button
          type="button"
          disabled={page >= query.data.meta.last_page}
          onClick={() => setPage((value) => value + 1)}
        >
          Next
        </button>
      </div>
    </main>
  );
}
