import { useState, useTransition, useRef, useEffect } from "react";
import {
  Search,
  DollarSign,
  GraduationCap,
  Wallet,
  AlertTriangle,
  PlusCircle,
  Pencil,
  Trash2,
  XCircle,
  Filter,
  Loader2,
  Columns3,
  Mail,
  Download,
  ChevronDown,
  Sparkles,
  Award,
  RefreshCw,
} from "lucide-react";
import {
  type Ledger,
  type LedgerFilterParams,
  type LedgerRecord,
} from "./api";
import { useLedgerRecords } from "./queries";
import { useDeleteLedgerRecord, useApplyMembership, useApplyLatinHonor } from "./mutations";
import {
  formatCurrency,
  formatTransactionDate,
  getEntryTypeBadge,
  getRemarkBadge,
  ledgerExportUrl,
} from "./controls";
import { StudentBalanceDrawer } from "./StudentBalanceDrawer";
import { LedgerTransactionForm } from "./LedgerTransactionForm";
import { LedgerImportForm } from "./LedgerImportForm";
import { LedgerActions } from "./LedgerActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const defaultVisibleColumns = {
  studentNumber: true,
  course: true,
  schoolYear: true,
  semester: true,
  units: true,
  transactionDate: true,
  referenceNo: true,
  particulars: true,
  feeRate: false,
  entryType: true,
  remark: true,
  inputBy: true,
};

type OptionalColumn = keyof typeof defaultVisibleColumns;

const optionalColumnLabels: Record<OptionalColumn, string> = {
  studentNumber: "Student ID",
  course: "Course",
  schoolYear: "School Year",
  semester: "Semester",
  units: "Units",
  transactionDate: "Trans. Date",
  referenceNo: "Ref. (JEV/OR #)",
  particulars: "Particulars",
  feeRate: "Tuition/Unit or Fee",
  entryType: "AR/Payment",
  remark: "Remark",
  inputBy: "Input By",
};

export function LedgerPage({ ledger }: { ledger: Ledger }) {
  const isLaw = ledger === "law";
  const title = isLaw ? "School of Law Ledger" : "Graduate School Ledger";
  const subtitle = isLaw
    ? "Tuition, fees, and payment transactions for law students."
    : "Tuition, fees, and payment transactions for graduate students.";

  const [, startTransition] = useTransition();
  const tableScrollRef = useRef<HTMLDivElement>(null);

  // Column visibility state persisted in localStorage
  const storageKey = `${ledger}-ledger.visible-columns`;
  const [visibleColumns, setVisibleColumns] = useState<Record<OptionalColumn, boolean>>(() => {
    if (typeof window === "undefined") return defaultVisibleColumns;
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}");
      return { ...defaultVisibleColumns, ...saved };
    } catch {
      return defaultVisibleColumns;
    }
  });

  const toggleColumn = (column: OptionalColumn) => {
    setVisibleColumns((current) => {
      const next = { ...current, [column]: !current[column] };
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore local storage error
      }
      return next;
    });
  };

  const visibleColumnCount =
    3 + Object.values(visibleColumns).filter(Boolean).length;

  // Filters state
  const [filterState, setFilterState] = useState({
    search: "",
    school_year: "",
    semester: "",
    course: "",
    entry_type: "",
    date_from: "",
    date_to: "",
    balance_status: "",
  });

  const [activeFilters, setActiveFilters] = useState<LedgerFilterParams>({
    page: 1,
    per_page: 15,
    search: "",
    school_year: "",
    semester: "",
    course: "",
    entry_type: "",
    date_from: "",
    date_to: "",
    balance_status: "",
  });

  const [showFilters, setShowFilters] = useState(false);
  const [goToPage, setGoToPage] = useState("");

  // Query
  const query = useLedgerRecords(ledger, activeFilters);
  const deleteMutation = useDeleteLedgerRecord();
  const applyMembershipMutation = useApplyMembership();
  const applyLatinHonorMutation = useApplyLatinHonor();

  // Modals & Drawer state
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedDrawerTransactionId, setSelectedDrawerTransactionId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionMode, setTransactionMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<LedgerRecord | null>(null);
  const [defaultStudentId, setDefaultStudentId] = useState<number | undefined>();
  const [defaultStudentName, setDefaultStudentName] = useState<string | undefined>();
  const [defaultEntryType, setDefaultEntryType] = useState<"ar" | "payment" | "adjustment" | undefined>(
    undefined,
  );

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LedgerRecord | null>(null);

  // Refresh cooldown — 15 s buffer to prevent spam
  const [refreshCooledAt, setRefreshCooledAt] = useState<number>(0);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshCooldown = Date.now() < refreshCooledAt;

  const handleRefresh = () => {
    if (refreshCooldown || query.isFetching) return;
    query.refetch();
    const until = Date.now() + 5_000;
    setRefreshCooledAt(until);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => setRefreshCooledAt(0), 5_000);
  };

  // Tick every second while cooldown is active so the button label stays accurate
  const [, forceTickRefresh] = useState(0);
  // (effect declared after all state, runs after mount)

  const [membershipTarget, setMembershipTarget] = useState<LedgerRecord | null>(null);
  const [selectedMembership, setSelectedMembership] = useState<"NAPU" | "NORSUFFA" | "">("");
  const [membershipError, setMembershipError] = useState<string | null>(null);

  // Apply-latin-honor modal state (Law only)
  const [honorTarget, setHonorTarget] = useState<LedgerRecord | null>(null);
  const [selectedHonor, setSelectedHonor] = useState<"SUMMA" | "MAGNA" | "CUM_LAUDE" | "">("");
  const [honorError, setHonorError] = useState<string | null>(null);

  // Active filter helper
  const applyFilters = (overrides: Partial<typeof filterState> = {}) => {
    const merged = { ...filterState, ...overrides };
    setFilterState(merged);
    startTransition(() => {
      setActiveFilters((prev) => ({
        ...prev,
        page: 1,
        search: merged.search,
        school_year: merged.school_year,
        semester: merged.semester,
        course: merged.course,
        entry_type: merged.entry_type,
        date_from: merged.date_from,
        date_to: merged.date_to,
        balance_status: merged.balance_status,
      }));
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const handleClearFilters = () => {
    const reset = {
      search: "",
      school_year: "",
      semester: "",
      course: "",
      entry_type: "",
      date_from: "",
      date_to: "",
      balance_status: "",
    };
    setFilterState(reset);
    startTransition(() => {
      setActiveFilters({
        page: 1,
        per_page: 15,
        ...reset,
      });
    });
  };

  const applyDatePreset = (preset: "today" | "month" | "clear") => {
    if (preset === "clear") {
      applyFilters({ date_from: "", date_to: "" });
      return;
    }
    const now = new Date();
    const toDateInput = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    const today = toDateInput(now);
    if (preset === "today") {
      applyFilters({ date_from: today, date_to: today });
      return;
    }
    applyFilters({
      date_from: toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)),
      date_to: today,
    });
  };

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      setActiveFilters((prev) => ({ ...prev, page: newPage }));
    });
  };

  const handleGoToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(goToPage, 10);
    const last = query.data?.meta?.last_page ?? 1;
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= last) {
      handlePageChange(pageNum);
      setGoToPage("");
    }
  };

  const openStudentDrawer = (studentId: number, transactionId?: number | null) => {
    setSelectedStudentId(studentId);
    setSelectedDrawerTransactionId(transactionId ?? null);
    setIsDrawerOpen(true);
  };

  const handleOpenCreateTransaction = (
    stdId?: number,
    stdName?: string,
    entryType?: "ar" | "payment" | "adjustment",
  ) => {
    setTransactionMode("create");
    setEditingRecord(null);
    setDefaultStudentId(stdId);
    setDefaultStudentName(stdName);
    setDefaultEntryType(entryType);
    setTransactionModalOpen(true);
  };

  const handleOpenEditTransaction = (record: LedgerRecord) => {
    setTransactionMode("edit");
    setEditingRecord(record);
    setDefaultStudentId(record.student_id);
    setDefaultStudentName(
      record.student
        ? record.student.name || `${record.student.last_name}, ${record.student.first_name}`
        : undefined,
    );
    setDefaultEntryType(undefined);
    setTransactionModalOpen(true);
  };

  // Latin honor discount percentage helper
  const latinHonorPct = (honor: "SUMMA" | "MAGNA" | "CUM_LAUDE" | "") =>
    honor === "SUMMA" ? 100 : honor === "MAGNA" ? 75 : honor === "CUM_LAUDE" ? 50 : 0;

  const handleConfirmApplyMembership = () => {
    if (!membershipTarget || !selectedMembership) return;
    setMembershipError(null);
    applyMembershipMutation.mutate(
      { ledger, id: membershipTarget.id, membership: selectedMembership },
      {
        onSuccess: () => {
          setMembershipTarget(null);
          setSelectedMembership("");
        },
        onError: (err) =>
          setMembershipError(err instanceof Error ? err.message : "Failed to apply membership."),
      },
    );
  };

  const handleConfirmApplyLatinHonor = () => {
    if (!honorTarget || !selectedHonor) return;
    setHonorError(null);
    applyLatinHonorMutation.mutate(
      { ledger, id: honorTarget.id, latin_honor: selectedHonor },
      {
        onSuccess: () => {
          setHonorTarget(null);
          setSelectedHonor("");
        },
        onError: (err) =>
          setHonorError(err instanceof Error ? err.message : "Failed to apply Latin honor."),
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(
      { ledger, id: deleteTarget.id, studentId: deleteTarget.student_id },
      {
        onSuccess: () => {
          setDeleteTarget(null);
        },
      },
    );
  };

  const records = query.data?.data ?? [];
  const meta = query.data?.meta ?? {
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
  };
  const stats = query.data?.stats;
  const filterOptions = query.data?.filterOptions ?? {
    courses: [],
    schoolYears: [],
    semesters: isLaw ? ["1st Sem", "2nd Sem", "Summer"] : ["First Semester", "Second Semester", "Summer"],
    types: ["AR", "Payment", "Adjustment"],
  };

  const totalStudents = stats?.totalStudents ?? 0;
  const totalAssessments = stats?.totalAssessments ?? 0;
  const totalPayments = stats?.totalPayments ?? 0;
  const outstandingBalance = stats?.outstandingBalance ?? 0;

  const activeAdvancedFilters = [
    filterState.school_year && {
      key: "school_year",
      label: `School year: ${filterState.school_year}`,
    },
    filterState.semester && { key: "semester", label: filterState.semester },
    filterState.course && { key: "course", label: `Course: ${filterState.course}` },
    filterState.entry_type && { key: "entry_type", label: `Type: ${filterState.entry_type.toUpperCase()}` },
    filterState.balance_status && {
      key: "balance_status",
      label: filterState.balance_status === "with_balance" ? "Outstanding balance" : "Fully paid",
    },
    filterState.date_from && {
      key: "date_from",
      label: `From: ${formatTransactionDate(filterState.date_from)}`,
    },
    filterState.date_to && {
      key: "date_to",
      label: `To: ${formatTransactionDate(filterState.date_to)}`,
    },
  ].filter(Boolean) as { key: keyof typeof filterState; label: string }[];

  // Interval tick while cooldown is active → keeps the button label current
  useEffect(() => {
    if (!refreshCooldown) return;
    const id = setInterval(() => forceTickRefresh((n) => n + 1), 1_000);
    return () => clearInterval(id);
  }, [refreshCooldown]);

  return (
    <div className="w-full space-y-6 pb-12">
      <Card className="rounded-2xl border border-border bg-card px-2! py-2! shadow-sm">
        <CardHeader className="p-3">
          <div>
            <CardTitle className="bg-[#3399FF] bg-clip-text font-['Poppins'] text-3xl font-black tracking-tight text-transparent sm:text-4xl">
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{subtitle}</CardDescription>
          </div>
        </CardHeader>
      </Card>

      {/* Top Header / Action Bar */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Ledger actions</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            className="h-9 border-input text-foreground hover:bg-muted disabled:opacity-50"
            onClick={handleRefresh}
            disabled={refreshCooldown || query.isFetching}
            title={refreshCooldown ? "Please wait before refreshing again" : "Refresh ledger data"}
          >
            <RefreshCw
              className={`mr-1.5 h-4 w-4 ${query.isFetching ? "animate-spin" : ""} ${refreshCooldown ? "text-muted-foreground" : ""}`}
            />
            {refreshCooldown
              ? `Wait ${Math.ceil((refreshCooledAt - Date.now()) / 1_000)}s`
              : "Refresh"}
          </Button>

          <Button
            className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setEmailModalOpen(true)}
          >
            <Mail className="mr-1.5 h-4 w-4" />
            Send Email
          </Button>

          <Button
            variant="outline"
            className="h-9 border-input text-foreground hover:bg-muted"
            onClick={() => setImportModalOpen(true)}
          >
            Import Excel/CSV
          </Button>

          <a
            href={ledgerExportUrl(ledger, activeFilters)}
            download
            className="inline-flex"
          >
            <Button
              variant="outline"
              className="h-9 border-input text-foreground hover:bg-muted"
            >
              <Download className="mr-1.5 h-4 w-4" />
              Export Excel
            </Button>
          </a>

          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => handleOpenCreateTransaction()}
          >
            <PlusCircle className="mr-1.5 h-4 w-4" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Students on Ledger
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {query.isPending ? "…" : totalStudents.toLocaleString()}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Unique {isLaw ? "law" : "graduate"} students
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Accounts Receivable
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {query.isPending ? "…" : formatCurrency(totalAssessments)}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Total tuition + fees billed
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Payments
            </CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {query.isPending ? "…" : formatCurrency(totalPayments)}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Total payments received
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() =>
            applyFilters({
              balance_status:
                filterState.balance_status === "with_balance" ? "" : "with_balance",
            })
          }
          className={`cursor-pointer border shadow-xs transition-all select-none ${
            filterState.balance_status === "with_balance"
              ? "border-orange-400 bg-orange-50/70 ring-2 ring-orange-300 dark:border-orange-800 dark:bg-orange-950/30 dark:ring-orange-800"
              : "border-border bg-card hover:border-orange-300 hover:bg-orange-50/30 dark:hover:border-orange-800 dark:hover:bg-orange-950/20"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              Outstanding Balance
              {filterState.balance_status === "with_balance" && (
                <Badge
                  variant="outline"
                  className="h-4 border-orange-300 bg-orange-100 px-1.5 py-0 text-[10px] text-orange-800 dark:border-orange-800 dark:bg-orange-950/60 dark:text-orange-400"
                >
                  Active Filter
                </Badge>
              )}
            </CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${
                filterState.balance_status === "with_balance"
                  ? "animate-pulse text-orange-600 dark:text-orange-400"
                  : "text-orange-500"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {query.isPending ? "…" : formatCurrency(outstandingBalance)}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {filterState.balance_status === "with_balance"
                ? "Click to show all records"
                : "Click to filter students with balance"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Ledger Table with Filter Bar */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-md text-foreground">
                Transaction Ledger
              </CardTitle>
              <CardDescription className="mt-0.5 text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  {query.isFetching && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  )}
                  {query.isFetching
                    ? "Updating results..."
                    : `Showing ${records.length} of ${meta.total} record${meta.total === 1 ? "" : "s"}`}
                </span>
              </CardDescription>
            </div>

            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-1 flex-wrap items-center gap-2 md:justify-end"
            >
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 border-input text-foreground hover:bg-muted"
                    >
                      <Columns3 className="h-4 w-4 mr-1.5" /> Columns
                    </Button>
                  }
                />
                <PopoverContent
                  align="end"
                  className="w-72 border-border bg-popover p-3 text-popover-foreground"
                >
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-foreground">
                      Visible columns
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Name, Amount, and Actions always remain visible.
                    </p>
                  </div>
                  <div className="grid gap-1">
                    {(Object.keys(optionalColumnLabels) as OptionalColumn[]).map(
                      (column) => (
                        <label
                          key={column}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted"
                        >
                          <input
                            type="checkbox"
                            checked={visibleColumns[column]}
                            onChange={() => toggleColumn(column)}
                            className="h-4 w-4 rounded border-input accent-primary"
                          />
                          <span>{optionalColumnLabels[column]}</span>
                        </label>
                      ),
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="relative w-full sm:w-64">
                <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search name, course, or ref #..."
                  className="h-9 border-input bg-background pl-8 text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                  value={filterState.search}
                  onChange={(e) =>
                    setFilterState((prev) => ({ ...prev, search: e.target.value }))
                  }
                />
              </div>

              <Button
                type="submit"
                size="sm"
                className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Search className="mr-1.5 h-4 w-4" /> Search
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-expanded={showFilters}
                onClick={() => setShowFilters((current) => !current)}
                className={`h-9 border-input text-foreground hover:bg-muted ${
                  activeAdvancedFilters.length > 0 ? "bg-primary/10 text-primary" : ""
                }`}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
                {activeAdvancedFilters.length > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground ml-1">
                    {activeAdvancedFilters.length}
                  </span>
                )}
                <ChevronDown
                  className={`h-3.5 w-3.5 ml-1 transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </Button>

              {showFilters && (
                <div className="flex basis-full flex-wrap items-end gap-2 rounded-lg border border-border bg-muted/30 p-3 mt-2">
                  <select
                    value={filterState.school_year}
                    onChange={(e) => applyFilters({ school_year: e.target.value })}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    <option value="">All School Years</option>
                    {(filterOptions?.schoolYears ?? []).map((sy) => (
                      <option key={sy} value={sy}>
                        {sy}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterState.semester}
                    onChange={(e) => applyFilters({ semester: e.target.value })}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    <option value="">All Semesters</option>
                    {(filterOptions?.semesters ?? []).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterState.course}
                    onChange={(e) => applyFilters({ course: e.target.value })}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    <option value="">All Courses</option>
                    {(filterOptions?.courses ?? []).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterState.entry_type}
                    onChange={(e) => applyFilters({ entry_type: e.target.value })}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    <option value="">All Types</option>
                    {(filterOptions?.types ?? ["AR", "Payment", "Adjustment"]).map((t) => (
                      <option key={t} value={t.toLowerCase()}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterState.balance_status}
                    onChange={(e) => applyFilters({ balance_status: e.target.value })}
                    className={`h-9 rounded-md border px-3 text-sm font-medium transition-colors ${
                      filterState.balance_status === "with_balance"
                        ? "border-orange-400 bg-orange-50 font-semibold text-orange-900 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300"
                        : filterState.balance_status === "cleared"
                          ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "border-input bg-background text-foreground"
                    }`}
                  >
                    <option value="">All Balances</option>
                    <option value="with_balance">With Outstanding Balance</option>
                    <option value="cleared">Cleared / Fully Paid</option>
                  </select>

                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    From
                    <input
                      type="date"
                      value={filterState.date_from}
                      max={filterState.date_to || undefined}
                      onChange={(e) => applyFilters({ date_from: e.target.value })}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal text-foreground"
                    />
                  </label>

                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    To
                    <input
                      type="date"
                      value={filterState.date_to}
                      min={filterState.date_from || undefined}
                      onChange={(e) => applyFilters({ date_to: e.target.value })}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal text-foreground"
                    />
                  </label>

                  <div
                    className="flex flex-wrap items-center gap-1 self-end"
                    aria-label="Date filter shortcuts"
                  >
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => applyDatePreset("today")}
                      className="h-9 border-input text-foreground hover:bg-muted"
                    >
                      Today
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => applyDatePreset("month")}
                      className="h-9 border-input text-foreground hover:bg-muted"
                    >
                      This month
                    </Button>
                    {(filterState.date_from || filterState.date_to) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => applyDatePreset("clear")}
                        className="h-9 text-muted-foreground hover:text-foreground"
                      >
                        Clear dates
                      </Button>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 border-input text-foreground hover:bg-muted"
                    onClick={handleClearFilters}
                  >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              )}

              {activeAdvancedFilters.length > 0 && (
                <div className="flex basis-full flex-wrap items-center gap-1.5 mt-2">
                  <span className="mr-1 text-xs font-medium text-muted-foreground">
                    Active:
                  </span>
                  {activeAdvancedFilters.map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => applyFilters({ [filter.key]: "" })}
                      className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                      title={`Remove ${filter.label} filter`}
                    >
                      {filter.label}
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </form>
          </div>
        </CardHeader>

        {query.isFetching && (
          <div
            className="h-1 w-full overflow-hidden bg-muted"
            role="progressbar"
            aria-label="Filtering ledger records"
          >
            <div className="h-full w-1/3 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-primary" />
          </div>
        )}

        <div
          ref={tableScrollRef}
          aria-busy={query.isFetching}
          className={`custom-scrollbar overflow-x-auto transition-opacity ${
            query.isFetching ? "pointer-events-none opacity-50" : "opacity-100"
          }`}
        >
          <div className="min-w-max">
            <CardContent className="p-0">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {visibleColumns.studentNumber && (
                      <th className="py-2.5 pr-4 pl-3 text-left font-medium whitespace-nowrap text-muted-foreground text-xs">
                        Student ID
                      </th>
                    )}
                    <th className="py-2.5 pr-4 pl-2 text-left font-medium whitespace-nowrap text-muted-foreground text-xs">
                      Name
                    </th>
                    {visibleColumns.course && (
                      <th className="py-2.5 pr-4 text-left font-medium whitespace-nowrap text-muted-foreground text-xs">
                        Course
                      </th>
                    )}
                    {visibleColumns.schoolYear && (
                      <th className="py-2.5 pr-4 text-left font-medium whitespace-nowrap text-muted-foreground text-xs">
                        School Year
                      </th>
                    )}
                    {visibleColumns.semester && (
                      <th className="py-2.5 pr-4 text-left font-medium whitespace-nowrap text-muted-foreground text-xs">
                        Semester
                      </th>
                    )}
                    {visibleColumns.units && (
                      <th className="py-2.5 pr-4 text-right font-medium whitespace-nowrap text-muted-foreground text-xs">
                        Units
                      </th>
                    )}
                    {visibleColumns.transactionDate && (
                      <th className="py-2.5 pr-4 text-left font-medium whitespace-nowrap text-muted-foreground text-xs">
                        Trans. Date
                      </th>
                    )}
                    {visibleColumns.referenceNo && (
                      <th className="py-2.5 pr-4 text-left font-medium whitespace-nowrap text-muted-foreground text-xs">
                        Ref. (JEV/OR #)
                      </th>
                    )}
                    {visibleColumns.particulars && (
                      <th className="py-2.5 pr-4 text-left font-medium whitespace-nowrap text-muted-foreground text-xs">
                        Particulars
                      </th>
                    )}
                    {visibleColumns.feeRate && (
                      <th className="py-2.5 pr-4 text-right font-medium whitespace-nowrap text-muted-foreground text-xs">
                        Fee Rate
                      </th>
                    )}
                    {visibleColumns.entryType && (
                      <th className="py-2.5 pr-4 text-left font-medium whitespace-nowrap text-muted-foreground text-xs">
                        AR/Payment
                      </th>
                    )}
                    <th className="py-2.5 pr-4 text-right font-medium whitespace-nowrap text-muted-foreground text-xs">
                      Amount
                    </th>
                    {visibleColumns.remark && (
                      <th className="py-2.5 pr-4 text-left font-medium whitespace-nowrap text-muted-foreground text-xs">
                        Remark
                      </th>
                    )}
                    {visibleColumns.inputBy && (
                      <th className="py-2.5 pr-4 text-left font-medium whitespace-nowrap text-muted-foreground text-xs">
                        Input By
                      </th>
                    )}
                    <th className="py-2.5 pr-3 text-center font-medium whitespace-nowrap text-muted-foreground text-xs">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {query.isPending ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        {visibleColumns.studentNumber && (
                          <td className="py-3 px-3"><Skeleton className="h-4 w-16" /></td>
                        )}
                        <td className="py-3 px-2"><Skeleton className="h-4 w-32" /></td>
                        {visibleColumns.course && <td className="py-3 px-2"><Skeleton className="h-4 w-16" /></td>}
                        {visibleColumns.schoolYear && <td className="py-3 px-2"><Skeleton className="h-4 w-20" /></td>}
                        {visibleColumns.semester && <td className="py-3 px-2"><Skeleton className="h-4 w-20" /></td>}
                        {visibleColumns.units && <td className="py-3 px-2"><Skeleton className="h-4 w-10 ml-auto" /></td>}
                        {visibleColumns.transactionDate && <td className="py-3 px-2"><Skeleton className="h-4 w-20" /></td>}
                        {visibleColumns.referenceNo && <td className="py-3 px-2"><Skeleton className="h-4 w-16" /></td>}
                        {visibleColumns.particulars && <td className="py-3 px-2"><Skeleton className="h-4 w-36" /></td>}
                        {visibleColumns.feeRate && <td className="py-3 px-2"><Skeleton className="h-4 w-14 ml-auto" /></td>}
                        {visibleColumns.entryType && <td className="py-3 px-2"><Skeleton className="h-4 w-16" /></td>}
                        <td className="py-3 px-2"><Skeleton className="h-4 w-16 ml-auto" /></td>
                        {visibleColumns.remark && <td className="py-3 px-2"><Skeleton className="h-4 w-16" /></td>}
                        {visibleColumns.inputBy && <td className="py-3 px-2"><Skeleton className="h-4 w-20" /></td>}
                        <td className="py-3 px-3"><Skeleton className="h-4 w-12 mx-auto" /></td>
                      </tr>
                    ))
                  ) : records.length === 0 ? (
                    <tr>
                      <td
                        colSpan={visibleColumnCount}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        No transactions found. Upload a CSV/Excel file or add one manually.
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => {
                      const studentName = r.student
                        ? r.student.name || `${r.student.last_name}, ${r.student.first_name}`
                        : `Student #${r.student_id}`;

                      const entryTypeLabel = (() => {
                        const type = (r.entry_type || "").toUpperCase();
                        if (type === "AR" && r.membership) return `AR(${r.membership})`;
                        if (type === "ADJUSTMENT" && r.membership) return `Adjustment (${r.membership})`;
                        if (type === "AR") return "AR";
                        if (type === "PAYMENT") return "Payment";
                        if (type === "ADJUSTMENT") return "Adjustment";
                        return r.entry_type || "—";
                      })();

                      return (
                        <tr
                          key={r.id}
                          role="button"
                          tabIndex={r.student_id ? 0 : undefined}
                          onClick={() => {
                            if (r.student_id) openStudentDrawer(r.student_id, r.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              if (r.student_id) openStudentDrawer(r.student_id, r.id);
                            }
                          }}
                          className="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-hidden"
                        >
                          {visibleColumns.studentNumber && (
                            <td className="py-2.5 pr-4 pl-3 whitespace-nowrap text-muted-foreground font-mono text-xs">
                              {r.student_number || r.student?.student_number || "—"}
                            </td>
                          )}

                          <td className="py-2.5 pr-4 pl-2 font-medium whitespace-nowrap text-foreground">
                            {studentName}
                          </td>

                          {visibleColumns.course && (
                            <td className="py-2.5 pr-4 text-muted-foreground text-xs">
                              {r.course?.course_code || "—"}
                            </td>
                          )}

                          {visibleColumns.schoolYear && (
                            <td className="py-2.5 pr-4 text-muted-foreground text-xs">
                              {r.academic_term?.school_year || "—"}
                            </td>
                          )}

                          {visibleColumns.semester && (
                            <td className="py-2.5 pr-4 text-muted-foreground text-xs">
                              {r.academic_term?.semester || "—"}
                            </td>
                          )}

                          {visibleColumns.units && (
                            <td className="py-2.5 pr-4 text-right text-muted-foreground font-mono text-xs">
                              {r.units ?? 0}
                            </td>
                          )}

                          {visibleColumns.transactionDate && (
                            <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground text-xs">
                              {formatTransactionDate(r.transaction_date)}
                            </td>
                          )}

                          {visibleColumns.referenceNo && (
                            <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground text-xs">
                              {r.orLink ? (
                                <a
                                  href={r.orLink}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                                >
                                  {r.reference_number}
                                </a>
                              ) : (
                                r.reference_number || "—"
                              )}
                            </td>
                          )}

                          {visibleColumns.particulars && (
                            <td className="py-2.5 pr-4 text-muted-foreground text-xs max-w-xs truncate" title={r.particulars}>
                              {r.particulars}
                            </td>
                          )}

                          {visibleColumns.feeRate && (
                            <td className="py-2.5 pr-4 text-right text-muted-foreground font-mono text-xs">
                              {formatCurrency(r.rate)}
                            </td>
                          )}

                          {visibleColumns.entryType && (
                            <td className="py-2.5 pr-4">
                              {!isLaw && r.entry_type === "ar" && !r.membership ? (
                                <button
                                  type="button"
                                  title="Apply Membership Scholarship"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMembershipTarget(r);
                                    setSelectedMembership("");
                                    setMembershipError(null);
                                  }}
                                  className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  <Badge
                                    variant="outline"
                                    className={`cursor-pointer text-[11px] transition-colors ${getEntryTypeBadge(r.entry_type)} hover:border-purple-300 hover:bg-purple-100 hover:text-purple-800 dark:hover:border-purple-800 dark:hover:bg-purple-950/30 dark:hover:text-purple-300`}
                                  >
                                    {entryTypeLabel}
                                  </Badge>
                                </button>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className={`text-[11px] ${getEntryTypeBadge(r.entry_type)}`}
                                >
                                  {entryTypeLabel}
                                </Badge>
                              )}
                            </td>
                          )}

                          <td className="py-2.5 pr-4 text-right whitespace-nowrap">
                            <div className="flex flex-col items-end">
                              <span className="font-medium font-mono text-xs text-foreground">
                                {formatCurrency(r.amount)}
                              </span>
                              {Number(r.discount_amount || 0) > 0 && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                  (Discount: -{formatCurrency(r.discount_amount)})
                                </span>
                              )}
                            </div>
                          </td>

                          {visibleColumns.remark && (
                            <td className="py-2.5 pr-4">
                              <Badge
                                variant="outline"
                                className={`text-[11px] ${getRemarkBadge(r.remark || "Settled")}`}
                              >
                                {r.remark || "Settled"}
                              </Badge>
                            </td>
                          )}

                          {visibleColumns.inputBy && (
                            <td className="py-2.5 pr-4 text-muted-foreground text-xs whitespace-nowrap">
                              {r.input_by || "—"}
                            </td>
                          )}

                          <td className="py-2.5 pr-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-amber-600"
                                title="Edit Transaction"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditTransaction(r);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                title="Delete Transaction"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(r);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>



                              {/* Apply Latin Honor — Law AR rows with no latin_honor yet */}
                              {isLaw && r.entry_type === "ar" && !r.latin_honor && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-amber-600"
                                  title="Apply Latin Honor Scholarship"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHonorTarget(r);
                                    setSelectedHonor("");
                                    setHonorError(null);
                                  }}
                                >
                                  <Award className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </CardContent>
          </div>
        </div>

        {meta.last_page > 1 && (
          <CardFooter className="flex flex-col items-center justify-between gap-4 border-t border-border pt-4 pb-4 sm:flex-row">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div>
                {meta.total === 0
                  ? "Showing 0 of 0"
                  : `Showing page ${meta.current_page} of ${meta.last_page}`}
              </div>
              <span className="text-muted-foreground/60">|</span>
              <div>
                <span className="font-semibold text-foreground font-mono">
                  {meta.total}
                </span>{" "}
                total records
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <form onSubmit={handleGoToPage} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Go to page:</span>
                <input
                  type="number"
                  min={1}
                  max={meta.last_page}
                  value={goToPage}
                  onChange={(e) => setGoToPage(e.target.value)}
                  className="h-8 w-14 rounded-md border border-input bg-background px-2 text-center text-xs font-mono text-foreground"
                />
                <Button type="submit" size="sm" variant="outline" className="h-8 px-2 text-xs">
                  Go
                </Button>
              </form>

              <Pagination className="w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, meta.current_page - 1))}
                      aria-disabled={meta.current_page <= 1}
                      className={meta.current_page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink isActive className="font-mono">
                      {meta.current_page}
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(meta.last_page, meta.current_page + 1))}
                      aria-disabled={meta.current_page >= meta.last_page}
                      className={meta.current_page >= meta.last_page ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Ledger Transaction
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction for{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.student
                  ? `${deleteTarget.student.last_name}, ${deleteTarget.student.first_name}`
                  : `Student #${deleteTarget?.student_id}`}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Membership Modal (Graduate only) */}
      <Dialog
        open={membershipTarget !== null}
        onOpenChange={(open) => {
          if (!open) { setMembershipTarget(null); setSelectedMembership(""); setMembershipError(null); }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Sparkles className="h-5 w-5" />
              Apply Membership Scholarship
            </DialogTitle>
            <DialogDescription>
              Apply a 100% scholarship discount to the AR entry for{" "}
              <span className="font-semibold text-foreground">
                {membershipTarget?.student
                  ? `${membershipTarget.student.last_name}, ${membershipTarget.student.first_name}`
                  : `Student #${membershipTarget?.student_id}`}
              </span>
              {membershipTarget && (
                <span className="ml-1 font-mono text-foreground">
                  ({formatCurrency(Number(membershipTarget.amount))})
                </span>
              )}
              . This will create a matching Adjustment entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {membershipError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                {membershipError}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">Select Membership</p>
              <div className="grid grid-cols-2 gap-2">
                {(["NAPU", "NORSUFFA"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMembership(m)}
                    className={`rounded-xl border px-4 py-3 text-left text-xs font-semibold transition-all ${
                      selectedMembership === m
                        ? "border-purple-500 bg-purple-50 text-purple-900 shadow-xs ring-1 ring-purple-400 dark:bg-purple-950/40 dark:text-purple-200"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <div>{m}</div>
                    <div className="mt-0.5 text-[11px] font-normal opacity-70">
                      {m === "NAPU" ? "NORSU Admin. Personnel Union" : "NORSU Federated Faculty Assoc."}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedMembership && membershipTarget && (
              <div className="flex items-center justify-between rounded-lg bg-purple-50 px-3 py-2 text-xs text-purple-900 dark:bg-purple-950/30 dark:text-purple-300">
                <span>
                  AR({selectedMembership}) + Adjustment({selectedMembership}) −{formatCurrency(Number(membershipTarget.amount))}
                </span>
                <span className="font-bold">Net ₱0.00</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => { setMembershipTarget(null); setSelectedMembership(""); setMembershipError(null); }}
              disabled={applyMembershipMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmApplyMembership}
              disabled={!selectedMembership || applyMembershipMutation.isPending}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              {applyMembershipMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Applying…
                </>
              ) : (
                "Apply Scholarship"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Latin Honor Modal (Law only) */}
      <Dialog
        open={honorTarget !== null}
        onOpenChange={(open) => {
          if (!open) { setHonorTarget(null); setSelectedHonor(""); setHonorError(null); }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Award className="h-5 w-5" />
              Apply Latin Honor Scholarship
            </DialogTitle>
            <DialogDescription>
              Apply a partial scholarship discount to the AR entry for{" "}
              <span className="font-semibold text-foreground">
                {honorTarget?.student
                  ? `${honorTarget.student.last_name}, ${honorTarget.student.first_name}`
                  : `Student #${honorTarget?.student_id}`}
              </span>
              {honorTarget && (
                <span className="ml-1 font-mono text-foreground">
                  ({formatCurrency(Number(honorTarget.amount))})
                </span>
              )}
              . This will create a matching Adjustment entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {honorError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                {honorError}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">Select Latin Honor</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "SUMMA", label: "Summa Cum Laude", pct: 100 },
                  { value: "MAGNA", label: "Magna Cum Laude", pct: 75 },
                  { value: "CUM_LAUDE", label: "Cum Laude", pct: 50 },
                ] as const).map((h) => (
                  <button
                    key={h.value}
                    type="button"
                    onClick={() => setSelectedHonor(h.value)}
                    className={`rounded-xl border px-3 py-3 text-left text-xs font-semibold transition-all ${
                      selectedHonor === h.value
                        ? "border-amber-500 bg-amber-50 text-amber-900 shadow-xs ring-1 ring-amber-400 dark:bg-amber-950/40 dark:text-amber-200"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <div>{h.label}</div>
                    <div className="mt-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      {h.pct}% off
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedHonor && honorTarget && (() => {
              const pct = latinHonorPct(selectedHonor);
              const base = Number(honorTarget.amount);
              const discount = Math.round(base * pct) / 100;
              return (
                <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                  <span>
                    Adjustment −{formatCurrency(discount)} ({pct}% of {formatCurrency(base)})
                  </span>
                  <span className="font-bold">Net {formatCurrency(base - discount)}</span>
                </div>
              );
            })()}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => { setHonorTarget(null); setSelectedHonor(""); setHonorError(null); }}
              disabled={applyLatinHonorMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmApplyLatinHonor}
              disabled={!selectedHonor || applyLatinHonorMutation.isPending}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {applyLatinHonorMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Applying…
                </>
              ) : (
                "Apply Scholarship"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slide-over Student Balance Drawer */}
      <StudentBalanceDrawer
        ledger={ledger}
        studentId={selectedStudentId}
        selectedTransactionId={selectedDrawerTransactionId}
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) setSelectedDrawerTransactionId(null);
        }}
        onAddTransaction={(stdId, stdName) => {
          setIsDrawerOpen(false);
          handleOpenCreateTransaction(stdId, stdName, "payment");
        }}
        onEditTransaction={(tx) => {
          setIsDrawerOpen(false);
          handleOpenEditTransaction(tx);
        }}
      />

      {/* Transaction Modal (Create / Edit) */}
      <LedgerTransactionForm
        ledger={ledger}
        mode={transactionMode}
        initialData={editingRecord ?? undefined}
        defaultStudentId={defaultStudentId}
        defaultStudentName={defaultStudentName}
        defaultEntryType={defaultEntryType}
        open={transactionModalOpen}
        onOpenChange={setTransactionModalOpen}
      />

      {/* Import Form Modal */}
      <LedgerImportForm
        ledger={ledger}
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
      />

      {/* Send Bulk Email Modal */}
      <LedgerActions
        ledger={ledger}
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        filters={activeFilters}
      />
    </div>
  );
}
