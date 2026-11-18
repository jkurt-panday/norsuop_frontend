import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileDown,
  GraduationCap,
  Inbox,
  Loader2,
  Mail,
  Plus,
  Receipt,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { ApiError } from "../../api/client";
import { type Ledger } from "./api";
import { useLedgerBalance } from "./queries";
import { useLedgerPdf, useSendLedgerEmails } from "./mutations";
import {
  formatCurrency,
  formatLedgerDate,
  getEntryTypeBadgeVariant,
} from "./controls";
import { LedgerTransactionForm } from "./LedgerTransactionForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function LedgerBalancePage({ ledger }: { ledger: Ledger }) {
  const isLaw = ledger === "law";
  const params = useParams();
  const studentId = Number(params.studentId);
  const isValidId = Number.isInteger(studentId) && studentId > 0;

  const query = useLedgerBalance(ledger, isValidId ? studentId : undefined);
  const pdfMutation = useLedgerPdf();
  const emailMutation = useSendLedgerEmails();

  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  const data = query.data;
  const student = data?.student;
  const summary = data?.summary;
  const transactions = data?.transactions ?? [];

  const studentName =
    student?.name ||
    [student?.first_name, student?.last_name].filter(Boolean).join(" ") ||
    `Student #${studentId}`;

  const outstandingBalance = summary?.outstanding_balance ?? 0;
  const isBalanceSettled = outstandingBalance <= 0;

  function handleDownloadPdf() {
    if (!isValidId) return;
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
    if (!isValidId) return;
    setEmailStatus(null);
    emailMutation.mutate(
      {
        ledger,
        payload: {
          student_ids: [studentId],
          subject: `${isLaw ? "Law" : "Graduate"} School Statement of Account`,
        },
      },
      {
        onSuccess: (res) => {
          setEmailStatus(res.message || "Statement email queued successfully.");
        },
      },
    );
  }

  if (query.isPending) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (query.isError || !isValidId) {
    return (
      <div className="space-y-6 pb-12">
        <Link
          to={`/${ledger}-ledger`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {isLaw ? "Law School" : "Graduate"} Ledger
        </Link>
        <Card className="border-rose-200 bg-rose-50 p-6 dark:border-rose-900/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-3 text-rose-800 dark:text-rose-300">
            <AlertCircle className="h-6 w-6" />
            <div>
              <h2 className="text-lg font-bold">Unable to load student ledger balance</h2>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
                {query.error instanceof ApiError
                  ? query.error.message
                  : "Invalid student identifier or student account not found."}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link
            to={`/${ledger}-ledger`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to {isLaw ? "Law School" : "Graduate"} Ledger
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              {isLaw ? (
                <Scale className="h-5 w-5" />
              ) : (
                <GraduationCap className="h-5 w-5" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
                {studentName}
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                {student?.student_number
                  ? `Student ID: ${student.student_number}`
                  : `ID: #${studentId}`}
                {" · "}
                <span className="capitalize">{ledger} School</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={pdfMutation.isPending}
            className="gap-2 shadow-xs"
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
            className="gap-2 shadow-xs"
          >
            {emailMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 text-blue-600" />
            )}
            Send Email
          </Button>

          <Button
            size="sm"
            onClick={() => setTransactionModalOpen(true)}
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Email Alert */}
      {emailStatus && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{emailStatus}</span>
        </div>
      )}

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Total Assessment (AR)</span>
              <TrendingUp className="h-4 w-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground font-mono">
              {formatCurrency(summary?.total_charges ?? 0)}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Total fees charged to account
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Total Payments & Credits</span>
              <TrendingDown className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground font-mono">
              {formatCurrency(summary?.total_payments ?? 0)}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Total collections & adjustments
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border shadow-xs ${
            isBalanceSettled
              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
              : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Outstanding Balance</span>
              <Scale
                className={`h-4 w-4 ${
                  isBalanceSettled ? "text-emerald-600" : "text-amber-600"
                }`}
              />
            </div>
            <div
              className={`mt-2 text-2xl font-bold font-mono ${
                isBalanceSettled
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-amber-700 dark:text-amber-400"
              }`}
            >
              {formatCurrency(outstandingBalance)}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {isBalanceSettled ? "Account fully settled" : "Pending settlement"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History Table */}
      <Card className="border shadow-xs overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Transaction History
            </h2>
            <Badge variant="outline" className="text-xs font-mono ml-1">
              {transactions.length} record{transactions.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-28 text-xs font-semibold">Date</TableHead>
                <TableHead className="w-28 text-xs font-semibold">Ref #</TableHead>
                <TableHead className="text-xs font-semibold">Course / Term</TableHead>
                <TableHead className="text-xs font-semibold">Particulars</TableHead>
                <TableHead className="w-24 text-xs font-semibold text-center">Type</TableHead>
                <TableHead className="w-28 text-xs font-semibold text-right">Units / Rate</TableHead>
                <TableHead className="w-32 text-xs font-semibold text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                      <Inbox className="h-7 w-7 text-muted-foreground/50" />
                      <p className="text-sm font-medium">No ledger transactions posted.</p>
                      <p className="text-xs">
                        Click "New Transaction" above to add an assessment or payment.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {formatLedgerDate(tx.transaction_date)}
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {tx.reference_number || "—"}
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="font-medium text-foreground">
                        {tx.course?.course_code || "—"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {tx.academic_term
                          ? `${tx.academic_term.school_year} (${tx.academic_term.semester})`
                          : "—"}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="font-medium text-foreground">
                        {tx.particulars}
                      </div>
                      {tx.remarks && (
                        <div className="text-[11px] text-muted-foreground italic">
                          {tx.remarks}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant={getEntryTypeBadgeVariant(tx.entry_type)}
                        size="sm"
                        className="uppercase font-mono text-[10px]"
                      >
                        {tx.entry_type}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {tx.units && Number(tx.units) > 0 ? (
                        <div>
                          <span>{tx.units}u</span> @ {formatCurrency(tx.rate)}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-semibold whitespace-nowrap">
                      <span
                        className={
                          tx.entry_type === "ar"
                            ? "text-foreground"
                            : "text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {tx.entry_type === "ar" ? "" : "-"}
                        {formatCurrency(tx.amount)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Transaction Modal (for adding to this student) */}
      <LedgerTransactionForm
        ledger={ledger}
        open={transactionModalOpen}
        onOpenChange={setTransactionModalOpen}
        mode="create"
        defaultStudentId={studentId}
        defaultStudentName={studentName}
      />
    </div>
  );
}
