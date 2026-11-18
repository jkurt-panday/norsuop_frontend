import { useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/client";
import { resources, type MasterResource } from "./api";
import { useCreateMasterRecord, useDeleteMasterRecord } from "./mutations";
import { useMasterRecords } from "./queries";
const labels: Record<MasterResource, string> = {
  memberships: "Memberships",
  "payment-options": "Payment options",
  "bank-accounts": "Bank accounts",
  uacs: "UACS",
  "authorized-officials": "Authorized officials",
  courses: "Courses",
  "academic-terms": "Academic terms",
  "college-offices": "College offices",
};
interface MasterDataPageProps {
  initialResource?: MasterResource;
}

export function MasterDataPage({ initialResource = "memberships" }: MasterDataPageProps) {
  const [resource, setResource] = useState<MasterResource>(initialResource);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const query = useMasterRecords(resource, page, search);
  const create = useCreateMasterRecord();
  const remove = useDeleteMasterRecord();
  if (query.isPending)
    return (
      <main className="bootstrap-card">
        <p>Loading master data…</p>
      </main>
    );
  if (query.isError)
    return (
      <main className="bootstrap-card">
        <h1>Unable to load master data</h1>
        <p>
          {query.error instanceof ApiError
            ? query.error.message
            : "Loading failed."}
        </p>
      </main>
    );
  return (
    <main className="form-card">
      <Link to="/admin">← Dashboard</Link>
      <h1>Master data</h1>
      <label>
        Resource
        <select
          value={resource}
          onChange={(event) => {
            setResource(event.target.value as MasterResource);
            setPage(1);
            setName("");
          }}
        >
          {resources.map((item) => (
            <option key={item} value={item}>
              {labels[item]}
            </option>
          ))}
        </select>
      </label>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
        }}
      >
        <input
          placeholder={`Search ${labels[resource].toLowerCase()}`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      <form
        className="processing-form"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate(
            { resource, payload: { name } },
            { onSuccess: () => setName("") },
          );
        }}
      >
        <h2>Quick create</h2>
        <input
          placeholder="Name or description"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <button type="submit" disabled={create.isPending}>
          Create
        </button>
      </form>
      <div className="request-list">
        {query.data.data.map((record) => (
          <article className="request-row" key={record.id}>
            <div>
              <strong>
                {String(
                  record.name ??
                    record.member_desc ??
                    record.payment_desc ??
                    record.course_desc ??
                    record.account_name ??
                    record.account_title ??
                    record.id,
                )}
              </strong>
              <p>{JSON.stringify(record)}</p>
            </div>
            <button
              type="button"
              onClick={() => remove.mutate({ resource, id: record.id })}
              disabled={remove.isPending}
            >
              Delete
            </button>
          </article>
        ))}
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
