import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowLeft, Filter, Printer, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const normalized = (type ?? "").trim().toLowerCase();
  if (normalized === "payment" || normalized === "p") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40 font-semibold";
  }
  if (normalized.includes("adjust")) {
    return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/40 font-semibold";
  }
  return "bg-primary/10 text-primary border-primary/20 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/40 font-semibold";
}

function isDeduction(type?: string | null) {
  const normalized = (type ?? "").trim().toLowerCase();

  return normalized === "payment" || normalized === "p" || normalized.includes("adjust");
}

function entryTypeLabel(type?: string | null) {
  const normalized = (type ?? "").trim();
  if (!normalized) return "—";
  if (normalized.toLowerCase() === "ar") return "AR";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
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
  const collegeName = isGraduate ? "graduate" : "law";
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

  const totalAdjustments = useMemo(() => {
    return records
      .filter((r) => (r.entry_type ?? "").toLowerCase().includes("adjust"))
      .reduce((sum, r) => sum + absoluteAmount(r.amount), 0);
  }, [records]);

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

  const selectedStudentName = useMemo(() => {
    if (!selectedStudentId) return "Student Record";
    const fromList = students.find(
      (s) => String(s.id) === String(selectedStudentId),
    );
    if (fromList?.name) return fromList.name;
    if (balanceData?.student?.name) return balanceData.student.name;
    const first = balanceData?.student?.first_name ?? "";
    const last = balanceData?.student?.last_name ?? "";
    return `${first} ${last}`.trim() || "Student Record";
  }, [balanceData, selectedStudentId, students]);

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
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="bg-[#3399FF] bg-clip-text font-['Poppins'] text-3xl font-black tracking-tight text-transparent sm:text-4xl">
            Student Statement Printer
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a {collegeName} student to review their transaction breakdown
            and print a formal SOA PDF.
          </p>
        </div>
        <div className="flex items-center sm:self-start">
          <Link
            to={backHref}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-border bg-transparent px-3 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-muted"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left: Interactive List Search */}
        <Card className="border-border bg-card md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Search Student
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Click a name to preview records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Type to filter list..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pr-8 pl-9"
              />
              {studentSearch && (
                <button
                  type="button"
                  onClick={() => setStudentSearch("")}
                  aria-label="Clear search"
                  className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Dropdown for Mobile */}
            <div className="block md:hidden">
              <select
                value={selectedStudentId ? String(selectedStudentId) : ""}
                onChange={(event) =>
                  event.target.value &&
                  handleSelectStudent(Number(event.target.value))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
              >
                <option value="">-- Choose Student --</option>
                {students.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* List for Desktop */}
            <div className="hidden max-h-[380px] overflow-y-auto rounded-md border border-border md:block">
              {studentsQuery.isPending ? (
                <div className="space-y-2 p-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : students.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  No students found.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {students.map((s) => {
                    const isActive = String(selectedStudentId) === String(s.id);

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectStudent(s.id)}
                        className={`w-full px-3 py-2 text-left text-xs transition-colors hover:bg-muted/40 ${
                          isActive
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Detailed SOA preview */}
        <div className="space-y-6 md:col-span-2">
          {selectedStudentId ? (
            balanceQuery.isPending ? (
              <div className="space-y-6">
                <Skeleton className="h-24 rounded-xl" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                </div>
                <Skeleton className="h-64 rounded-xl" />
              </div>
            ) : balanceData ? (
              <div className="space-y-6">
                {/* Selected Student Information */}
                <Card className="border-border bg-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-lg font-bold text-foreground">
                        {selectedStudentName}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Showing {filteredRecords.length} of {records.length}{" "}
                        transactions
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleOpenPdf}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      size="sm"
                    >
                      <Printer className="mr-1.5 h-4 w-4" /> Print Statement
                    </Button>
                  </CardHeader>
                </Card>

                {/* Stats Row */}
                <div
                  className={`grid grid-cols-1 gap-4 ${
                    totalAdjustments > 0 ? "sm:grid-cols-4" : "sm:grid-cols-3"
                  }`}
                >
                  <Card className="border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">
                      Total Billed Charges (AR)
                    </p>
                    <h3 className="mt-1 text-base font-bold text-foreground">
                      {currency(summary.total_charges)}
                    </h3>
                  </Card>
                  <Card className="border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">
                      Total Payments Received
                    </p>
                    <h3 className="mt-1 text-base font-bold text-emerald-600">
                      {currency(summary.total_payments)}
                    </h3>
                  </Card>
                  {totalAdjustments > 0 && (
                    <Card className="border-purple-200 bg-purple-50/40 p-4 dark:border-purple-800 dark:bg-purple-950/40">
                      <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                        Total Adjustments
                      </p>
                      <h3 className="mt-1 text-base font-bold text-purple-900 dark:text-purple-100">
                        {currency(totalAdjustments)}
                      </h3>
                    </Card>
                  )}
                  <Card className="border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">
                      Outstanding Balance
                    </p>
                    <h3 className="mt-1 text-base font-bold text-foreground">
                      {currency(summary.outstanding_balance)}
                    </h3>
                  </Card>
                </div>

                <Card className="border-border bg-card">
                  <CardContent className="pt-6">
                    <div className="mb-5 rounded-lg border border-border bg-muted/30 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Filter className="h-4 w-4" />
                          Transaction Filters
                        </div>
                        {hasActiveFilters && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={resetRecordFilters}
                            className="h-7 text-xs text-primary"
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="space-y-1 text-xs text-muted-foreground">
                          <span>School Year</span>
                          <select
                            value={schoolYearFilter}
                            onChange={(event) =>
                              setSchoolYearFilter(event.target.value)
                            }
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                          >
                            <option value="all">All school years</option>
                            {schoolYears.map((schoolYear) => (
                              <option key={schoolYear} value={schoolYear}>
                                {schoolYear}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="space-y-1 text-xs text-muted-foreground">
                          <span>Term</span>
                          <select
                            value={semesterFilter}
                            onChange={(event) =>
                              setSemesterFilter(event.target.value)
                            }
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                          >
                            <option value="all">All terms</option>
                            {semesters.map((semester) => (
                              <option key={semester} value={semester}>
                                {semester}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="space-y-1 text-xs text-muted-foreground">
                          <span>Type</span>
                          <select
                            value={typeFilter}
                            onChange={(event) =>
                              setTypeFilter(event.target.value)
                            }
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                          >
                            <option value="all">All types</option>
                            {recordTypes.map((recordType) => (
                              <option key={recordType} value={recordType}>
                                {entryTypeLabel(recordType)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="space-y-1 text-xs text-muted-foreground">
                          <span>Order</span>
                          <select
                            value={sortOrder}
                            onChange={(event) =>
                              setSortOrder(
                                event.target.value as "latest" | "oldest",
                              )
                            }
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                          >
                            <option value="latest">Latest first</option>
                            <option value="oldest">Oldest first</option>
                          </select>
                        </label>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/30 font-semibold text-foreground">
                            <th className="px-3 py-3">Date</th>
                            <th className="px-3 py-3">S.Y. / Term</th>
                            <th className="px-3 py-3">Ref / OR #</th>
                            <th className="px-3 py-3">Particulars</th>
                            <th className="px-3 py-3">Type</th>
                            <th className="px-3 py-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecords.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="py-6 text-center text-muted-foreground"
                              >
                                No transactions match the selected filters.
                              </td>
                            </tr>
                          ) : (
                            filteredRecords.map((r) => {
                              const deduction = isDeduction(r.entry_type);
                              const adjustment = (r.entry_type ?? "")
                                .toLowerCase()
                                .includes("adjust");
                              const amount = absoluteAmount(r.amount);

                              return (
                                <tr
                                  key={r.id}
                                  className="border-b border-border hover:bg-muted/40"
                                >
                                  <td className="px-3 py-2 text-foreground">
                                    {formatTransactionDate(r.transaction_date)}
                                  </td>
                                  <td className="px-3 py-2 text-foreground">
                                    {r.academic_term?.school_year ?? "—"} (
                                    {r.academic_term?.semester ?? "—"})
                                  </td>
                                  <td className="px-3 py-2 text-foreground">
                                    {r.reference_number || "-"}
                                  </td>
                                  <td className="px-3 py-2 text-foreground">
                                    {r.particulars || "-"}
                                  </td>
                                  <td className="px-3 py-2">
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] ${getEntryTypeBadgeClass(
                                        r.entry_type,
                                      )}`}
                                    >
                                      {entryTypeLabel(r.entry_type)}
                                    </Badge>
                                  </td>
                                  <td
                                    className={`px-3 py-2 text-right font-medium ${
                                      deduction
                                        ? adjustment
                                          ? "text-purple-700"
                                          : "text-emerald-700"
                                        : "text-foreground"
                                    }`}
                                  >
                                    {deduction ? "−" : ""}
                                    {currency(amount)}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Unable to load student statement. Please try selecting again.
              </Card>
            )
          ) : (
            <Card className="flex flex-col items-center justify-center border-dashed border-border bg-card p-12 text-center">
              <Printer className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">
                No Student Selected
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Choose a {collegeName} student from the left panel to preview
                their statement and generate a print-ready SOA PDF.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function absoluteAmount(value: string | number | null | undefined) {
  const numeric = typeof value === "number" ? value : parseFloat(String(value));

  return Number.isNaN(numeric) ? 0 : Math.abs(numeric);
}
