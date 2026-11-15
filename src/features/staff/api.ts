import { api } from "../../api/client";

export type StaffRequest = {
  id: number;
  student_num?: number | null;
  reference_number: string;
  firstname_or_office: string;
  middlename_or_project?: string;
  lastname_or_agency: string;
  email: string;
  amount: string | number;
  membership?: { member_desc?: string };
  staff_input?: { status?: string };
};
export type StaffRequestList = {
  data: StaffRequest[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  links: { next: string | null; prev: string | null };
};
export type StaffFilters = {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  sort?: string;
  direction?: "asc" | "desc";
  date_from?: string;
  date_to?: string;
};

export function getStaffRequests(filters: StaffFilters, signal?: AbortSignal) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  return api<StaffRequestList>(`/api/v1/staff/requests?${query}`, { signal });
}
export type StaffRequestDetail = {
  data: StaffRequest & {
    payment_detail_option?: { payment_desc?: string };
    course?: { course_code?: string; course_desc?: string };
    supporting_documents?: Array<{ id: number; original_filename: string }>;
    staff_input?: { status?: string; purpose?: string };
  };
  bankAccounts: unknown[];
  uacsList: unknown[];
  paymentOptions: unknown[];
  academicTerms: unknown[];
};
export function getStaffRequest(id: number, signal?: AbortSignal) {
  return api<StaffRequestDetail>(`/api/v1/staff/requests/${id}`, { signal });
}
export function processStaffRequest(
  form_input_id: number,
  payload: Record<string, unknown>,
) {
  return api(`/api/v1/staff/requests/${form_input_id}/process`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function updateStaffProcessing(
  id: number,
  payload: Record<string, unknown>,
) {
  return api(`/api/v1/staff/requests/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
export function updateStaffDetails(
  id: number,
  payload: Record<string, unknown>,
) {
  return api(`/api/v1/staff/requests/${id}/details`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
export function searchOpStudents(q: string, signal?: AbortSignal) {
  return api<{
    students: Array<{ id: number; student_number: string; full_name: string }>;
  }>(`/api/v1/staff/requests/student-search?q=${encodeURIComponent(q)}`, {
    signal,
  });
}
export function linkOpStudent(id: number, student_id: number) {
  return api(`/api/v1/staff/requests/${id}/student`, {
    method: "PUT",
    body: JSON.stringify({ student_id }),
  });
}
