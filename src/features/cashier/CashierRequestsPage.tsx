import { useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/client";
import { useCashierRequests } from "./queries";
export function CashierRequestsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useCashierRequests(page, search);
  if (query.isPending)
    return (
      <main className="bootstrap-card">
        <p>Loading cashier requests…</p>
      </main>
    );
  if (query.isError)
    return (
      <main className="bootstrap-card">
        <h1>Unable to load requests</h1>
        <p>
          {query.error instanceof ApiError
            ? query.error.message
            : "Request loading failed."}
        </p>
        <button type="button" onClick={() => void query.refetch()}>
          Try again
        </button>
      </main>
    );
  return (
    <main className="form-card">
      <Link to="/">← Home</Link>
      <h1>Cashier requests</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
        }}
      >
        <input
          aria-label="Search requests"
          placeholder="Search reference, name, or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      <div className="request-list">
        {query.data.data.length === 0 ? (
          <p className="muted">No requests found.</p>
        ) : (
          query.data.data.map((request) => (
            <article className="request-row" key={request.id}>
              <div>
                <Link to={`/cashier/requests/${request.id}`}>
                  <strong>{request.reference_number}</strong>
                </Link>
                <p>
                  {request.firstname_or_office} {request.lastname_or_agency}
                </p>
                <small>{request.email}</small>
              </div>
              <div>
                <span>{request.staff_input?.status ?? "unprocessed"}</span>
                <strong>₱{Number(request.amount).toFixed(2)}</strong>
              </div>
            </article>
          ))
        )}
      </div>
      <div className="pagination">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((current) => current - 1)}
        >
          Previous
        </button>
        <span>
          Page {query.data.meta.current_page} of {query.data.meta.last_page}
        </span>
        <button
          type="button"
          disabled={page >= query.data.meta.last_page}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </button>
      </div>
    </main>
  );
}
