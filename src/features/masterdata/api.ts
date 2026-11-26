import { api, binary } from "../../api/client";

export type MasterRecord = Record<string, unknown> & { id: number };

export interface BankAccount {
  id: number;
  account_name: string;
  bank_name: string;
  account_num: string;
  fund_cluster: string;
  created_at?: string;
  updated_at?: string;
  display_number?: number;
}

export interface PaymentOption {
  id: number;
  payment_desc: string;
  created_at?: string;
  updated_at?: string;
  display_number?: number;
}

export interface Membership {
  id: number;
  member_code: string;
  member_desc: string;
  created_at?: string;
  updated_at?: string;
  display_number?: number;
}

export interface AuthorizedOfficial {
  id: number;
  name: string;
  position: string;
  course: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UACS {
  id: number;
  norsu_object_code: string | null;
  norsu_sub_object_code: string | null;
  uacs_object_code: string | null;
  uacs_sub_object_code: string | null;
  rca_code: string | null;
  account_title: string | null;
  created_at?: string;
  updated_at?: string;
  display_number?: number;
}

export interface Course {
  id: number;
  course_code: string;
  course_desc: string;
  course_college: "Graduate School" | "School of Law" | string;
  created_at?: string;
  updated_at?: string;
}

export type MasterList<T = MasterRecord> = {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  links: { next: string | null; prev: string | null };
};

export const resources = [
  "memberships",
  "payment-options",
  "bank-accounts",
  "uacs",
  "authorized-officials",
  "courses",
  "academic-terms",
  "college-offices",
] as const;

export type MasterResource = (typeof resources)[number];

export interface MasterQueryOptions {
  page?: number;
  perPage?: number;
  search?: string;
  sort?: string;
  direction?: "asc" | "desc";
  filters?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
}

export function getMasterRecords<T = MasterRecord>(
  resource: MasterResource,
  pageOrOptions: number | MasterQueryOptions = 1,
  search = "",
  signal?: AbortSignal,
): Promise<MasterList<T>> {
  const isOptions = typeof pageOrOptions === "object" && pageOrOptions !== null;
  const page = isOptions ? (pageOrOptions.page ?? 1) : pageOrOptions;
  const perPage = isOptions ? (pageOrOptions.perPage ?? 20) : 20;
  const term = isOptions ? (pageOrOptions.search ?? "") : search;
  const sort = isOptions ? pageOrOptions.sort : undefined;
  const direction = isOptions ? pageOrOptions.direction : undefined;
  const filters = isOptions ? pageOrOptions.filters : undefined;
  const sig = isOptions ? (pageOrOptions.signal ?? signal) : signal;

  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (term.trim()) query.set("search", term.trim());
  if (sort) {
    query.set("sort", sort);
    if (direction) query.set("direction", direction);
  }
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    }
  }

  return api<MasterList<T>>(`/api/v1/${resource}?${query}`, { signal: sig });
}

export function createMasterRecord(
  resource: MasterResource,
  payload: Record<string, unknown>,
) {
  return api(`/api/v1/${resource}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMasterRecord(
  resource: MasterResource,
  id: number,
  payload: Record<string, unknown>,
) {
  return api(`/api/v1/${resource}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteMasterRecord(resource: MasterResource, id: number) {
  return api<void>(`/api/v1/${resource}/${id}`, { method: "DELETE" });
}

export function setActiveOfficial(
  id: number,
): Promise<{ message: string; data: AuthorizedOfficial }> {
  return api<{ message: string; data: AuthorizedOfficial }>(
    `/api/v1/authorized-officials/${id}/set-active`,
    {
      method: "PUT",
      body: JSON.stringify({}),
    },
  );
}

export function importUacs(
  file: File,
): Promise<{ message: string; count: number }> {
  const formData = new FormData();
  formData.append("file", file);
  return api<{ message: string; count: number }>("/api/v1/uacs/import", {
    method: "POST",
    body: formData,
  });
}

export function exportUacs(): Promise<Blob> {
  return binary("/api/v1/uacs/export");
}
