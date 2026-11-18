import { apiUrl } from "../../api/client";
import type { Ledger, LedgerFilterParams } from "./api";

export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount ?? 0);
  if (isNaN(num)) return "₱0.00";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(num);
}

export function formatLedgerDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatTransactionDate(value?: string | null): string {
  if (!value) return "—";
  const normalized = String(value).trim();
  if (!normalized) return "—";
  const datePart = normalized.includes("T")
    ? normalized.split("T")[0]
    : normalized.split(" ")[0];
  const parsedDate = new Date(`${datePart}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return datePart;
  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatDateInput(value?: string | null): string {
  if (!value) return "";
  const normalized = String(value).trim();
  if (!normalized) return "";
  const datePart = normalized.includes("T")
    ? normalized.split("T")[0]
    : normalized.split(" ")[0];
  const parsedDate = new Date(`${datePart}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return datePart;
  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function getEntryTypeBadge(type?: string): string {
  const normalized = (type ?? "").trim().toUpperCase();
  if (normalized === "PAYMENT" || normalized === "P") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40 font-semibold";
  }
  if (
    normalized === "ADJUSTMENT" ||
    normalized === "ADJ" ||
    normalized.includes("ADJUST")
  ) {
    return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/40 font-semibold";
  }
  return "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary font-semibold";
}

export function getRemarkBadge(remark?: string): string {
  const normalized = (remark ?? "").trim().toLowerCase();
  if (normalized === "outstanding") {
    return "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40 font-semibold";
  }
  if (normalized === "settled") {
    return "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40 font-semibold";
  }
  return "bg-muted text-muted-foreground border-border";
}

export function getEntryTypeBadgeVariant(
  type?: string,
): "destructive" | "success" | "info" | "outline" | "secondary" {
  if (!type) return "outline";
  switch (type.toLowerCase()) {
    case "ar":
      return "destructive";
    case "payment":
      return "success";
    case "adjustment":
      return "info";
    default:
      return "secondary";
  }
}

export function ledgerExportUrl(ledger: Ledger, filters?: LedgerFilterParams) {
  const query = new URLSearchParams();
  if (filters) {
    if (filters.search?.trim()) query.set("search", filters.search.trim());
    if (filters.entry_type) query.set("entry_type", filters.entry_type);
    if (filters.status) query.set("status", filters.status);
    if (filters.student_id) query.set("student_id", String(filters.student_id));
    if (filters.date_from) query.set("date_from", filters.date_from);
    if (filters.date_to) query.set("date_to", filters.date_to);
    if (filters.school_year) query.set("school_year", filters.school_year);
    if (filters.semester) query.set("semester", filters.semester);
    if (filters.course) query.set("course", filters.course);
    if (filters.balance_status) query.set("balance_status", filters.balance_status);
  }
  const qs = query.toString();
  return apiUrl(`/api/v1/${ledger}-ledger/export${qs ? `?${qs}` : ""}`);
}

export function ledgerPdfUrl(ledger: Ledger, studentId: string | number) {
  return apiUrl(
    `/api/v1/${ledger}-ledger/pdf?student_id=${encodeURIComponent(String(studentId))}`,
  );
}
