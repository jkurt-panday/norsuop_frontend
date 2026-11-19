import { useState } from "react";
import {
  Layers,
  Loader2,
  Plus,
  Search,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { ApiError } from "../../api/client";
import type { Ledger, LedgerRecord, LedgerTransactionRequest } from "./api";
import { useCreateLedgerRecord, useUpdateLedgerRecord } from "./mutations";
import { useLedgerMasterData, useSearchLedgerStudents } from "./queries";
import { BatchLinesEditor, batchLineAmount, emptyBatchLine, type BatchLine } from "./BatchLinesEditor";
import { CohortEntryPanel } from "./CohortEntryPanel";
import { formatCurrency } from "./controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

type EntryMode = "single" | "batch" | "cohort";
type Membership = "" | "NAPU" | "NORSUFFA";

interface LedgerTransactionFormProps {
  ledger: Ledger;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: "create" | "edit";
  initialData?: LedgerRecord | null;
  defaultStudentId?: number;
  defaultStudentName?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PARTICULARS_PRESETS: Record<Ledger, string[]> = {
  graduate: [
    "Tuition Fee",
    "Matriculation Fee",
    "Comprehensive Exam Fee",
    "Thesis Advising Fee",
    "Dissertation Fee",
    "Graduation Fee",
    "Payment for Assessment",
    "Balance Settlement",
  ],
  law: [
    "Tuition Fee",
    "Bar Review Fee",
    "Law Library Fee",
    "Matriculation Fee",
    "Midterm Payment",
    "Final Exam Settlement",
    "Payment for Assessment",
    "Balance Settlement",
  ],
};

// ─── Mode Switcher ────────────────────────────────────────────────────────────

function ModeSwitcher({
  mode,
  onChange,
  ledger,
}: {
  mode: EntryMode;
  onChange: (m: EntryMode) => void;
  ledger: Ledger;
}) {
  const tabs: Array<{ value: EntryMode; label: string; icon: React.ReactNode }> = [
    { value: "single", label: "Single Entry", icon: <User className="h-3.5 w-3.5" /> },
    { value: "batch", label: "Batch Lines", icon: <Layers className="h-3.5 w-3.5" /> },
    ...(ledger === "graduate"
      ? [{ value: "cohort" as EntryMode, label: "Cohort", icon: <Users className="h-3.5 w-3.5" /> }]
      : []),
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            mode === tab.value
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Membership Control ───────────────────────────────────────────────────────

function MembershipControl({
  value,
  onChange,
  amount,
}: {
  value: Membership;
  onChange: (v: Membership) => void;
  amount: number;
}) {
  const pills: Array<{ v: Membership; label: string; active: string; inactive: string }> = [
    {
      v: "",
      label: "None",
      active: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
      inactive: "text-muted-foreground hover:bg-muted",
    },
    {
      v: "NAPU",
      label: "NAPU",
      active: "bg-purple-600 text-white",
      inactive: "border border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400",
    },
    {
      v: "NORSUFFA",
      label: "NORSUFFA",
      active: "bg-indigo-600 text-white",
      inactive: "border border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400",
    },
  ];

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              Membership Scholarship
            </p>
            <p className="text-[11px] text-muted-foreground">
              Creates AR + matching Adjustment (100% discount). Graduate only.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {pills.map((pill) => (
            <button
              key={pill.v}
              type="button"
              onClick={() => onChange(pill.v)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                value === pill.v ? pill.active : pill.inactive
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {value && (
        <div className="flex items-center justify-between rounded-lg bg-purple-50 px-3 py-2 text-xs text-purple-900 dark:bg-purple-950/30 dark:text-purple-300">
          <span>
            Will create:{" "}
            <strong>AR({value})</strong> ({formatCurrency(amount)}) +{" "}
            <strong>Adjustment({value})</strong> (−{formatCurrency(amount)})
          </span>
          <span className="font-bold text-purple-700 dark:text-purple-400">
            Net ₱0.00
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Single Entry Form Fields ─────────────────────────────────────────────────

interface FormFieldsProps {
  ledger: Ledger;
  mode: "create" | "edit";
  initialData?: LedgerRecord | null;
  defaultStudentId?: number;
  defaultStudentName?: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

function SingleFormFields({
  ledger,
  mode,
  initialData,
  defaultStudentId,
  defaultStudentName,
  onClose,
  onSuccess,
}: FormFieldsProps) {
  const createMutation = useCreateLedgerRecord();
  const updateMutation = useUpdateLedgerRecord();
  const masterQuery = useLedgerMasterData(ledger);

  const isGraduate = ledger === "graduate";

  // ── Student state ──────────────────────────────────────────────────────────
  const initialStudentId =
    mode === "edit" && initialData
      ? initialData.student_id
      : defaultStudentId ?? "";

  const initialStudentLabel =
    mode === "edit" && initialData
      ? initialData.student?.last_name && initialData.student?.first_name
        ? `${initialData.student.last_name}, ${initialData.student.first_name}`
        : `Student #${initialData.student_id}`
      : defaultStudentName || (defaultStudentId ? `Student #${defaultStudentId}` : "");

  const [studentId, setStudentId] = useState<number | "">(initialStudentId);
  const [studentLabel, setStudentLabel] = useState<string>(initialStudentLabel);
  const [studentSearch, setStudentSearch] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // ── Core fields ────────────────────────────────────────────────────────────
  const [courseId, setCourseId] = useState<number | "">(
    mode === "edit" && initialData
      ? (initialData.course_id ?? initialData.course?.id ?? "")
      : (masterQuery.data?.courses?.[0]?.id ?? ""),
  );
  const [termId, setTermId] = useState<number | "">(
    mode === "edit" && initialData
      ? (initialData.academic_term_id ?? initialData.academic_term?.id ?? "")
      : (masterQuery.data?.academicTerms?.[0]?.id ?? ""),
  );
  const [entryType, setEntryType] = useState<"ar" | "payment" | "adjustment">(
    mode === "edit" && initialData
      ? ((initialData.entry_type as "ar" | "payment" | "adjustment") || "ar")
      : "ar",
  );
  const [date, setDate] = useState(
    mode === "edit" && initialData?.transaction_date
      ? initialData.transaction_date.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  );
  const [referenceNumber, setReferenceNumber] = useState(
    mode === "edit" && initialData ? (initialData.reference_number || "") : "",
  );
  const [particulars, setParticulars] = useState(
    mode === "edit" && initialData ? (initialData.particulars || "") : "",
  );
  const [units, setUnits] = useState(
    mode === "edit" && initialData?.units !== null && initialData?.units !== undefined
      ? String(initialData.units)
      : "",
  );
  const [rate, setRate] = useState(
    mode === "edit" && initialData?.rate !== null && initialData?.rate !== undefined
      ? String(initialData.rate)
      : "",
  );
  const [amount, setAmount] = useState(
    mode === "edit" && initialData?.amount !== null && initialData?.amount !== undefined
      ? String(initialData.amount)
      : "",
  );
  const [remarks, setRemarks] = useState(
    mode === "edit" && initialData ? (initialData.remarks || "") : "",
  );
  const [status] = useState(
    mode === "edit" && initialData?.status
      ? initialData.status
      : ledger === "law"
      ? "Paid"
      : "posted",
  );

  // ── Graduate-only fields ───────────────────────────────────────────────────
  const [membership, setMembership] = useState<Membership>("");
  const [latinHonor, setLatinHonor] = useState(
    mode === "edit" && initialData?.latin_honor ? initialData.latin_honor : "",
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const studentSearchQuery = useSearchLedgerStudents(
    ledger,
    studentSearch,
    showStudentDropdown && studentSearch.trim().length > 0,
  );

  // ── Auto-compute amount from units × rate ──────────────────────────────────
  const handleUnitsChange = (val: string) => {
    setUnits(val);
    const u = parseFloat(val);
    const r = parseFloat(rate);
    if (!isNaN(u) && !isNaN(r) && u > 0) setAmount((u * r).toFixed(2));
  };

  const handleRateChange = (val: string) => {
    setRate(val);
    const u = parseFloat(units);
    const r = parseFloat(val);
    if (!isNaN(u) && !isNaN(r) && u > 0) {
      setAmount((u * r).toFixed(2));
    } else if (!isNaN(r) && (!units || parseFloat(units) === 0)) {
      setAmount(r.toFixed(2));
    }
  };

  // Clear membership when switching away from AR
  const handleEntryTypeChange = (next: "ar" | "payment" | "adjustment") => {
    setEntryType(next);
    if (next !== "ar") setMembership("");
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!studentId) return setErrorMessage("Please select a student.");
    const resolvedCourseId = courseId || masterQuery.data?.courses?.[0]?.id;
    if (!resolvedCourseId) return setErrorMessage("Please select a course/program.");
    const resolvedTermId = termId || masterQuery.data?.academicTerms?.[0]?.id;
    if (!resolvedTermId) return setErrorMessage("Please select an academic term.");
    if (!particulars.trim()) return setErrorMessage("Please provide particulars for the transaction.");
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) return setErrorMessage("Please enter a valid amount.");

    const payload: LedgerTransactionRequest = {
      student_id: Number(studentId),
      course_id: Number(resolvedCourseId),
      academic_term_id: Number(resolvedTermId),
      entry_type: entryType,
      transaction_date: date,
      particulars: particulars.trim(),
      rate: Number(rate) || 0,
      amount: numAmount,
      units: units ? Number(units) : undefined,
      reference_number: referenceNumber.trim() || undefined,
      remarks: remarks.trim() || undefined,
      status: status || (ledger === "law" ? "Paid" : "posted"),
    };

    // Graduate AR: membership scholarship
    if (isGraduate && entryType === "ar" && mode === "create" && membership) {
      payload.membership = membership;
      payload.discount_amount = numAmount;
    }

    // Graduate: latin honor
    if (isGraduate && entryType === "ar" && latinHonor.trim()) {
      payload.latin_honor = latinHonor.trim();
    }

    if (mode === "edit" && initialData?.id) {
      updateMutation.mutate(
        { ledger, id: initialData.id, payload },
        {
          onSuccess: () => { onSuccess("Transaction updated."); onClose(); },
          onError: (err) => setErrorMessage(
            err instanceof ApiError ? err.message : "Failed to update transaction.",
          ),
        },
      );
    } else {
      createMutation.mutate(
        { ledger, payload },
        {
          onSuccess: (res) => {
            const msg =
              res && typeof res === "object" && "message" in res
                ? String((res as { message: string }).message)
                : "Transaction posted.";
            onSuccess(msg);
            onClose();
          },
          onError: (err) => setErrorMessage(
            err instanceof ApiError ? err.message : "Failed to create transaction.",
          ),
        },
      );
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const numAmount = parseFloat(amount) || 0;
  const isAR = entryType === "ar";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* Student Picker */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Student Account</Label>
        {studentId ? (
          <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-3.5 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                <User className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{studentLabel}</div>
                <div className="font-mono text-[11px] text-muted-foreground">ID #{studentId}</div>
              </div>
            </div>
            {mode !== "edit" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => { setStudentId(""); setStudentLabel(""); setStudentSearch(""); }}
              >
                Change
              </Button>
            )}
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student name or student number…"
                value={studentSearch}
                onChange={(e) => { setStudentSearch(e.target.value); setShowStudentDropdown(true); }}
                onFocus={() => setShowStudentDropdown(true)}
                className="h-10 rounded-xl pl-9"
              />
              {studentSearchQuery.isFetching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
            {showStudentDropdown && studentSearch.trim().length > 0 && (
              <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg">
                {studentSearchQuery.data?.data && studentSearchQuery.data.data.length > 0 ? (
                  studentSearchQuery.data.data.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-muted/80"
                      onClick={() => {
                        setStudentId(s.id);
                        setStudentLabel(`${s.name} (${s.student_number || `#${s.id}`})`);
                        setShowStudentDropdown(false);
                        setStudentSearch("");
                      }}
                    >
                      <span className="font-medium text-foreground">{s.name}</span>
                      <span className="font-mono text-muted-foreground">{s.student_number}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    {studentSearchQuery.isFetching ? "Searching students…" : "No matching students found."}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Entry Type Selector */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Entry Type</Label>
        <div className="grid grid-cols-3 gap-2">
          {(["ar", "payment", "adjustment"] as const).map((type) => {
            const cfg = {
              ar: { label: "Assessment (AR)", dot: "bg-rose-500", active: "border-rose-400 bg-rose-50 text-rose-900 font-semibold shadow-xs dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800" },
              payment: { label: "Payment", dot: "bg-emerald-500", active: "border-emerald-400 bg-emerald-50 text-emerald-900 font-semibold shadow-xs dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800" },
              adjustment: { label: "Adjustment", dot: "bg-sky-500", active: "border-sky-400 bg-sky-50 text-sky-900 font-semibold shadow-xs dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-800" },
            }[type];
            return (
              <button
                key={type}
                type="button"
                className={`flex items-center justify-center gap-2 rounded-xl border py-2 px-3 text-xs font-medium transition-all ${
                  entryType === type ? cfg.active : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => handleEntryTypeChange(type)}
              >
                <div className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Course and Term Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Course / Program</Label>
          <select
            className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={courseId}
            onChange={(e) => setCourseId(Number(e.target.value))}
            required
          >
            <option value="">Select Course…</option>
            {masterQuery.data?.courses.map((c) => (
              <option key={c.id} value={c.id}>{c.course_code} - {c.course_desc}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Academic Term</Label>
          <select
            className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={termId}
            onChange={(e) => setTermId(Number(e.target.value))}
            required
          >
            <option value="">Select Term…</option>
            {masterQuery.data?.academicTerms.map((t) => (
              <option key={t.id} value={t.id}>SY {t.school_year} — {t.semester}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Particulars & Presets */}
      <div className="space-y-2">
        <Label className="flex items-center justify-between text-xs font-semibold">
          <span>Particulars</span>
          <span className="text-[11px] font-normal text-muted-foreground">Click preset or type</span>
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {PARTICULARS_PRESETS[ledger].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setParticulars(preset)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] transition-colors ${
                particulars === preset
                  ? "border-blue-500 bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
        <Input
          placeholder="e.g. Tuition Fee (1st Sem)"
          value={particulars}
          onChange={(e) => setParticulars(e.target.value)}
          className="h-10 rounded-xl"
          required
        />
      </div>

      {/* Financial Calculation Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Units (Optional)</Label>
          <Input
            type="number"
            step="0.5"
            min="0"
            placeholder="e.g. 6"
            value={units}
            onChange={(e) => handleUnitsChange(e.target.value)}
            className="h-10 rounded-xl font-mono text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Rate per Unit / Item</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="₱ 0.00"
            value={rate}
            onChange={(e) => handleRateChange(e.target.value)}
            className="h-10 rounded-xl font-mono text-xs"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Total Amount (₱)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="₱ 0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-10 rounded-xl font-mono text-xs font-bold"
            required
          />
        </div>
      </div>

      {/* Membership Scholarship — Graduate AR only, create mode */}
      {isGraduate && isAR && mode === "create" && (
        <MembershipControl
          value={membership}
          onChange={setMembership}
          amount={numAmount}
        />
      )}

      {/* Latin Honor — Graduate AR only */}
      {isGraduate && isAR && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Latin Honor (Optional)</Label>
          <Input
            placeholder="e.g. Magna Cum Laude, Cum Laude"
            value={latinHonor}
            onChange={(e) => setLatinHonor(e.target.value)}
            className="h-10 rounded-xl text-xs"
          />
        </div>
      )}

      {/* Reference & Date Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Reference / OR Number (Optional)</Label>
          <Input
            placeholder="e.g. OR-849204"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            className="h-10 rounded-xl font-mono text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Transaction Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 rounded-xl text-xs"
            required
          />
        </div>
      </div>

      {/* Remarks */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Remarks (Optional)</Label>
        <Input
          placeholder="e.g. Partial settlement for midterm assessment"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="h-10 rounded-xl text-xs"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-28 bg-blue-600 text-white hover:bg-blue-700"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </div>
          ) : mode === "edit" ? (
            "Save Changes"
          ) : (
            "Post Entry"
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Batch Form ───────────────────────────────────────────────────────────────

function BatchForm({
  ledger,
  onClose,
  onSuccess,
}: {
  ledger: Ledger;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const createMutation = useCreateLedgerRecord();
  const masterQuery = useLedgerMasterData(ledger);

  const [studentId, setStudentId] = useState<number | "">("");
  const [studentLabel, setStudentLabel] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [courseId, setCourseId] = useState<number | "">(masterQuery.data?.courses?.[0]?.id ?? "");
  const [termId, setTermId] = useState<number | "">(masterQuery.data?.academicTerms?.[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<BatchLine[]>([emptyBatchLine()]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const studentSearchQuery = useSearchLedgerStudents(
    ledger,
    studentSearch,
    showStudentDropdown && studentSearch.trim().length > 0,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!studentId) return setErrorMessage("Please select a student.");
    const resolvedCourseId = courseId || masterQuery.data?.courses?.[0]?.id;
    if (!resolvedCourseId) return setErrorMessage("Please select a course.");
    const resolvedTermId = termId || masterQuery.data?.academicTerms?.[0]?.id;
    if (!resolvedTermId) return setErrorMessage("Please select an academic term.");
    if (lines.length === 0) return setErrorMessage("Add at least one line.");
    if (lines.length > 50) return setErrorMessage("Maximum 50 lines per batch.");

    const badLine = lines.findIndex((l) => batchLineAmount(l) <= 0);
    if (badLine !== -1) {
      return setErrorMessage(`Line #${badLine + 1} must have an amount greater than zero.`);
    }

    const payload: LedgerTransactionRequest = {
      student_id: Number(studentId),
      course_id: Number(resolvedCourseId),
      academic_term_id: Number(resolvedTermId),
      transaction_date: date,
      // required top-level fields — backend ignores them when items[] present
      entry_type: "ar",
      particulars: lines[0]?.particulars || "Tuition Fee",
      rate: 0,
      amount: 0,
      items: lines.map((line) => {
        const amt = batchLineAmount(line);
        return {
          entry_type: line.entry_type,
          particulars: line.particulars,
          units: Number(line.units || 0),
          rate: Number(line.rate || 0),
          amount: amt,
          reference_number: line.reference_number || undefined,
          remarks: line.remarks || undefined,
          ...(line.entry_type === "ar" && line.membership
            ? { membership: line.membership, discount_amount: amt }
            : {}),
        };
      }),
    };

    createMutation.mutate(
      { ledger, payload },
      {
        onSuccess: (res) => {
          const msg =
            res && typeof res === "object" && "message" in res
              ? String((res as { message: string }).message)
              : `${lines.length} transaction${lines.length === 1 ? "" : "s"} posted.`;
          onSuccess(msg);
          onClose();
        },
        onError: (err) =>
          setErrorMessage(err instanceof ApiError ? err.message : "Failed to save batch."),
      },
    );
  };

  const isSubmitting = createMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* Shared header: student / course / term / date */}
      <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
        {/* Student */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Student</Label>
          {studentId ? (
            <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold">{studentLabel}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => { setStudentId(""); setStudentLabel(""); setStudentSearch(""); }}
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search student…"
                value={studentSearch}
                onChange={(e) => { setStudentSearch(e.target.value); setShowStudentDropdown(true); }}
                onFocus={() => setShowStudentDropdown(true)}
                className="h-9 rounded-xl pl-9 text-xs"
              />
              {showStudentDropdown && studentSearch.trim().length > 0 && (
                <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg">
                  {studentSearchQuery.data?.data?.length ? (
                    studentSearchQuery.data.data.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs hover:bg-muted/80"
                        onClick={() => { setStudentId(s.id); setStudentLabel(`${s.name} (${s.student_number || `#${s.id}`})`); setShowStudentDropdown(false); setStudentSearch(""); }}
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="font-mono text-muted-foreground">{s.student_number}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-2 text-center text-xs text-muted-foreground">
                      {studentSearchQuery.isFetching ? "Searching…" : "No results."}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-[11px]">Course</Label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">Select…</option>
              {masterQuery.data?.courses.map((c) => (
                <option key={c.id} value={c.id}>{c.course_code}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Academic Term</Label>
            <select
              value={termId}
              onChange={(e) => setTermId(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">Select…</option>
              {masterQuery.data?.academicTerms.map((t) => (
                <option key={t.id} value={t.id}>SY {t.school_year} — {t.semester}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Transaction Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 rounded-lg text-xs"
              required
            />
          </div>
        </div>
      </div>

      {/* Line items */}
      <BatchLinesEditor ledger={ledger} lines={lines} onChange={setLines} />

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || lines.length === 0}
          className="min-w-36 bg-blue-600 text-white hover:bg-blue-700"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Posting…
            </div>
          ) : (
            `Post ${lines.length} Transaction${lines.length === 1 ? "" : "s"}`
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Dialog Shell ─────────────────────────────────────────────────────────────

export function LedgerTransactionForm({
  ledger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  mode = "create",
  initialData,
  defaultStudentId,
  defaultStudentName,
}: LedgerTransactionFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const [entryMode, setEntryMode] = useState<EntryMode>("single");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch master data at shell level so CohortEntryPanel receives it
  const masterQuery = useLedgerMasterData(ledger);

  const setOpen = (openState: boolean) => {
    if (!openState) {
      setEntryMode("single");
      setSuccessMsg(null);
    }
    if (isControlled) {
      controlledOnOpenChange?.(openState);
    } else {
      setInternalOpen(openState);
    }
  };

  const handleSuccess = (msg: string) => setSuccessMsg(msg);
  const handleClose = () => setOpen(false);

  // In edit mode, always single; mode switcher hidden
  const showModeSwitcher = mode === "create";

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger
          render={
            <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-xs">
              <Plus className="h-4 w-4" />
              New Transaction
            </Button>
          }
        />
      )}

      <DialogContent className="max-h-[92vh] overflow-y-auto p-6 sm:max-w-3xl">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">
                {mode === "edit" ? "Edit Transaction" : "New Ledger Transaction"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {mode === "edit"
                  ? "Update entry particulars, amounts, or references."
                  : `Post to the ${ledger === "graduate" ? "Graduate School" : "School of Law"} Ledger.`}
              </DialogDescription>
            </div>
            {showModeSwitcher && (
              <ModeSwitcher
                mode={entryMode}
                onChange={(m) => { setEntryMode(m); setSuccessMsg(null); }}
                ledger={ledger}
              />
            )}
          </div>
        </DialogHeader>

        {/* Success banner — stays visible until dialog is closed */}
        {successMsg && (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
              {successMsg}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        )}

        {isOpen && !successMsg && (
          <>
            {entryMode === "single" && (
              <SingleFormFields
                key={`single-${mode}-${initialData?.id ?? defaultStudentId ?? "new"}`}
                ledger={ledger}
                mode={mode}
                initialData={initialData}
                defaultStudentId={defaultStudentId}
                defaultStudentName={defaultStudentName}
                onClose={handleClose}
                onSuccess={handleSuccess}
              />
            )}

            {entryMode === "batch" && (
              <BatchForm
                key="batch"
                ledger={ledger}
                onClose={handleClose}
                onSuccess={handleSuccess}
              />
            )}

            {entryMode === "cohort" && ledger === "graduate" && (
              <CohortEntryPanel
                key="cohort"
                ledger={ledger}
                courses={masterQuery.data?.courses ?? []}
                academicTerms={masterQuery.data?.academicTerms ?? []}
                onDone={handleSuccess}
                onCancel={handleClose}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
