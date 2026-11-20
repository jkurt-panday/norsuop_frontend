import { api, binary } from "../../api/client";
import type { components } from "../../api/schema";

export type Ledger = "graduate" | "law";

export type LedgerRecord = {
  id: number;
  student_id: number;
  student_number?: string | null;
  course_id?: number;
  academic_term_id?: number;
  entry_type: "ar" | "payment" | "adjustment" | string;
  units?: number | string | null;
  transaction_date: string;
  reference_number?: string | null;
  particulars: string;
  rate?: number | string;
  amount: number | string;
  remark?: string | null;
  remarks?: string | null;
  status: string;
  membership?: string | null;
  latin_honor?: string | null;
  discount_amount?: number | string | null;
  input_by?: string | null;
  orLink?: string | null;
  student?: {
    id?: number;
    student_number?: string;
    first_name?: string;
    last_name?: string;
    name?: string;
  };
  course?: {
    id?: number;
    course_code?: string;
    course_desc?: string;
    course_college?: string;
  };
  academic_term?: {
    id?: number;
    school_year?: string;
    semester?: string;
  };
};

export type LedgerFilterParams = {
  page?: number;
  per_page?: number;
  search?: string;
  entry_type?: "ar" | "payment" | "adjustment" | string;
  status?: string;
  student_id?: number;
  date_from?: string;
  date_to?: string;
  school_year?: string;
  semester?: string;
  course?: string;
  balance_status?: string;
};

export type LedgerStats = {
  totalStudents?: number;
  totalAssessments?: number;
  totalPayments?: number;
  totalAdjustments?: number;
  outstandingBalance?: number;
};

export type LedgerFilterOptions = {
  courses: string[];
  schoolYears: string[];
  semesters: string[];
  types?: string[];
};

export type LedgerRecipient = {
  id: number;
  student_number: string;
  name?: string;
  full_name?: string;
  email: string;
  balance?: number;
  balance_status?: "outstanding" | "settled" | string;
};

export type LedgerStudent = {
  id: number;
  student_number: string;
  name: string;
};

export type LedgerRosterStudent = LedgerStudent & {
  last_course_id: number | null;
};

export type LedgerSummary = {
  total_charges: number;
  total_payments: number;
  total_adjustments?: number;
  outstanding_balance: number;
};

export type LedgerBalanceResponse = {
  student: {
    id: number;
    student_number?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string | null;
    contactNumber?: string | null;
    contact_number?: string | null;
    course?: string | null;
  };
  summary: LedgerSummary;
  transactions: LedgerRecord[];
};

export type LedgerList = {
  data: LedgerRecord[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  links: { next: string | null; prev: string | null };
  stats?: LedgerStats;
  filterOptions?: LedgerFilterOptions;
};

export type LedgerImportResult = components["schemas"]["LedgerImportResult"];

/**
 * Fields the ledger API accepts that are not (yet) in the generated OpenAPI
 * schema — see LedgerController::validated().
 */
type LedgerEntryExtras = {
  remarks?: string;
  status?: string;
  membership?: string;
  latin_honor?: string;
  discount_amount?: number;
};

type LedgerEntryBase = components["schemas"]["LedgerTransactionRequest"] &
  LedgerEntryExtras;

export type LedgerBatchItem = Omit<
  LedgerEntryBase,
  "student_id" | "course_id" | "academic_term_id" | "transaction_date"
>;

export type LedgerTransactionRequest = LedgerEntryBase & {
  /** Batch mode: 1–50 line items sharing the same student / term / date. */
  items?: LedgerBatchItem[];
};

export type CohortRow = {
  student_id: number;
  units?: number;
  rate?: number;
  amount: number;
  membership?: string | null;
  discount_amount?: number | null;
  remarks?: string | null;
};

export type CohortStoreRequest = {
  course_id: number;
  academic_term_id: number;
  entry_type: "ar" | "payment" | "adjustment";
  transaction_date: string;
  particulars: string;
  reference_number?: string | null;
  status?: string;
  cohort_rows: CohortRow[];
};

export function getLedgerRecords(
  ledger: Ledger,
  pageOrFilters: number | LedgerFilterParams = 1,
  search = "",
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();
  if (typeof pageOrFilters === "object") {
    query.set("page", String(pageOrFilters.page ?? 1));
    query.set("per_page", String(pageOrFilters.per_page ?? 20));
    if (pageOrFilters.search?.trim()) query.set("search", pageOrFilters.search.trim());
    if (pageOrFilters.entry_type) query.set("entry_type", pageOrFilters.entry_type);
    if (pageOrFilters.status) query.set("status", pageOrFilters.status);
    if (pageOrFilters.student_id) query.set("student_id", String(pageOrFilters.student_id));
    if (pageOrFilters.date_from) query.set("date_from", pageOrFilters.date_from);
    if (pageOrFilters.date_to) query.set("date_to", pageOrFilters.date_to);
    if (pageOrFilters.school_year) query.set("school_year", pageOrFilters.school_year);
    if (pageOrFilters.semester) query.set("semester", pageOrFilters.semester);
    if (pageOrFilters.course) query.set("course", pageOrFilters.course);
    if (pageOrFilters.balance_status) query.set("balance_status", pageOrFilters.balance_status);
  } else {
    query.set("page", String(pageOrFilters));
    query.set("per_page", "20");
    if (search.trim()) query.set("search", search.trim());
  }
  return api<LedgerList>(`/api/v1/${ledger}-ledger?${query.toString()}`, { signal });
}

export function getLedgerBalance(
  ledger: Ledger,
  studentId: number,
  signal?: AbortSignal,
) {
  return api<LedgerBalanceResponse>(
    `/api/v1/${ledger}-ledger/students/${studentId}/balance`,
    { signal },
  );
}

export function searchLedgerStudents(
  ledger: Ledger,
  query: string,
  limit = 50,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (limit) params.set("limit", String(limit));
  return api<{ data: LedgerStudent[] }>(
    `/api/v1/${ledger}-ledger/students/search?${params.toString()}`,
    { signal },
  );
}

export function getLedgerEmailRecipients(
  ledger: Ledger,
  filters: LedgerFilterParams = {},
  signal?: AbortSignal,
) {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.entry_type) params.set("entry_type", filters.entry_type);
  if (filters.status) params.set("status", filters.status);
  if (filters.student_id) params.set("student_id", String(filters.student_id));
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.school_year) params.set("school_year", filters.school_year);
  if (filters.semester) params.set("semester", filters.semester);
  if (filters.course) params.set("course", filters.course);
  if (filters.balance_status) params.set("balance_status", filters.balance_status);

  const query = params.toString();
  return api<{ data: LedgerRecipient[] }>(
    `/api/v1/${ledger}-ledger/email-recipients${query ? `?${query}` : ""}`,
    { signal },
  );
}

export function getLedgerRoster(ledger: Ledger, signal?: AbortSignal) {
  return api<{ data: LedgerRosterStudent[] }>(
    `/api/v1/${ledger}-ledger/students/roster`,
    { signal },
  );
}

export function createCohortLedger(
  ledger: Ledger,
  payload: CohortStoreRequest,
) {
  return api<{
    message: string;
    created_count: number;
    scholarships_applied: number;
    data: LedgerRecord[];
  }>(`/api/v1/${ledger}-ledger/cohort-store`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createLedgerRecord(
  ledger: Ledger,
  payload: LedgerTransactionRequest,
) {
  return api<{ message: string; data: LedgerRecord }>(
    `/api/v1/${ledger}-ledger`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateLedgerRecord(
  ledger: Ledger,
  id: number,
  payload: LedgerTransactionRequest,
) {
  return api<{ message: string; data: LedgerRecord }>(
    `/api/v1/${ledger}-ledger/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteLedgerRecord(ledger: Ledger, id: number) {
  return api<void>(`/api/v1/${ledger}-ledger/${id}`, { method: "DELETE" });
}

export function importLedger(
  ledger: Ledger,
  file: File,
  presetCourseId?: number,
  presetAcademicTermId?: number,
) {
  const body = new FormData();
  body.append("file", file);
  if (presetCourseId !== undefined)
    body.append("preset_course_id", String(presetCourseId));
  if (presetAcademicTermId !== undefined)
    body.append("preset_academic_term_id", String(presetAcademicTermId));
  return api<LedgerImportResult>(`/api/v1/${ledger}-ledger/import`, {
    method: "POST",
    body,
  });
}

export function exportLedger(ledger: Ledger) {
  return binary(`/api/v1/${ledger}-ledger/export`);
}

export function getLedgerPdf(ledger: Ledger, studentId: number) {
  return binary(
    `/api/v1/${ledger}-ledger/pdf?student_id=${encodeURIComponent(studentId)}`,
  );
}
export function applyMembership(
  ledger: Ledger,
  id: number,
  membership: "NAPU" | "NORSUFFA",
) {
  return api<{ message: string; record_id: number }>(
    `/api/v1/${ledger}-ledger/${id}/apply-membership`,
    { method: "POST", body: JSON.stringify({ membership }) },
  );
}

export function applyLatinHonor(
  ledger: Ledger,
  id: number,
  latin_honor: "SUMMA" | "MAGNA" | "CUM_LAUDE",
) {
  return api<{ message: string; record_id: number }>(
    `/api/v1/${ledger}-ledger/${id}/apply-honor`,
    { method: "POST", body: JSON.stringify({ latin_honor }) },
  );
}

export function sendLedgerEmails(
  ledger: Ledger,
  payload: LedgerFilterParams & {
    student_ids?: number[];
    school_year?: string;
    semester?: string;
    semester_or_summer?: string;
    subject?: string;
    note?: string;
    exam_period?: "Midterm" | "Final";
    exam_deadline?: string;
  },
) {
  return api<{ message: string; queued_count: number }>(
    `/api/v1/${ledger}-ledger/send-emails`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}
