import { useState } from "react";
import { ApiError } from "../../api/client";
import type { Ledger } from "./api";
import { useImportLedger } from "./mutations";

export function LedgerImportForm({ ledger }: { ledger: Ledger }) {
  const [file, setFile] = useState<File | undefined>();
  const mutation = useImportLedger();

  return (
    <form
      className="processing-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (file) mutation.mutate({ ledger, file });
      }}
    >
      <h2>Import ledger</h2>
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={(event) => setFile(event.target.files?.[0])}
        required
      />
      <button type="submit" disabled={!file || mutation.isPending}>
        {mutation.isPending ? "Importing…" : "Import file"}
      </button>
      {mutation.isSuccess && (
        <p role="status">
          {mutation.data.message} Imported: {mutation.data.imported}; skipped:{" "}
          {mutation.data.skipped}; duplicates: {mutation.data.duplicates}.
        </p>
      )}
      {mutation.isError && (
        <p role="alert">
          {mutation.error instanceof ApiError
            ? mutation.error.message
            : "Ledger import failed."}
        </p>
      )}
    </form>
  );
}
