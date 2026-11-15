import { useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/client";
import { documentUrl } from "./api";
import { useDeleteDocument, useUploadDocument } from "./mutations";
import { useDocuments } from "./queries";
export function DocumentsPage() {
  const [page, setPage] = useState(1);
  const [formInputId, setFormInputId] = useState("");
  const query = useDocuments(
    page,
    formInputId ? Number(formInputId) : undefined,
  );
  const upload = useUploadDocument();
  const remove = useDeleteDocument();
  if (query.isPending)
    return (
      <main className="bootstrap-card">
        <p>Loading documents…</p>
      </main>
    );
  if (query.isError)
    return (
      <main className="bootstrap-card">
        <h1>Unable to load documents</h1>
        <p>
          {query.error instanceof ApiError
            ? query.error.message
            : "Document loading failed."}
        </p>
        <button type="button" onClick={() => void query.refetch()}>
          Try again
        </button>
      </main>
    );
  return (
    <main className="form-card">
      <Link to="/">← Home</Link>
      <h1>Supporting documents</h1>
      <label>
        Form input ID filter
        <input
          type="number"
          value={formInputId}
          onChange={(event) => {
            setFormInputId(event.target.value);
            setPage(1);
          }}
        />
      </label>
      <label>
        Upload document
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file && formInputId)
              upload.mutate({ formInputId: Number(formInputId), file });
          }}
        />
      </label>
      {upload.isError && (
        <p className="field-error">
          {upload.error instanceof Error
            ? upload.error.message
            : "Upload failed."}
        </p>
      )}
      <div className="request-list">
        {query.data.data.length === 0 ? (
          <p className="muted">No documents found.</p>
        ) : (
          query.data.data.map((document) => (
            <article className="request-row" key={document.id}>
              <div>
                <strong>{document.original_filename}</strong>
                <p>Form input #{document.form_input_id}</p>
                <small>
                  {document.mime_type} · {document.file_size} bytes
                </small>
              </div>
              <div className="result-actions">
                <a
                  href={documentUrl(document.id)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View
                </a>
                <a href={documentUrl(document.id, true)} download>
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => remove.mutate(document.id)}
                  disabled={remove.isPending}
                >
                  Delete
                </button>
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
