import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileDown,
  GraduationCap,
  Loader2,
  Mail,
  Pencil,
  Phone,
  PlusCircle,
  ReceiptText,
  RotateCcw,
  Scale,
  Wallet,
} from "lucide-react";
import type { Ledger, LedgerRecord } from "./api";
import { useLedgerBalance } from "./queries";
import { useLedgerPdf, useSendLedgerEmails } from "./mutations";
import { formatCurrency, formatLedgerDate } from "./controls";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StudentBalanceDrawerProps {
  ledger: Ledger;
  studentId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTransactionId?: number | null;
  onAddTransaction?: (studentId: number, studentName?: string) => void;
  onEditTransaction?: (record: LedgerRecord) => void;
}

function normalizeEntryType(type?: string | null): "ar" | "payment" | "adjustment" | "other" {
  const normalized = String(type ?? "").trim().toLowerCase();
  if (normalized === "ar") return "ar";
  if (["payment", "p"].includes(normalized)) return "payment";
  if (normalized.includes("adjust")) return "adjustment";
  return "other";
}

function entryLabel(type: string): string {
  const kind = normalizeEntryType(type);
  if (kind === "ar") return "AR";
  if (kind === "payment") return "Payment";
  if (kind === "adjustment") return "Adjustment";
  return type || "Transaction";
}

function transactionCourse(tx: LedgerRecord): string | null {
  return tx.course?.course_code ?? null;
}

function transactionTerm(tx: LedgerRecord): string | null {
  if (!tx.academic_term) return null;
  const sy = tx.academic_term.school_year;
  const sem = tx.academic_term.semester;
  if (sy && sem) return `${sy} (${sem})`;
  return sy || sem || null;
}

export function StudentBalanceDrawer({
  ledger,
  studentId,
  open,
  onOpenChange,
  selectedTransactionId = null,
  onAddTransaction,
  onEditTransaction,
}: StudentBalanceDrawerProps) {
  const query = useLedgerBalance(ledger, studentId ?? undefined);
  const pdfMutation = useLedgerPdf();
  const emailMutation = useSendLedgerEmails();

  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setEmailStatus(null);
  }, [open, studentId]);

  const data = query.data;
  const student = data?.student;
  const summary = data?.summary;
  const transactions = data?.transactions ?? [];

  const studentName =
    student?.name ||
    [student?.first_name, student?.last_name].filter(Boolean).join(" ") ||
    "Student";

  const totalCharges = summary?.total_charges ?? 0;
  const outstandingBalance = summary?.outstanding_balance ?? 0;
  const derivedAdjustments = transactions
    .filter((tx) => normalizeEntryType(tx.entry_type) === "adjustment")
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount ?? 0)), 0);
  const totalAdjustments =
    typeof summary?.total_adjustments === "number" ? summary.total_adjustments : derivedAdjustments;
  const totalPayments =
    typeof summary?.total_adjustments === "number"
      ? (summary?.total_payments ?? 0)
      : Math.max(0, (summary?.total_payments ?? 0) - derivedAdjustments);

  const studentCourse =
    student?.course ?? transactions.find((tx) => tx.course?.course_code)?.course?.course_code ?? null;
  const studentContact = student?.contactNumber ?? student?.contact_number ?? null;
  const selectedTransaction =
    selectedTransactionId != null
      ? transactions.find((tx) => Number(tx.id) === Number(selectedTransactionId)) ?? null
      : null;

  function handleDownloadPdf() {
    if (!studentId) return;
    pdfMutation.mutate(
      { ledger, studentId },
      {
        onSuccess: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${ledger}-statement-${student?.student_number || studentId}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        },
      },
    );
  }

  function handleSendEmail() {
    if (!studentId) return;
    setEmailStatus(null);
    emailMutation.mutate(
      {
        ledger,
        payload: {
          student_ids: [studentId],
          subject: `${ledger === "graduate" ? "Graduate" : "Law"} School Statement of Account`,
        },
      },
      {
        onSuccess: (res) => {
          setEmailStatus(res.message || "Statement email queued successfully.");
        },
      },
    );
  }

  function handleEditTransaction(tx: LedgerRecord) {
    onEditTransaction?.(tx);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 border-border bg-card p-0 text-card-foreground sm:max-w-xl">
        <SheetHeader className="border-b border-border bg-muted/40 px-6 py-5 pr-14">
          <SheetTitle className="text-lg font-bold text-foreground">
            Student balance
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Complete account summary and transaction history
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {query.isPending && (
            <div className="space-y-5" aria-label="Loading student balance">
              <div className="h-24 animate-pulse rounded-xl bg-muted" />
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-20 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
              <div className="h-64 animate-pulse rounded-xl bg-muted" />
            </div>
          )}

          {query.isError && (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Could not load student balance</p>
                  <p className="mt-1 text-xs">
                    {query.error instanceof Error ? query.error.message : "Network error"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => query.refetch()}
                className="h-8 shrink-0 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              <section className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                    {ledger === "law" ? (
                      <Scale className="h-5 w-5" />
                    ) : (
                      <GraduationCap className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-foreground">{studentName}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {student?.student_number && <span>{student.student_number}</span>}
                      {studentCourse && (
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          {studentCourse}
                        </Badge>
                      )}
                    </div>
                    {(student?.email || studentContact) && (
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {student?.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{student.email}</span>
                          </div>
                        )}
                        {studentContact && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{studentContact}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {emailStatus && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{emailStatus}</span>
                </div>
              )}

              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-900/50 dark:bg-blue-950/30">
                  <ReceiptText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <p className="mt-2 text-[11px] font-medium text-blue-700 dark:text-blue-300">
                    {ledger === "law" ? "Assessments" : "Account Receivables"}
                  </p>
                  <p className="mt-0.5 font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(totalCharges)}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                  <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="mt-2 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                    Payments
                  </p>
                  <p className="mt-0.5 font-bold text-emerald-900 dark:text-emerald-100">
                    {formatCurrency(totalPayments)}
                  </p>
                </div>
                {totalAdjustments > 0 && (
                  <div className="rounded-lg border border-purple-200 bg-purple-50/60 p-3 dark:border-purple-900/50 dark:bg-purple-950/30">
                    <Scale className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <p className="mt-2 text-[11px] font-medium text-purple-700 dark:text-purple-300">
                      Adjustments
                    </p>
                    <p className="mt-0.5 font-bold text-purple-900 dark:text-purple-100">
                      {formatCurrency(totalAdjustments)}
                    </p>
                  </div>
                )}
                <div
                  className={`rounded-lg border p-3 ${
                    outstandingBalance > 0
                      ? "border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/30"
                      : "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/30"
                  }`}
                >
                  <AlertCircle
                    className={`h-4 w-4 ${
                      outstandingBalance > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  />
                  <p
                    className={`mt-2 text-[11px] font-medium ${
                      outstandingBalance > 0
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-emerald-700 dark:text-emerald-300"
                    }`}
                  >
                    Current balance
                  </p>
                  <p
                    className={`mt-0.5 font-bold ${
                      outstandingBalance > 0
                        ? "text-amber-900 dark:text-amber-100"
                        : "text-emerald-900 dark:text-emerald-100"
                    }`}
                  >
                    {formatCurrency(outstandingBalance)}
                  </p>
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-foreground">Transaction timeline</h3>
                  <span className="text-xs text-muted-foreground">
                    {transactions.length} entries
                  </span>
                </div>
                {transactions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No transactions found for this student.
                  </div>
                ) : (
                  <ol className="relative ml-2 border-l border-border">
                    {transactions.map((tx) => {
                      const kind = normalizeEntryType(tx.entry_type);
                      const credit = kind === "payment" || kind === "adjustment";
                      const dotClass =
                        kind === "adjustment"
                          ? "bg-purple-500"
                          : kind === "payment"
                            ? "bg-emerald-500"
                            : "bg-primary";
                      const amountClass =
                        kind === "adjustment"
                          ? "text-purple-600 dark:text-purple-400"
                          : kind === "payment"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-primary";
                      const term = transactionTerm(tx);
                      const course = transactionCourse(tx);
                      const isSelected =
                        selectedTransactionId != null &&
                        Number(tx.id) === Number(selectedTransactionId);

                      return (
                        <li key={tx.id} className="relative pb-5 pl-6 last:pb-0">
                          <span
                            className={`absolute -left-2 top-1 flex h-4 w-4 rounded-full border-2 border-background ${dotClass}`}
                          />
                          <div
                            className={`rounded-lg border bg-card p-3 transition-shadow ${
                              isSelected
                                ? "border-primary/40 ring-2 ring-primary/20"
                                : "border-border"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-medium text-foreground">
                                    {tx.particulars || entryLabel(tx.entry_type)}
                                  </p>
                                  {onEditTransaction && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                                      onClick={() => handleEditTransaction(tx)}
                                      title="Edit transaction"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                                  <span className="inline-flex items-center gap-1">
                                    <CalendarDays className="h-3 w-3" />
                                    {formatLedgerDate(tx.transaction_date)}
                                  </span>
                                  {course && <span>{course}</span>}
                                  {term && <span>{term}</span>}
                                </p>
                              </div>
                              <p className={`shrink-0 font-bold ${amountClass}`}>
                                {credit ? "−" : "+"}
                                {formatCurrency(Math.abs(Number(tx.amount ?? 0)))}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-3 border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
                              {tx.orLink ? (
                                <a
                                  href={tx.orLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  {tx.reference_number || "View OR"}
                                </a>
                              ) : (
                                <span>{tx.reference_number || "No reference number"}</span>
                              )}
                              {tx.units && Number(tx.units) > 0 && (
                                <span>
                                  {tx.units} units @ {formatCurrency(tx.rate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            </div>
          )}
        </div>

        {data && (
          <SheetFooter className="flex-row flex-wrap items-center gap-2 border-t border-border bg-card px-6 py-4 sm:flex-row sm:justify-start">
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={pdfMutation.isPending}
              className="gap-2 border-input text-foreground hover:bg-muted"
            >
              {pdfMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleSendEmail}
              disabled={emailMutation.isPending}
              className="gap-2 border-input text-foreground hover:bg-muted"
            >
              {emailMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Email
            </Button>

            {onEditTransaction && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => selectedTransaction && handleEditTransaction(selectedTransaction)}
                disabled={!selectedTransaction}
                className="border-input text-foreground hover:bg-muted"
                title={selectedTransaction ? "Edit selected transaction" : "Select a transaction to edit"}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}

            {onAddTransaction && studentId && (
              <Button
                onClick={() => onAddTransaction(studentId, studentName)}
                className="ml-auto flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:flex-none"
              >
                <PlusCircle className="h-4 w-4" />
                Add payment
              </Button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
