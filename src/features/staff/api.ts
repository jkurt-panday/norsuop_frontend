import { api } from "../../api/client";

export type BankAccount = {
  id: number;
  account_name: string;
  bank_name: string;
  account_num: string;
  fund_cluster: string;
};

export type UacsItem = {
  id: number;
  uacs_object_code: string;
  uacs_sub_object_code: string | null;
  account_title: string;
};

export type PaymentDetailOption = {
  id: number;
  payment_desc: string;
};

export type AcademicTerm = {
  id: number;
  school_year: string;
  semester: string;
};

export type SupportingDocument = {
  id: number;
  form_input_id?: number;
  original_filename: string;
  file_extension?: string;
  file_size?: number;
  formatted_file_size?: string;
  mime_type?: string;
  uploaded_at?: string;
};

export type StaffStudent = {
  id: number;
  student_number: string;
  full_name: string;
};

export type StaffInputData = {
  id?: number;
  status?: string;
  ref_date?: string | null;
  purpose?: string | null;
  or_no?: string | null;
  or_date?: string | null;
  emailed_at?: string | null;
  bank_account?: BankAccount | null;
  uacs?: UacsItem | null;
  created_at?: string;
  updated_at?: string;
};

export type StaffRequest = {
  id: number;
  student_num?: number | null;
  reference_number: string;
  firstname_or_office: string;
  middlename_or_project?: string | null;
  lastname_or_agency: string;
  email: string;
  amount: string | number;
  created_at?: string;
  contact_num?: string;
  office_or_college?: string;
  position_or_designation?: string;
  address?: string;
  request_type?: string;
  membership?: { id?: number; member_desc?: string; member_code?: string } | null;
  payment_detail_option?: PaymentDetailOption | null;
  staff_input?: StaffInputData | null;
  staffInput?: StaffInputData | null;
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
    contact_num?: string;
    office_or_college?: string;
    position_or_designation?: string;
    address?: string;
    request_type?: string;
    academic_term?: number | null;
    submitted_student_number?: string | null;
    student?: StaffStudent | null;
    payment_detail_option?: PaymentDetailOption | null;
    course?: { id?: number; course_code?: string; course_desc?: string; course_college?: string } | null;
    supporting_documents?: SupportingDocument[];
    supportingDocuments?: SupportingDocument[];
    staff_input?: StaffInputData | null;
    staffInput?: StaffInputData | null;
  };
  bankAccounts: BankAccount[];
  uacsList: UacsItem[];
  paymentOptions: PaymentDetailOption[];
  academicTerms: AcademicTerm[];
  courses: Array<{ id: number; course_code: string; course_desc: string; course_college: string }>;
  memberships: Array<{ id: number; member_code: string; member_desc: string }>;
};

export function getStaffRequest(id: number, signal?: AbortSignal) {
  return api<StaffRequestDetail>(`/api/v1/staff/requests/${id}`, { signal });
}

export type ProcessStaffRequestPayload = {
  fundcluster_id: number;
  uacs_id: number;
  ref_date: string;
  status: string;
  purpose?: string;
  [key: string]: unknown;
};

export function processStaffRequest(
  form_input_id: number,
  payload: ProcessStaffRequestPayload | Record<string, unknown>,
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

export interface CreateStudentPayload {
  student_number: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email?: string | null;
  contact_num?: string | null;
}

export function createAndLinkOpStudent(id: number, payload: CreateStudentPayload) {
  return api(`/api/v1/staff/requests/${id}/student`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function unlinkOpStudent(id: number) {
  return api(`/api/v1/staff/requests/${id}/student`, { method: "DELETE" });
}

export function emailOpRequest(
  id: number,
  payload: { subject: string; recipient_name: string; note?: string },
) {
  return api(`/api/v1/staff/requests/${id}/email-op`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getOpPdfUrl(id: number, format: "portrait" | "landscape" = "portrait"): string {
  return `/api/v1/staff/requests/${id}/pdf?format=${format}`;
}

export function deleteStaffRequest(id: number) {
  return api(`/api/v1/staff/requests/${id}`, {
    method: "DELETE",
  });
}

export type EmailRecipient = {
  id: number;
  reference_number: string;
  email: string;
  firstname_or_office: string;
  middlename_or_project?: string | null;
  lastname_or_agency: string;
  staff_input?: {
    id: number;
    status: string;
    emailed_at?: string | null;
    email_status?: string | null;
  } | null;
};

export function getEmailRecipients() {
  return api<{ data: EmailRecipient[]; queue_stalled: boolean }>(`/api/v1/staff/requests/email-recipients`);
}

export function bulkEmailOp(
  payload: {
    form_input_ids: number[];
    subject?: string;
    recipient_name?: string;
    note?: string;
  }
) {
  return api(`/api/v1/staff/requests/bulk-email-op`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, 120000);
}

// ── Staff Dashboard & Activity Log ──────────────────────────────────────────

export type StaffDashboardData = {
  totalRequests: number;
  unprocessedRequests: number;
  pendingRequests: number;
  processedRequests: number;
  paidRequests: number;
  cancelledRequests: number;
  totalRequestsLastDate: string | null;
  unprocessedLastDate: string | null;
  pendingLastDate: string | null;
  processedLastDate: string | null;
  paidLastDate: string | null;
  cancelledLastDate: string | null;
  statusBreakdown: Array<{ name: string; count: number }>;
  requestsOverTime: Array<{ date: string; count: number }>;
  requestsByMembership: Array<{ name: string; count: number }>;
  recentRequests: Array<{
    id: number;
    reference_number: string;
    full_name: string;
    created_at?: string;
    status: string;
  }>;
  recentActivity: Array<{
    id: number;
    event: string;
    description: string;
    causerName: string | null;
    createdAt: string;
  }>;
};

export type StaffActivityLogItem = {
  id: number;
  action: string;
  event: string;
  description: string;
  actor_name: string | null;
  actor_role: string | null;
  type: string;
  created_at: string;
  changes?: Array<{ field: string; old: string | null; new: string | null }>;
};

export type StaffActivityLogsResponse = {
  data: StaffActivityLogItem[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  links: { next: string | null; prev: string | null };
};

export type StaffActivityLogFilterParams = {
  page?: number;
  per_page?: number;
  activity_search?: string;
  activity_action?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  direction?: "asc" | "desc";
};

export function getStaffDashboard(signal?: AbortSignal) {
  return api<{ data: StaffDashboardData }>("/api/v1/staff/requests/dashboard", {
    signal,
  });
}

export function getStaffActivityLogs(
  params: StaffActivityLogFilterParams = {},
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("per_page", String(params.per_page ?? 10));
  if (params.activity_search?.trim()) {
    query.set("activity_search", params.activity_search.trim());
  }
  if (params.activity_action?.trim() && params.activity_action !== "all") {
    query.set("activity_action", params.activity_action.trim());
  }
  if (params.date_from?.trim()) {
    query.set("date_from", params.date_from.trim());
  }
  if (params.date_to?.trim()) {
    query.set("date_to", params.date_to.trim());
  }
  if (params.sort?.trim()) {
    query.set("sort", params.sort.trim());
  }
  if (params.direction?.trim()) {
    query.set("direction", params.direction.trim());
  }

  const qs = query.toString();
  return api<StaffActivityLogsResponse>(
    `/api/v1/staff/activity-log${qs ? `?${qs}` : ""}`,
    { signal },
  );
}
