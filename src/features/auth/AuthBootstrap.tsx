import { Link } from "react-router";
import { ApiError } from "../../api/client";
import { useLogout } from "./mutations";
import { useCurrentUser } from "./queries";

function roleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function AuthBootstrap() {
  const userQuery = useCurrentUser();
  const logoutMutation = useLogout();

  function signOut() {
    logoutMutation.mutate(undefined, {
      onError: (error) => {
        if (error instanceof ApiError && error.status === 401) {
          logoutMutation.reset();
        }
      },
    });
  }

  if (userQuery.isPending) {
    return (
      <main className="bootstrap-card">
        <p>Checking your session…</p>
      </main>
    );
  }

  if (userQuery.isError) {
    const error = userQuery.error;
    if (error instanceof ApiError && error.status === 401) {
      return (
        <main className="bootstrap-card">
          <h1>NORSU Order Payment System</h1>
          <p>Your session is not signed in.</p>
          <Link className="primary-link" to="/login">
            Sign in
          </Link>
        </main>
      );
    }

    return (
      <main className="bootstrap-card">
        <h1>Unable to connect</h1>
        <p>
          {error instanceof Error
            ? error.message
            : "The API could not be reached."}
        </p>
        <button type="button" onClick={() => void userQuery.refetch()}>
          Try again
        </button>
      </main>
    );
  }

  const user = userQuery.data.data;
  return (
    <main className="bootstrap-card">
      <h1>Welcome, {user.name}</h1>
      <p>Signed in as {roleLabel(user.role)}.</p>
      <p className="muted">
        Feature screens will be migrated here incrementally.
      </p>
      <button
        type="button"
        onClick={signOut}
        disabled={logoutMutation.isPending}
      >
        {logoutMutation.isPending ? "Signing out…" : "Sign out"}
      </button>
    </main>
  );
}
