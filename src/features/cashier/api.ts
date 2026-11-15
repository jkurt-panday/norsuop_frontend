import { api } from "../../api/client";

export type CashierRequest = {
  id: number;
  reference_number: string;
  firstname_or_office: string;
  lastname_or_agency: string;
  email: string;
  amount: string | number;
  staff_input?: { status?: string; or_no?: string; or_date?: string };
  membership?: { member_desc?: string };
  payment_detail_option?: { payment_desc?: string };
  course?: { course_code?: string; course_desc?: string };
};
export type CashierList = {
  data: CashierRequest[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  links: { next: string | null; prev: string | null };
};
export function getCashierRequests(
  page = 1,
  search = " ",
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ page: String(page), per_page: "10" });
  if (search.trim()) query.set("search", search.trim());
  return api<CashierList>(`/api/v1/cashier/requests?${query}`, { signal });
}
export function getCashierRequest(id: number, signal?: AbortSignal) {
  return api<{ data: CashierRequest }>(`/api/v1/cashier/requests/${id}`, {
    signal,
  });
}
export function updateCashierPayment(
  id: number,
  payload: { status: string; or_no?: string; or_date?: string },
) {
  return api(`/api/v1/cashier/requests/${id}/payment`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
