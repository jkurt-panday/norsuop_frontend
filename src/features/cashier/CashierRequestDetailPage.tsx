import { useState } from "react";
import { Link, useParams } from "react-router";
import { ApiError } from "../../api/client";
import { useCashierPayment } from "./mutations";
import { useCashierRequest } from "./queries";
export function CashierRequestDetailPage() {
  const id = Number(useParams().id);
  const query = useCashierRequest(Number.isFinite(id) ? id : undefined);
  const mutation = useCashierPayment();
  const [status, setStatus] = useState("paid");
  const [orNo, setOrNo] = useState("");
  const [orDate, setOrDate] = useState(new Date().toISOString().slice(0, 10));
  if (query.isPending)
    return (
      <main className="bootstrap-card">
        <p>Loading cashier request…</p>
      </main>
    );
  if (query.isError)
    return (
      <main className="bootstrap-card">
        <h1>Unable to load request</h1>
        <p>
          {query.error instanceof ApiError
            ? query.error.message
            : "Request loading failed."}
        </p>
        <Link to="/cashier/requests">Back</Link>
      </main>
    );
  const request = query.data.data;
  return (
    <main className="form-card">
      <Link to="/cashier/requests">← Requests</Link>
      <h1>{request.reference_number}</h1>
      <p>
        {request.firstname_or_office} {request.lastname_or_agency} ·{" "}
        {request.email}
      </p>
      <dl className="detail-grid">
        <dt>Amount</dt>
        <dd>₱{Number(request.amount).toFixed(2)}</dd>
        <dt>Status</dt>
        <dd>{request.staff_input?.status ?? "unprocessed"}</dd>
        <dt>Course</dt>
        <dd>{request.course?.course_code ?? "—"}</dd>
      </dl>
      <form
        className="processing-form"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate(
            {
              id,
              payload: {
                status,
                or_no: orNo || undefined,
                or_date: orDate || undefined,
              },
            },
            { onSuccess: () => void query.refetch() },
          );
        }}
      >
        <h2>Update payment</h2>
        <label>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="paid">Paid</option>
            <option value="processed">Processed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label>
          OR number
          <input
            value={orNo}
            onChange={(event) => setOrNo(event.target.value)}
            required={status === "paid"}
          />
        </label>
        <label>
          OR date
          <input
            type="date"
            value={orDate}
            onChange={(event) => setOrDate(event.target.value)}
            required={status === "paid"}
          />
        </label>
        {mutation.isError && (
          <p className="field-error">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Payment update failed."}
          </p>
        )}
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save payment"}
        </button>
      </form>
    </main>
  );
}
