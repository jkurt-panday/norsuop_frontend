import { useState } from "react";
import { ApiError } from "../../api/client";
import { useProcessStaffRequest } from "./processingMutations";

export function ProcessingForm({
  id,
  onComplete,
}: {
  id: number;
  onComplete: () => void;
}) {
  const mutation = useProcessStaffRequest();
  const [status, setStatus] = useState("processed");
  const [fundclusterId, setFundclusterId] = useState("");
  const [uacsId, setUacsId] = useState("");
  const [refDate, setRefDate] = useState(new Date().toISOString().slice(0, 10));
  return (
    <form
      className="processing-form"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate(
          {
            id,
            payload: {
              status,
              fundcluster_id: Number(fundclusterId),
              uacs_id: Number(uacsId),
              ref_date: refDate,
            },
          },
          { onSuccess: onComplete },
        );
      }}
    >
      <h2>Process request</h2>
      <label>
        Status
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="processed">Processed</option>
          <option value="pending">Pending</option>
        </select>
      </label>
      <label>
        Bank account ID
        <input
          type="number"
          min="1"
          value={fundclusterId}
          onChange={(event) => setFundclusterId(event.target.value)}
          required
        />
      </label>
      <label>
        UACS ID
        <input
          type="number"
          min="1"
          value={uacsId}
          onChange={(event) => setUacsId(event.target.value)}
          required
        />
      </label>
      <label>
        Reference date
        <input
          type="date"
          value={refDate}
          onChange={(event) => setRefDate(event.target.value)}
          required
        />
      </label>
      {mutation.isError && (
        <p className="field-error">
          {mutation.error instanceof ApiError
            ? mutation.error.message
            : "Processing failed."}
        </p>
      )}
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Processing…" : "Process request"}
      </button>
    </form>
  );
}
