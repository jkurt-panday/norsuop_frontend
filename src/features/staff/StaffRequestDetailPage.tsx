import { Link, useParams } from "react-router";
import { ApiError } from "../../api/client";
import { useStaffRequest } from "./detailQueries";
import { ProcessingForm } from "./ProcessingForm";
import { StudentMatcher } from "./StudentMatcher";

export function StaffRequestDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const query = useStaffRequest(Number.isFinite(id) ? id : undefined);
  if (query.isPending)
    return (
      <main className="bootstrap-card">
        <p>Loading request…</p>
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
        <Link to="/staff/requests">Back to requests</Link>
      </main>
    );
  const request = query.data.data;
  return (
    <main className="form-card">
      <Link to="/staff/requests">← Requests</Link>
      <h1>{request.reference_number}</h1>
      <p className="muted">
        {request.firstname_or_office} {request.lastname_or_agency} ·{" "}
        {request.email}
      </p>
      <dl className="detail-grid">
        <dt>Amount</dt>
        <dd>₱{Number(request.amount).toFixed(2)}</dd>
        <dt>Status</dt>
        <dd>{request.staff_input?.status ?? "unprocessed"}</dd>
        <dt>Membership</dt>
        <dd>{request.membership?.member_desc ?? "—"}</dd>
        <dt>Payment detail</dt>
        <dd>{request.payment_detail_option?.payment_desc ?? "—"}</dd>
        <dt>Course</dt>
        <dd>{request.course?.course_code ?? "—"}</dd>
      </dl>
      {request.supporting_documents &&
        request.supporting_documents.length > 0 && (
          <>
            <h2>Supporting documents</h2>
            <ul>
              {request.supporting_documents.map((document) => (
                <li key={document.id}>{document.original_filename}</li>
              ))}
            </ul>
          </>
        )}
      {!request.student_num && <StudentMatcher id={request.id} />}
      {!request.staff_input && (
        <ProcessingForm
          id={request.id}
          onComplete={() => void query.refetch()}
        />
      )}
    </main>
  );
}
