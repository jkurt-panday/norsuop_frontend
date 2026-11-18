import { useState } from "react";
import {
  Loader2,
  Plus,
  Search,
  User,
} from "lucide-react";
import { ApiError } from "../../api/client";
import type { Ledger, LedgerRecord, LedgerTransactionRequest } from "./api";
import { useCreateLedgerRecord, useUpdateLedgerRecord } from "./mutations";
import { useLedgerMasterData, useSearchLedgerStudents } from "./queries";
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

interface LedgerTransactionFormProps {
  ledger: Ledger;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: "create" | "edit";
  initialData?: LedgerRecord | null;
  defaultStudentId?: number;
  defaultStudentName?: string;
}

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

interface FormFieldsProps {
  ledger: Ledger;
  mode: "create" | "edit";
  initialData?: LedgerRecord | null;
  defaultStudentId?: number;
  defaultStudentName?: string;
  onClose: () => void;
}

function FormFields({
  ledger,
  mode,
  initialData,
  defaultStudentId,
  defaultStudentName,
  onClose,
}: FormFieldsProps) {
  const createMutation = useCreateLedgerRecord();
  const updateMutation = useUpdateLedgerRecord();
  const masterQuery = useLedgerMasterData(ledger);

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

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const studentSearchQuery = useSearchLedgerStudents(
    ledger,
    studentSearch,
    showStudentDropdown && studentSearch.trim().length > 0,
  );

  const handleUnitsChange = (val: string) => {
    setUnits(val);
    const u = parseFloat(val);
    const r = parseFloat(rate);
    if (!isNaN(u) && !isNaN(r) && u > 0) {
      setAmount((u * r).toFixed(2));
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!studentId) {
      setErrorMessage("Please select a student.");
      return;
    }
    const resolvedCourseId = courseId || masterQuery.data?.courses?.[0]?.id;
    if (!resolvedCourseId) {
      setErrorMessage("Please select a course/program.");
      return;
    }
    const resolvedTermId = termId || masterQuery.data?.academicTerms?.[0]?.id;
    if (!resolvedTermId) {
      setErrorMessage("Please select an academic term.");
      return;
    }
    if (!particulars.trim()) {
      setErrorMessage("Please provide particulars for the transaction.");
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      setErrorMessage("Please enter a valid amount.");
      return;
    }

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

    if (mode === "edit" && initialData?.id) {
      updateMutation.mutate(
        { ledger, id: initialData.id, payload },
        {
          onSuccess: () => {
            onClose();
          },
          onError: (err) => {
            setErrorMessage(
              err instanceof ApiError ? err.message : "Failed to update transaction.",
            );
          },
        },
      );
    } else {
      createMutation.mutate(
        { ledger, payload },
        {
          onSuccess: () => {
            onClose();
          },
          onError: (err) => {
            setErrorMessage(
              err instanceof ApiError ? err.message : "Failed to create transaction.",
            );
          },
        },
      );
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

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
                <div className="text-sm font-semibold text-foreground">
                  {studentLabel}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  ID #{studentId}
                </div>
              </div>
            </div>
            {mode !== "edit" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setStudentId("");
                  setStudentLabel("");
                  setStudentSearch("");
                }}
              >
                Change
              </Button>
            )}
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name or student number…"
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  setShowStudentDropdown(true);
                }}
                onFocus={() => setShowStudentDropdown(true)}
                className="pl-9 h-10 rounded-xl"
              />
              {studentSearchQuery.isFetching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {showStudentDropdown && studentSearch.trim().length > 0 && (
              <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg">
                {studentSearchQuery.data?.data &&
                studentSearchQuery.data.data.length > 0 ? (
                  studentSearchQuery.data.data.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs hover:bg-muted/80 transition-colors"
                      onClick={() => {
                        setStudentId(s.id);
                        setStudentLabel(
                          `${s.name} (${s.student_number || `#${s.id}`})`,
                        );
                        setShowStudentDropdown(false);
                        setStudentSearch("");
                      }}
                    >
                      <span className="font-medium text-foreground">
                        {s.name}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {s.student_number}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    {studentSearchQuery.isFetching
                      ? "Searching students…"
                      : "No matching students found."}
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
          <button
            type="button"
            className={`flex items-center justify-center gap-2 rounded-xl border py-2 px-3 text-xs font-medium transition-all ${
              entryType === "ar"
                ? "border-rose-400 bg-rose-50 text-rose-900 font-semibold shadow-xs dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => setEntryType("ar")}
          >
            <div className="h-2 w-2 rounded-full bg-rose-500" />
            Assessment (AR)
          </button>
          <button
            type="button"
            className={`flex items-center justify-center gap-2 rounded-xl border py-2 px-3 text-xs font-medium transition-all ${
              entryType === "payment"
                ? "border-emerald-400 bg-emerald-50 text-emerald-900 font-semibold shadow-xs dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => setEntryType("payment")}
          >
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            Payment
          </button>
          <button
            type="button"
            className={`flex items-center justify-center gap-2 rounded-xl border py-2 px-3 text-xs font-medium transition-all ${
              entryType === "adjustment"
                ? "border-sky-400 bg-sky-50 text-sky-900 font-semibold shadow-xs dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-800"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => setEntryType("adjustment")}
          >
            <div className="h-2 w-2 rounded-full bg-sky-500" />
            Adjustment
          </button>
        </div>
      </div>

      {/* Course and Term Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Course / Program</Label>
          <select
            className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={courseId}
            onChange={(e) => setCourseId(Number(e.target.value))}
            required
          >
            <option value="">Select Course…</option>
            {masterQuery.data?.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course_code} - {c.course_desc}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Academic Term</Label>
          <select
            className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={termId}
            onChange={(e) => setTermId(Number(e.target.value))}
            required
          >
            <option value="">Select Term…</option>
            {masterQuery.data?.academicTerms.map((t) => (
              <option key={t.id} value={t.id}>
                SY {t.school_year} — {t.semester}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Particulars & Presets */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold flex items-center justify-between">
          <span>Particulars</span>
          <span className="text-[11px] font-normal text-muted-foreground">
            Click preset or type
          </span>
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {PARTICULARS_PRESETS[ledger].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setParticulars(preset)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] transition-colors ${
                particulars === preset
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-semibold"
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

      {/* Reference & Date Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">
            Reference / OR Number (Optional)
          </Label>
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

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white hover:bg-blue-700 min-w-28"
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

  const setOpen = (openState: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(openState);
    } else {
      setInternalOpen(openState);
    }
  };

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

      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-bold">
            {mode === "edit" ? "Edit Transaction" : "New Ledger Transaction"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {mode === "edit"
              ? "Update entry particulars, amounts, or references."
              : `Post a new transaction to the ${ledger === "graduate" ? "Graduate School" : "School of Law"} Ledger.`}
          </DialogDescription>
        </DialogHeader>

        {isOpen && (
          <FormFields
            key={`${mode}-${initialData?.id ?? defaultStudentId ?? "new"}`}
            ledger={ledger}
            mode={mode}
            initialData={initialData}
            defaultStudentId={defaultStudentId}
            defaultStudentName={defaultStudentName}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
