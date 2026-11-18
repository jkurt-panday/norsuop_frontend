import { Link, useSearchParams } from "react-router";
import { ApiError } from "../../../api/client";
import { opReceiptUrl } from "./resultApi";
import { useOpResult } from "./resultQueries";

export function OpResultPage() {
  const [params] = useSearchParams();
  const reference = params.get("reference") ?? undefined;
  const token = params.get("token") ?? undefined;
  const result = useOpResult(reference, token);

  if (!reference || !token)
    return (
      <main className="bootstrap-card">
        <h1>Receipt link incomplete</h1>
        <p>Open the result link from your submission confirmation.</p>
        <Link to="/opform">Submit another request</Link>
      </main>
    );
  if (result.isPending)
    return (
      <main className="bootstrap-card">
        <p>Loading your submission…</p>
      </main>
    );
  if (result.isError)
    return (
      <main className="bootstrap-card">
        <h1>Submission unavailable</h1>
        <p>
          {result.error instanceof ApiError && result.error.status === 404
            ? "This receipt link is invalid or expired."
            : "We could not load this submission."}
        </p>
        <Link to="/opform">Submit another request</Link>
      </main>
    );

  const submission = result.data.data;
  return (
    <main className="bootstrap-card">
      <h1>Submission received</h1>
      <p>Your Order of Payment reference is:</p>
      <strong className="reference">{submission.reference_number}</strong>
      <p className="muted">Keep this reference and access link private.</p>
      <div className="result-actions">
        <a
          href={opReceiptUrl(reference, token)}
          target="_blank"
          rel="noreferrer"
        >
          View receipt PDF
        </a>
        <a href={opReceiptUrl(reference, token, true)} download>
          Download receipt PDF
        </a>
      </div>
      <Link to="/opform">Submit another request</Link>
    </main>
  );
}
