import { api, binary } from "../../api/client";
import type { components } from "../../api/schema";

export type Ledger = "graduate" | "law";
export type LedgerRecord = {
  id: number;
  student_id: number;
  entry_type: string;
  transaction_date: string;
  particulars: string;
  amount: number | string;
  status: string;
  student?: {
    student_number?: string;
    first_name?: string;
    last_name?: string;
  };
  course?: { course_code?: string; course_desc?: string };
  academic_term?: { school_year?: string; semester?: string };
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
};
export type LedgerImportResult = components["schemas"]["LedgerImportResult"];
export type LedgerTransactionRequest =
  components["schemas"]["LedgerTransactionRequest"];
export function getLedgerRecords(
  ledger: Ledger,
  page = 1,
  search = "",
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ page: String(page), per_page: "20" });
  if (search.trim()) query.set("search", search.trim());
  return api<LedgerList>(`/api/v1/${ledger}-ledger?${query}`, { signal });
}
export function getLedgerBalance(
  ledger: Ledger,
  studentId: number,
  signal?: AbortSignal,
) {
  return api<{
    student: unknown;
    summary: Record<string, number>;
    transactions: LedgerRecord[];
  }>(`/api/v1/${ledger}-ledger/students/${studentId}/balance`, { signal });
}
export function createLedgerRecord(
  ledger: Ledger,
  payload: LedgerTransactionRequest,
) {
  return api(`/api/v1/${ledger}-ledger`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
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
