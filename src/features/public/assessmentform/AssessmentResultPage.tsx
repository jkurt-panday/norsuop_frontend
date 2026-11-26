import { Link, useSearchParams } from "react-router";
import { ApiError } from "../../../api/client";
import { assessmentReceiptUrl } from "./resultApi";
import { useAssessmentResult } from "./resultQueries";

export function AssessmentResultPage() {
  const [params] = useSearchParams();
  const reference = params.get("reference") ?? undefined;
  const token = params.get("token") ?? undefined;
  const result = useAssessmentResult(reference, token);
  if (!reference || !token)
    return (
      <main className="bootstrap-card">
        <h1>Receipt link incomplete</h1>
        <Link to="/assessmentform">Submit another assessment</Link>
      </main>
    );
  if (result.isPending)
    return (
      <main className="bootstrap-card">
        <p>Loading your assessment…</p>
      </main>
    );
  if (result.isError)
    return (
      <main className="bootstrap-card">
        <h1>Assessment unavailable</h1>
        <p>
          {result.error instanceof ApiError && result.error.status === 404
            ? "This receipt link is invalid or expired."
            : "We could not load this assessment."}
        </p>
        <Link to="/assessmentform">Submit another assessment</Link>
      </main>
    );
  return (
    <main className="bootstrap-card">
      <h1>Assessment submitted</h1>
      <p>Your reference is:</p>
      <strong className="reference">{result.data.data.reference_number}</strong>
      <p className="muted">Keep this reference and access link private.</p>
      <div className="result-actions">
        <a
          href={assessmentReceiptUrl(reference, token)}
          target="_blank"
          rel="noreferrer"
        >
          View receipt PDF
        </a>
        <a href={assessmentReceiptUrl(reference, token, true)} download>
          Download receipt PDF
        </a>
      </div>
      <Link to="/assessmentform">Submit another assessment</Link>
    </main>
  );
}
