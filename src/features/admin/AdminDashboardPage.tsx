import { Link } from "react-router";
import { ApiError } from "../../api/client";
import { useAdminDashboard } from "./queries";
export function AdminDashboardPage() {
  const query = useAdminDashboard();
  if (query.isPending)
    return (
      <main className="bootstrap-card">
        <p>Loading dashboard…</p>
      </main>
    );
  if (query.isError)
    return (
      <main className="bootstrap-card">
        <h1>Unable to load dashboard</h1>
        <p>
          {query.error instanceof ApiError
            ? query.error.message
            : "Dashboard loading failed."}
        </p>
        <button type="button" onClick={() => void query.refetch()}>
          Try again
        </button>
      </main>
    );
  const stats = query.data.data;
  return (
    <main className="form-card">
      <Link to="/">← Home</Link>
      <h1>Admin dashboard</h1>
      <div className="stats-grid">
        <div>
          <strong>{stats.staff_count}</strong>
          <span>Staff</span>
        </div>
        <div>
          <strong>{stats.cashier_count}</strong>
          <span>Cashiers</span>
        </div>
        <div>
          <strong>{stats.admin_count}</strong>
          <span>Admins</span>
        </div>
      </div>
      <Link to="/admin/users">Manage users</Link>
      <h2>Recent activity</h2>
      <pre className="activity-preview">
        {JSON.stringify(stats.recent_activity, null, 2)}
      </pre>
    </main>
  );
}
