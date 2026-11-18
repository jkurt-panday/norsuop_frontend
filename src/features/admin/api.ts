import { api } from "../../api/client";

export type AdminUserRole = "admin" | "staff" | "cashier";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: AdminUserRole;
  email_verified_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminUsersResponse = {
  data: AdminUser[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  links: { next: string | null; prev: string | null };
};

export type ActivityLogChange = {
  field: string;
  old: string | null;
  new: string | null;
};

export type AdminActivityLogItem = {
  id: number;
  action: string;
  event: string;
  description: string;
  actor_name: string | null;
  actor_role: string | null;
  type: string;
  created_at: string;
  changes?: ActivityLogChange[];
};

export type AdminDashboardData = {
  staff_count: number;
  admin_count: number;
  cashier_count: number;
  recent_activity: AdminActivityLogItem[];
};

export type AdminUsersFilterParams = {
  page?: number;
  per_page?: number;
  search?: string;
  role?: string;
  sort?: string;
  direction?: "asc" | "desc";
};

export type ActivityLogFilterParams = {
  page?: number;
  per_page?: number;
  activity_search?: string;
  activity_action?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  direction?: "asc" | "desc";
};

export type AdminActivityLogsResponse = {
  data: AdminActivityLogItem[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  links: { next: string | null; prev: string | null };
};

export type CreateAdminUserPayload = {
  name: string;
  email: string;
  password: string;
  role: AdminUserRole;
};

export type UpdateAdminUserPayload = {
  name: string;
  email: string;
  password?: string;
  role: AdminUserRole;
};

export function getAdminDashboard(signal?: AbortSignal) {
  return api<{ data: AdminDashboardData }>("/api/v1/admin/dashboard", {
    signal,
  });
}

export function getAdminUsers(
  paramsOrPage: number | AdminUsersFilterParams = 1,
  search = "",
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();
  if (typeof paramsOrPage === "object") {
    query.set("page", String(paramsOrPage.page ?? 1));
    query.set("per_page", String(paramsOrPage.per_page ?? 10));
    if (paramsOrPage.search?.trim()) query.set("search", paramsOrPage.search.trim());
    if (paramsOrPage.role?.trim() && paramsOrPage.role !== "All") {
      query.set("role", paramsOrPage.role.trim());
    }
    if (paramsOrPage.sort?.trim()) query.set("sort", paramsOrPage.sort.trim());
    if (paramsOrPage.direction?.trim()) query.set("direction", paramsOrPage.direction.trim());
  } else {
    query.set("page", String(paramsOrPage));
    query.set("per_page", "10");
    if (search.trim()) query.set("search", search.trim());
  }

  const qs = query.toString();
  return api<AdminUsersResponse>(`/api/v1/admin/users${qs ? `?${qs}` : ""}`, {
    signal,
  });
}

export function createAdminUser(payload: CreateAdminUserPayload) {
  return api<{ message: string; data: AdminUser }>("/api/v1/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminUser(id: number, payload: UpdateAdminUserPayload) {
  return api<{ message: string; data: AdminUser }>(`/api/v1/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function toggleAdminUser(id: number) {
  return api<{ message: string; data: AdminUser }>(
    `/api/v1/admin/users/${id}/toggle`,
    { method: "PUT" },
  );
}

export function deleteAdminUser(id: number) {
  return api<void>(`/api/v1/admin/users/${id}`, { method: "DELETE" });
}

export function getAdminActivityLogs(
  params?: ActivityLogFilterParams,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page ?? 10));
  if (params?.activity_search?.trim()) {
    query.set("activity_search", params.activity_search.trim());
  }
  if (params?.activity_action?.trim() && params.activity_action !== "All") {
    query.set("activity_action", params.activity_action.trim());
  }
  if (params?.date_from?.trim()) query.set("date_from", params.date_from.trim());
  if (params?.date_to?.trim()) query.set("date_to", params.date_to.trim());
  if (params?.sort?.trim()) query.set("sort", params.sort.trim());
  if (params?.direction?.trim()) query.set("direction", params.direction.trim());

  const qs = query.toString();
  return api<AdminActivityLogsResponse>(
    `/api/v1/admin/activity-log${qs ? `?${qs}` : ""}`,
    { signal },
  );
}
