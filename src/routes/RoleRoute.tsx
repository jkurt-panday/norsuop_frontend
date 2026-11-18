import { Navigate, Outlet } from "react-router";
import { useCurrentUser } from "../features/auth/queries";
import { canAccessRole, type AppRole } from "./authorization";

export function RoleRoute({ roles }: { roles: AppRole[] }) {
  const userQuery = useCurrentUser();
  if (userQuery.isPending)
    return (
      <main className="bootstrap-card">
        <p>Loading access…</p>
      </main>
    );
  if (!canAccessRole(userQuery.data?.data, roles))
    return <Navigate to="/" replace />;
  return <Outlet />;
}
