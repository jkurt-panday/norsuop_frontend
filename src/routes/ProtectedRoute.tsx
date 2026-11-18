import { Navigate, Outlet, useLocation } from "react-router";
import { ApiError } from "../api/client";
import { useCurrentUser } from "../features/auth/queries";

export function ProtectedRoute() {
  const location = useLocation();
  const userQuery = useCurrentUser();
  if (userQuery.isPending)
    return (
      <main className="bootstrap-card">
        <p>Checking your session…</p>
      </main>
    );
  if (
    userQuery.isError &&
    userQuery.error instanceof ApiError &&
    userQuery.error.status === 401
  ) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (userQuery.isError)
    return (
      <main className="bootstrap-card">
        <p>Unable to verify your session.</p>
        <button type="button" onClick={() => void userQuery.refetch()}>
          Try again
        </button>
      </main>
    );
  return <Outlet />;
}
