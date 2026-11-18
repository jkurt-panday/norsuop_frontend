import { useState } from "react";
import {
  FileDown,
  Mail,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  Scale,
  Receipt,
  User,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import type { Ledger } from "./api";
import { useLedgerBalance } from "./queries";
import { useLedgerPdf, useSendLedgerEmails } from "./mutations";
import { formatCurrency, formatLedgerDate, getEntryTypeBadgeVariant } from "./controls";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentBalanceDrawerProps {
  ledger: Ledger;
  studentId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTransaction?: (studentId: number, studentName?: string) => void;
}

export function StudentBalanceDrawer({
  ledger,
  studentId,
  open,
  onOpenChange,
  onAddTransaction,
}: StudentBalanceDrawerProps) {
  const query = useLedgerBalance(ledger, studentId ?? undefined);
  const pdfMutation = useLedgerPdf();
  const emailMutation = useSendLedgerEmails();

  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  const data = query.data;
  const student = data?.student;
  const summary = data?.summary;
  const transactions = data?.transactions ?? [];

  const studentName =
    student?.name ||
    [student?.first_name, student?.last_name].filter(Boolean).join(" ") ||
    "Student";

  const outstandingBalance = summary?.outstanding_balance ?? 0;
  const isBalanceSettled = outstandingBalance <= 0;

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto p-6 flex flex-col gap-6"
      >
        <SheetHeader className="p-0 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              <User className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold">
                {studentName}
              </SheetTitle>
              <SheetDescription className="text-xs font-mono">
                {student?.student_number
                  ? `ID: ${student.student_number}`
                  : `Student #${studentId}`}
                {" · "}
                <span className="capitalize">{ledger} School Ledger</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {query.isPending ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : query.isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4" />
              Failed to load student balance
            </div>
            <p className="mt-1 text-xs">
              {query.error instanceof Error ? query.error.message : "Network error"}
            </p>
          </div>
        ) : (
          <>
            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={pdfMutation.isPending}
                className="gap-2"
              >
                {pdfMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 text-blue-600" />
                )}
                Download PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendEmail}
                disabled={emailMutation.isPending}
                className="gap-2"
              >
                {emailMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 text-blue-600" />
                )}
                Send Email
              </Button>
              {onAddTransaction && studentId && (
                <Button
                  size="sm"
                  onClick={() => onAddTransaction(studentId, studentName)}
                  className="gap-2 ml-auto bg-blue-600 text-white hover:bg-blue-700"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Transaction
                </Button>
              )}
            </div>

            {/* Email dispatch alert */}
            {emailStatus && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{emailStatus}</span>
              </div>
            )}

            {/* Financial KPI Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card className="border shadow-xs">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                    <span>Total Assessment (AR)</span>
                    <TrendingUp className="h-4 w-4 text-rose-500" />
                  </div>
                  <div className="mt-2 text-lg font-bold text-foreground font-mono">
                    {formatCurrency(summary?.total_charges ?? 0)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-xs">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                    <span>Total Payments</span>
                    <TrendingDown className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 text-lg font-bold text-foreground font-mono">
                    {formatCurrency(summary?.total_payments ?? 0)}
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`border shadow-xs ${
                  isBalanceSettled
                    ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30"
                    : "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/30"
                }`}
              >
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                    <span>Outstanding Balance</span>
                    <Scale
                      className={`h-4 w-4 ${
                        isBalanceSettled ? "text-emerald-600" : "text-amber-600"
                      }`}
                    />
                  </div>
                  <div
                    className={`mt-2 text-lg font-bold font-mono ${
                      isBalanceSettled
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {formatCurrency(outstandingBalance)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  Transaction History ({transactions.length})
                </h3>
              </div>

              {transactions.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm">
                  No ledger transactions recorded yet.
                </div>
              ) : (
                <div className="divide-y rounded-xl border bg-card">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={getEntryTypeBadgeVariant(tx.entry_type)}
                            size="sm"
                            className="uppercase font-mono text-[10px]"
                          >
                            {tx.entry_type}
                          </Badge>
                          <span className="font-medium text-sm text-foreground">
                            {tx.particulars}
                          </span>
                          {tx.reference_number && (
                            <span className="text-xs text-muted-foreground font-mono">
                              Ref: {tx.reference_number}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3">
                          <span>{formatLedgerDate(tx.transaction_date)}</span>
                          {tx.course?.course_code && (
                            <span>{tx.course.course_code}</span>
                          )}
                          {tx.academic_term && (
                            <span>
                              {tx.academic_term.school_year} (
                              {tx.academic_term.semester})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right sm:shrink-0">
                        <div
                          className={`font-mono font-semibold text-sm ${
                            tx.entry_type === "ar"
                              ? "text-foreground"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {tx.entry_type === "ar" ? "" : "-"}
                          {formatCurrency(tx.amount)}
                        </div>
                        {tx.units && Number(tx.units) > 0 && (
                          <div className="text-[11px] text-muted-foreground">
                            {tx.units} units @ {formatCurrency(tx.rate)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
