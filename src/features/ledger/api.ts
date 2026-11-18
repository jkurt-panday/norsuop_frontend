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
  name: string;
  email: string;
};

export type LedgerStudent = {
  id: number;
  student_number: string;
  name: string;
};

export type LedgerSummary = {
  total_charges: number;
  total_payments: number;
  outstanding_balance: number;
};

export type LedgerBalanceResponse = {
  student: {
    id: number;
    student_number?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
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
export type LedgerTransactionRequest =
  components["schemas"]["LedgerTransactionRequest"];

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
  signal?: AbortSignal,
) {
  return api<{ data: LedgerRecipient[] }>(
    `/api/v1/${ledger}-ledger/email-recipients`,
    { signal },
  );
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
export function sendLedgerEmails(
  ledger: Ledger,
  payload: {
    student_ids: number[];
    school_year?: string;
    semester?: string;
    subject?: string;
    note?: string;
  },
) {
  return api<{ message: string; queued_count: number }>(
    `/api/v1/${ledger}-ledger/send-emails`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}
