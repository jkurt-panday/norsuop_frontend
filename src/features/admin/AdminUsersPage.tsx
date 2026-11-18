import { useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/client";
import {
  useCreateAdminUser,
  useDeleteAdminUser,
  useToggleAdminUser,
} from "./mutations";
import { useAdminUsers } from "./queries";
export function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const query = useAdminUsers(page, search);
  const create = useCreateAdminUser();
  const toggle = useToggleAdminUser();
  const remove = useDeleteAdminUser();
  if (query.isPending)
    return (
      <main className="bootstrap-card">
        <p>Loading users…</p>
      </main>
    );
  if (query.isError)
    return (
      <main className="bootstrap-card">
        <h1>Unable to load users</h1>
        <p>
          {query.error instanceof ApiError
            ? query.error.message
            : "User loading failed."}
        </p>
      </main>
    );
  return (
    <main className="form-card">
      <Link to="/admin">← Dashboard</Link>
      <h1>Users</h1>
      <form
        className="processing-form"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate(
            { name, email, password, role },
            {
              onSuccess: () => {
                setName("");
                setEmail("");
                setPassword("");
              },
            },
          );
        }}
      >
        <h2>Create user</h2>
        <input
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="staff">Staff</option>
          <option value="cashier">Cashier</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" disabled={create.isPending}>
          Create user
        </button>
      </form>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
        }}
      >
        <input
          placeholder="Search users"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      <div className="request-list">
        {query.data.data.map((user) => (
          <article className="request-row" key={user.id}>
            <div>
              <strong>{user.name}</strong>
              <p>{user.email}</p>
              <small>{user.role}</small>
            </div>
            <div>
              <button type="button" onClick={() => toggle.mutate(user.id)}>
                {" "}
                {user.deleted_at ? "Activate" : "Deactivate"}{" "}
              </button>
              {user.deleted_at && (
                <button type="button" onClick={() => remove.mutate(user.id)}>
                  Delete
                </button>
              )}
            </div>
          </article>
        ))}
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
