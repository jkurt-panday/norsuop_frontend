import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  ArrowLeft,
  Filter,
  Printer,
  Search,
  X,
  CreditCard,
  GraduationCap,
  Scale,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Ledger } from "./api";
import { useLedgerBalance, useLedgerStudents } from "./queries";

interface PrintSelectPageProps {
  ledger: Ledger;
}

function currency(n: number) {
  return `₱${(n || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getEntryTypeBadgeClass(type?: string | null): string {
  const normalized = (type ?? "").trim().toUpperCase();
  if (normalized === "PAYMENT" || normalized === "P") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40 font-semibold";
  }
  if (normalized.includes("ADJUST")) {
    return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/40 font-semibold";
  }
  return "bg-primary/10 text-primary border-primary/20 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/40 font-semibold";
}

function formatTransactionDate(value?: string | null) {
  if (!value) return "-";
  const normalized = String(value).trim();
  if (!normalized) return "-";
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

function transactionTimestamp(value?: string | null) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function PrintSelectPage({ ledger }: PrintSelectPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const studentIdParam = searchParams.get("student_id");
  const selectedStudentId = studentIdParam ? Number(studentIdParam) : null;

  const [studentSearch, setStudentSearch] = useState("");
  const [schoolYearFilter, setSchoolYearFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

  // Query all eligible students for selector
  const studentsQuery = useLedgerStudents(ledger, studentSearch);
  const students = studentsQuery.data?.data ?? [];

  // Query selected student's balance and transactions
  const balanceQuery = useLedgerBalance(ledger, selectedStudentId ?? 0);
  const balanceData = selectedStudentId ? balanceQuery.data : null;
  const records = balanceData?.transactions ?? [];
  const summary = balanceData?.summary ?? {
    total_charges: 0,
    total_payments: 0,
    outstanding_balance: 0,
  };

  const isGraduate = ledger === "graduate";
  const title = isGraduate
    ? "Graduate Student Statement Printer"
    : "Law Student Statement Printer";
  const collegeName = isGraduate ? "Graduate School" : "College of Law";
  const backHref = isGraduate ? "/graduate-ledger" : "/law-ledger";

  const schoolYears = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map((r) => r.academic_term?.school_year)
          .filter((v): v is string => Boolean(v)),
      ),
    ).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }, [records]);

  const semesters = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map((r) => r.academic_term?.semester)
          .filter((v): v is string => Boolean(v)),
      ),
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [records]);

  const recordTypes = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map((r) => r.entry_type)
          .filter((v): v is string => Boolean(v)),
      ),
    ).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records
      .filter((record) => {
        const sy = record.academic_term?.school_year;
        const sem = record.academic_term?.semester;
        const entry = record.entry_type;

        return (
          (schoolYearFilter === "all" || sy === schoolYearFilter) &&
          (semesterFilter === "all" || sem === semesterFilter) &&
          (typeFilter === "all" || entry === typeFilter)
        );
      })
      .sort((a, b) => {
        const dateDifference =
          transactionTimestamp(b.transaction_date) -
          transactionTimestamp(a.transaction_date);
        const latestDifference = dateDifference || b.id - a.id;
        return sortOrder === "latest" ? latestDifference : -latestDifference;
      });
  }, [records, schoolYearFilter, semesterFilter, typeFilter, sortOrder]);

  const hasActiveFilters =
    schoolYearFilter !== "all" ||
    semesterFilter !== "all" ||
    typeFilter !== "all" ||
    sortOrder !== "latest";

  const resetRecordFilters = () => {
    setSchoolYearFilter("all");
    setSemesterFilter("all");
    setTypeFilter("all");
    setSortOrder("latest");
  };

  const handleSelectStudent = (id: number) => {
    setSearchParams({ student_id: String(id) });
    resetRecordFilters();
  };

  const handleOpenPdf = () => {
    if (!selectedStudentId) return;
    const baseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
    const params = new URLSearchParams({ student_id: String(selectedStudentId) });
    if (schoolYearFilter !== "all") params.set("school_year", schoolYearFilter);
    if (semesterFilter !== "all") params.set("semester", semesterFilter);
    if (typeFilter !== "all") params.set("type", typeFilter);

    window.open(`${baseUrl}/api/v1/${ledger}-ledger/pdf?${params.toString()}`, "_blank");
  };

  return (
    <div className="min-h-full bg-page-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link
                to={backHref}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted"
                title="Back to Ledger"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <CardTitle className="bg-[#3399FF] font-['Poppins'] bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl">
                {title}
              </CardTitle>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Select a {collegeName} student to review their transaction breakdown and print a formal Statement of Account PDF.
            </p>
          </div>

          {selectedStudentId && (
            <Button
              type="button"
              onClick={handleOpenPdf}
              className="gap-2 bg-primary text-white shadow hover:bg-primary/90"
            >
              <Printer className="h-4 w-4" />
              Print Statement
            </Button>
          )}
        </div>

        {/* Student Selector Card */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">
              Select Student
            </CardTitle>
            <CardDescription>
              Search by student number or full name
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Student Dropdown / Quick Selection */}
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
              {studentsQuery.isPending ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : students.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No students found matching "{studentSearch}".
                </div>
              ) : (
                students.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectStudent(s.id)}
                    className={`flex w-full items-center justify-between p-3 text-left text-sm transition-colors hover:bg-muted/60 ${
                      selectedStudentId === s.id
                        ? "bg-primary/10 font-semibold text-primary dark:bg-primary/20"
                        : "text-foreground"
                    }`}
                  >
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{s.student_number}</div>
                    </div>
                    {selectedStudentId === s.id && (
                      <Badge className="bg-primary text-white">Selected</Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Student Statement Section */}
        {selectedStudentId ? (
          balanceQuery.isPending ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          ) : balanceData ? (
            <div className="space-y-6">
              {/* Financial Metrics Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    <span>Total Assessments</span>
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-foreground">
                    {currency(summary.total_charges)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Accounts receivable billed</p>
                </Card>

                <Card className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    <span>Total Payments</span>
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-foreground">
                    {currency(summary.total_payments)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Settled fees and adjustments</p>
                </Card>

                <Card
                  className={`rounded-2xl p-5 border ${
                    summary.outstanding_balance > 0
                      ? "border-rose-100 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20"
                      : "border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between text-xs font-semibold uppercase tracking-wider ${
                      summary.outstanding_balance > 0
                        ? "text-rose-700 dark:text-rose-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span>Outstanding Balance</span>
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-foreground">
                    {currency(summary.outstanding_balance)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {summary.outstanding_balance > 0 ? "Pending collection" : "Account settled"}
                  </p>
                </Card>
              </div>

              {/* Transactions Table & Filters */}
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">
                      Transaction Breakdown
                    </CardTitle>
                    <CardDescription>
                      {filteredRecords.length} record(s) logged for {balanceData.student.name}
                    </CardDescription>
                  </div>
                  {hasActiveFilters && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetRecordFilters}
                      className="gap-1 text-xs text-muted-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear Filters
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Inline Filter Controls */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">School Year</label>
                      <select
                        value={schoolYearFilter}
                        onChange={(e) => setSchoolYearFilter(e.target.value)}
                        className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="all">All School Years</option>
                        {schoolYears.map((sy) => (
                          <option key={sy} value={sy}>
                            {sy}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Semester</label>
                      <select
                        value={semesterFilter}
                        onChange={(e) => setSemesterFilter(e.target.value)}
                        className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="all">All Semesters</option>
                        {semesters.map((sem) => (
                          <option key={sem} value={sem}>
                            {sem}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Entry Type</label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="all">All Types</option>
                        {recordTypes.map((t) => (
                          <option key={t} value={t}>
                            {t.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Sort Order</label>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                        className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="latest">Latest First</option>
                        <option value="oldest">Oldest First</option>
                      </select>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-hidden rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Ref No.</TableHead>
                          <TableHead>Term</TableHead>
                          <TableHead>Particulars</TableHead>
                          <TableHead className="text-center">Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecords.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                              No transactions found matching criteria.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredRecords.map((r) => {
                            const rawAmount = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount));
                            return (
                              <TableRow key={r.id}>
                                <TableCell className="text-xs text-muted-foreground">
                                  {formatTransactionDate(r.transaction_date)}
                                </TableCell>
                                <TableCell className="font-mono text-xs font-semibold text-primary">
                                  {r.reference_number || "—"}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {r.academic_term ? `${r.academic_term.school_year} · ${r.academic_term.semester}` : "—"}
                                </TableCell>
                                <TableCell className="text-sm font-medium text-foreground">
                                  {r.particulars}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className={getEntryTypeBadgeClass(r.entry_type)}>
                                    {r.entry_type.toUpperCase()}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm font-semibold text-foreground">
                                  {currency(rawAmount || 0)}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              Unable to load student statement. Please try selecting again.
            </Card>
          )
        ) : (
          <Card className="p-12 text-center text-muted-foreground">
            <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold text-foreground">No Student Selected</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Please choose a student from the list above to view their financial ledger and statement.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
