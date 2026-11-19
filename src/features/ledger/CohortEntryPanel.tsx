import { useMemo, useState } from "react";
import { Loader2, Search, Users } from "lucide-react";
import { ApiError } from "../../api/client";
import type { Ledger } from "./api";
import { useCohortStore } from "./mutations";
import { useLedgerRoster, type LedgerAcademicTerm, type LedgerCourse } from "./queries";
import { formatCurrency } from "./controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EntryType = "ar" | "payment" | "adjustment";
type Membership = "" | "NAPU" | "NORSUFFA";

interface RowOverride {
  units?: string;
  rate?: string;
  amount?: string;
  membership?: Membership;
  remarks?: string;
}

const PARTICULARS: Record<EntryType, string[]> = {
  ar: ["Tuition Fee", "Matriculation Fee", "Comprehensive Exam Fee", "Graduation Fee"],
  payment: ["Payment for Assessment", "Balance Settlement", "Partial Payment"],
  adjustment: ["Scholarship Adjustment", "Discount Adjustment", "Waiver"],
};

const ENTRY_TYPES: Array<{
  value: EntryType;
  label: string;
  dot: string;
  active: string;
}> = [
  {
    value: "ar",
    label: "Assessment (AR)",
    dot: "bg-rose-500",
    active:
      "border-rose-400 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800",
  },
  {
    value: "payment",
    label: "Payment",
    dot: "bg-emerald-500",
    active:
      "border-emerald-400 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800",
  },
  {
    value: "adjustment",
    label: "Adjustment",
    dot: "bg-sky-500",
    active:
      "border-sky-400 bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-800",
  },
];

export function CohortEntryPanel({
  ledger,
  courses,
  academicTerms,
  onDone,
  onCancel,
}: {
  ledger: Ledger;
  courses: LedgerCourse[];
  academicTerms: LedgerAcademicTerm[];
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const rosterQuery = useLedgerRoster(ledger, true);
  const cohortMutation = useCohortStore();

  const [courseId, setCourseId] = useState<number | "">(
    courses[0]?.id ?? "",
  );
  const [termId, setTermId] = useState<number | "">(
    academicTerms[0]?.id ?? "",
  );
  const [entryType, setEntryType] = useState<EntryType>("ar");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [particulars, setParticulars] = useState("Tuition Fee");
  const [reference, setReference] = useState("");
  const [units, setUnits] = useState("");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  const [membership, setMembership] = useState<Membership>("");
  const [remarks, setRemarks] = useState("");

  const [search, setSearch] = useState("");
  const [filterCourseOnly, setFilterCourseOnly] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [overrides, setOverrides] = useState<Record<number, RowOverride>>({});
  const [error, setError] = useState<string | null>(null);

  const isAR = entryType === "ar";
  const showMembership = isAR && ledger === "graduate";

  const roster = rosterQuery.data?.data ?? [];

  const available = useMemo(() => {
    let pool = roster;

    if (filterCourseOnly && courseId) {
      pool = pool.filter((student) =>
        student.last_course_id
          ? String(student.last_course_id) === String(courseId)
          : true,
      );
    }

    const term = search.trim().toLowerCase();
    if (term) {
      pool = pool.filter(
        (student) =>
          student.name.toLowerCase().includes(term) ||
          (student.student_number ?? "").toLowerCase().includes(term),
      );
    }

    return pool;
  }, [roster, filterCourseOnly, courseId, search]);

  const templateUnits = Number(units || 0);
  const templateRate = Number(rate || 0);
  const templateAmount =
    isAR && amount === ""
      ? templateUnits * templateRate
      : Number(amount || 0);

  const rows = useMemo(() => {
    const byId = new Map(roster.map((student) => [student.id, student]));

    return Array.from(selected).map((studentId) => {
      const student = byId.get(studentId);
      const override = overrides[studentId] ?? {};
      const rowUnits =
        override.units !== undefined ? Number(override.units || 0) : templateUnits;
      const rowRate =
        override.rate !== undefined ? Number(override.rate || 0) : templateRate;
      const rowAmount =
        override.amount !== undefined
          ? Number(override.amount || 0)
          : isAR && amount === ""
            ? rowUnits * rowRate
            : templateAmount;
      const rowMembership =
        override.membership !== undefined ? override.membership : membership;
      const rowRemarks =
        override.remarks !== undefined ? override.remarks : remarks;

      return {
        studentId,
        name: student?.name ?? `Student #${studentId}`,
        studentNumber: student?.student_number ?? "",
        units: override.units ?? units,
        rate: override.rate ?? rate,
        amount: rowAmount,
        membership: rowMembership,
        remarks: rowRemarks,
      };
    });
  }, [
    selected,
    roster,
    overrides,
    templateUnits,
    templateRate,
    templateAmount,
    isAR,
    amount,
    membership,
    remarks,
    units,
    rate,
  ]);

  const totals = rows.reduce(
    (acc, row) => {
      acc.amount += row.amount;
      if (row.membership) acc.scholarships += 1;
      return acc;
    },
    { amount: 0, scholarships: 0 },
  );

  const toggleStudent = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateOverride = (id: number, patch: RowOverride) => {
    setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!courseId) return setError("Please select a course.");
    if (!termId) return setError("Please select an academic term.");
    if (!particulars.trim()) return setError("Please provide particulars.");
    if (rows.length === 0) return setError("Please select at least one student.");

    const invalid = rows.find((row) => !row.amount || row.amount <= 0);
    if (invalid) {
      return setError(`${invalid.name} has an invalid amount (must be > 0).`);
    }

    cohortMutation.mutate(
      {
        ledger,
        payload: {
          course_id: Number(courseId),
          academic_term_id: Number(termId),
          entry_type: entryType,
          transaction_date: date,
          particulars: particulars.trim(),
          reference_number: reference.trim() || null,
          status: "posted",
          cohort_rows: rows.map((row) => ({
            student_id: row.studentId,
            units: Number(row.units || 0),
            rate: Number(row.rate || 0),
            amount: Number(row.amount.toFixed(2)),
            membership: showMembership && row.membership ? row.membership : null,
            discount_amount:
              showMembership && row.membership
                ? Number(row.amount.toFixed(2))
                : null,
            remarks: row.remarks || null,
          })),
        },
      },
      {
        onSuccess: (response) => onDone(response.message),
        onError: (err) =>
          setError(
            err instanceof ApiError ? err.message : "Failed to save cohort.",
          ),
      },
    );
  };

  const isSubmitting = cohortMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Template */}
      <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {ENTRY_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => {
                setEntryType(type.value);
                setParticulars(PARTICULARS[type.value][0] ?? "Tuition Fee");
                if (type.value !== "ar") setMembership("");
              }}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                entryType === type.value
                  ? `${type.active} font-semibold shadow-xs`
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${type.dot}`} />
              {type.label}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-muted-foreground">
            Template values apply to every selected student
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-[11px]">Course / Program</Label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">Select Course…</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_code} - {course.course_desc}
                </option>
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
              <option value="">Select Term…</option>
              {academicTerms.map((term) => (
                <option key={term.id} value={term.id}>
                  SY {term.school_year} — {term.semester}
                </option>
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
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[11px]">Particulars</Label>
            <div className="flex gap-1.5">
              <Input
                value={particulars}
                onChange={(e) => setParticulars(e.target.value)}
                className="h-9 rounded-lg text-xs"
                required
              />
              <select
                value=""
                onChange={(e) => e.target.value && setParticulars(e.target.value)}
                className="h-9 w-28 rounded-lg border border-input bg-card px-2 text-xs"
                aria-label="Particulars presets"
              >
                <option value="">Presets…</option>
                {PARTICULARS[entryType].map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Reference / OR</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Optional"
              className="h-9 rounded-lg font-mono text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Units</Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className="h-9 rounded-lg font-mono text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Rate</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="h-9 rounded-lg font-mono text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">
              Amount (₱){isAR && amount === "" ? " · auto" : ""}
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={
                isAR && units && rate
                  ? (Number(units) * Number(rate)).toFixed(2)
                  : "₱ 0.00"
              }
              className="h-9 rounded-lg font-mono text-xs font-semibold"
            />
          </div>
          {showMembership && (
            <div className="space-y-1">
              <Label className="text-[11px]">Membership</Label>
              <select
                value={membership}
                onChange={(e) => setMembership(e.target.value as Membership)}
                className="h-9 w-full rounded-lg border border-input bg-card px-2 text-xs"
              >
                <option value="">None</option>
                <option value="NAPU">NAPU</option>
                <option value="NORSUFFA">NORSUFFA</option>
              </select>
            </div>
          )}
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[11px]">Remarks</Label>
            <Input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional"
              className="h-9 rounded-lg text-xs"
            />
          </div>
        </div>
      </div>

      {/* Student picker */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="space-y-2 rounded-xl border p-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              <Users className="h-3.5 w-3.5" />
              Select Students
            </Label>
            <span className="text-[11px] text-muted-foreground">
              {selected.size} selected
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or student number…"
              className="h-9 rounded-lg pl-8 text-xs"
            />
          </div>
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={filterCourseOnly}
              onChange={(e) => setFilterCourseOnly(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-input"
            />
            Only students last enrolled in the selected course
          </label>
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() =>
                setSelected((prev) => {
                  const next = new Set(prev);
                  available.forEach((student) => next.add(student.id));
                  return next;
                })
              }
            >
              Select all filtered
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
          </div>
          <div className="max-h-52 space-y-0.5 overflow-y-auto rounded-lg border bg-card p-1">
            {rosterQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 p-3 text-[11px] text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading students…
              </div>
            ) : available.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-muted-foreground">
                No students match this filter.
              </div>
            ) : (
              available.map((student) => (
                <label
                  key={student.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[11px] hover:bg-muted/70"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(student.id)}
                    onChange={() => toggleStudent(student.id)}
                    className="h-3.5 w-3.5 rounded border-input"
                  />
                  <span className="truncate font-medium text-foreground">
                    {student.name}
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-muted-foreground">
                    {student.student_number}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Selected rows */}
        <div className="space-y-2 rounded-xl border p-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Cohort Rows</Label>
            <span className="text-[11px] text-muted-foreground">
              {rows.length} row{rows.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="max-h-[19rem] space-y-1.5 overflow-y-auto pr-1">
            {rows.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-[11px] text-muted-foreground">
                No students selected yet.
              </div>
            ) : (
              rows.map((row) => (
                <div key={row.studentId} className="rounded-lg border bg-card p-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] font-semibold">
                      {row.name}
                    </span>
                    <button
                      type="button"
                      className="text-[10px] text-muted-foreground hover:text-rose-600"
                      onClick={() => toggleStudent(row.studentId)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    <Input
                      type="number"
                      value={row.units}
                      onChange={(e) =>
                        updateOverride(row.studentId, { units: e.target.value })
                      }
                      placeholder="Units"
                      className="h-8 rounded-md font-mono text-[11px]"
                      aria-label={`${row.name} units`}
                    />
                    <Input
                      type="number"
                      value={row.rate}
                      onChange={(e) =>
                        updateOverride(row.studentId, { rate: e.target.value })
                      }
                      placeholder="Rate"
                      className="h-8 rounded-md font-mono text-[11px]"
                      aria-label={`${row.name} rate`}
                    />
                    <Input
                      type="number"
                      value={
                        overrides[row.studentId]?.amount ?? row.amount.toFixed(2)
                      }
                      onChange={(e) =>
                        updateOverride(row.studentId, { amount: e.target.value })
                      }
                      className="h-8 rounded-md font-mono text-[11px] font-semibold"
                      aria-label={`${row.name} amount`}
                    />
                    {showMembership ? (
                      <select
                        value={row.membership}
                        onChange={(e) =>
                          updateOverride(row.studentId, {
                            membership: e.target.value as Membership,
                          })
                        }
                        className="h-8 w-full rounded-md border border-input bg-card px-1 text-[11px]"
                        aria-label={`${row.name} membership`}
                      >
                        <option value="">None</option>
                        <option value="NAPU">NAPU</option>
                        <option value="NORSUFFA">NORSUFFA</option>
                      </select>
                    ) : (
                      <span className="flex items-center font-mono text-[11px] text-muted-foreground">
                        {formatCurrency(row.amount)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center justify-between border-t pt-2 text-[11px]">
            <span className="text-muted-foreground">
              {totals.scholarships} scholarship row
              {totals.scholarships === 1 ? "" : "s"}
            </span>
            <span className="font-bold">
              Total: {formatCurrency(totals.amount)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t pt-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || rows.length === 0}
          className="min-w-36 bg-blue-600 text-white hover:bg-blue-700"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Posting…
            </div>
          ) : (
            `Post ${rows.length || ""} Cohort Row${rows.length === 1 ? "" : "s"}`
          )}
        </Button>
      </div>
    </form>
  );
}
