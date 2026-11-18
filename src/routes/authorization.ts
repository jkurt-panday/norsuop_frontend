import type { AuthUser } from "../features/auth/api";

export type AppRole = AuthUser["role"];

export function canAccessRole(
  user: AuthUser | undefined,
  roles: readonly AppRole[],
): boolean {
  return user !== undefined && roles.includes(user.role);
}
