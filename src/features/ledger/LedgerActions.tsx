import { useState } from "react";
import { ApiError } from "../../api/client";
import type { Ledger } from "./api";
import { useLedgerPdf, useSendLedgerEmails } from "./mutations";

export function LedgerActions({
  ledger,
  studentId,
}: {
  ledger: Ledger;
  studentId?: number;
}) {
  const pdfMutation = useLedgerPdf();
  const emailMutation = useSendLedgerEmails();
  const [recipientId, setRecipientId] = useState(
    studentId ? String(studentId) : "",
  );

  function downloadPdf() {
    const id = Number(recipientId);
    if (!Number.isInteger(id) || id <= 0) return;
    pdfMutation.mutate(
      { ledger, studentId: id },
      {
        onSuccess: (blob) => {
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = `${ledger}-ledger-statement-${id}.pdf`;
          anchor.click();
          URL.revokeObjectURL(url);
        },
      },
    );
  }

  function queueEmail() {
    const id = Number(recipientId);
    if (!Number.isInteger(id) || id <= 0) return;
    emailMutation.mutate({ ledger, payload: { student_ids: [id] } });
  }

  const error = pdfMutation.error ?? emailMutation.error;
  return (
    <section className="processing-form">
      <h2>Statement actions</h2>
      <label>
        Student ID
        <input
          type="number"
          min="1"
          value={recipientId}
          onChange={(event) => setRecipientId(event.target.value)}
        />
      </label>
      <div className="result-actions">
        <button
          type="button"
          onClick={downloadPdf}
          disabled={pdfMutation.isPending}
        >
          {pdfMutation.isPending ? "Preparing PDF…" : "Download PDF"}
        </button>
        <button
          type="button"
          onClick={queueEmail}
          disabled={emailMutation.isPending}
        >
          {emailMutation.isPending ? "Queueing…" : "Queue email"}
        </button>
      </div>
      {pdfMutation.isSuccess && <p role="status">PDF download prepared.</p>}
      {emailMutation.isSuccess && (
        <p role="status">{emailMutation.data.message}</p>
      )}
      {error && (
        <p role="alert">
          {error instanceof ApiError
            ? error.message
            : "Statement action failed."}
        </p>
      )}
    </section>
  );
}
