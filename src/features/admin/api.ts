import { api } from "../../api/client";
export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  deleted_at: string | null;
};
export type AdminUsers = {
  data: AdminUser[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  links: { next: string | null; prev: string | null };
};
export function getAdminDashboard(signal?: AbortSignal) {
  return api<{
    data: {
      staff_count: number;
      admin_count: number;
      cashier_count: number;
      recent_activity: unknown[];
    };
  }>("/api/v1/admin/dashboard", { signal });
}
export function getAdminUsers(page = 1, search = "", signal?: AbortSignal) {
  const query = new URLSearchParams({ page: String(page), per_page: "20" });
  if (search.trim()) query.set("search", search.trim());
  return api<AdminUsers>(`/api/v1/admin/users?${query}`, { signal });
}
export function createAdminUser(payload: Record<string, unknown>) {
  return api("/api/v1/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function toggleAdminUser(id: number) {
  return api(`/api/v1/admin/users/${id}/toggle`, { method: "PUT" });
}
export function deleteAdminUser(id: number) {
  return api<void>(`/api/v1/admin/users/${id}`, { method: "DELETE" });
}
