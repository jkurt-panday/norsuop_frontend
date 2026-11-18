import { api } from "../../api/client";
export type MasterRecord = Record<string, unknown> & { id: number };
export type MasterList = {
  data: MasterRecord[];
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
export function getMasterRecords(
  resource: MasterResource,
  page = 1,
  search = "",
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ page: String(page), per_page: "20" });
  if (search.trim()) query.set("search", search.trim());
  return api<MasterList>(`/api/v1/${resource}?${query}`, { signal });
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
