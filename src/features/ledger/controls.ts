import { apiUrl } from "../../api/client";
import type { Ledger } from "./api";
export function ledgerExportUrl(ledger: Ledger) {
  return apiUrl(`/api/v1/${ledger}-ledger/export`);
}
export function ledgerPdfUrl(ledger: Ledger, studentId: string) {
  return apiUrl(
    `/api/v1/${ledger}-ledger/pdf?student_id=${encodeURIComponent(studentId)}`,
  );
}
