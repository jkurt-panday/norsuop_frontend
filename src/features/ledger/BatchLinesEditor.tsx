import { Plus, Sparkles, Trash2 } from "lucide-react";
import type { Ledger } from "./api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "./controls";

export type BatchEntryType = "ar" | "payment" | "adjustment";
export type BatchMembership = "" | "NAPU" | "NORSUFFA";
export type BatchLatinHonor = "" | "SUMMA" | "MAGNA" | "CUM_LAUDE";

export const LATIN_HONOR_OPTIONS = [
  { value: "SUMMA", label: "Summa Cum Laude (100%)", shortLabel: "Summa", rate: 1 },
  { value: "MAGNA", label: "Magna Cum Laude (75%)", shortLabel: "Magna", rate: 0.75 },
  { value: "CUM_LAUDE", label: "Cum Laude (50%)", shortLabel: "Cum Laude", rate: 0.5 },
] as const;

export function latinHonorDiscount(amount: number, honor: BatchLatinHonor): number {
  return amount * (LATIN_HONOR_OPTIONS.find((option) => option.value === honor)?.rate ?? 0);
}

export interface BatchLine {
  id: string;
  entry_type: BatchEntryType;
  particulars: string;
  units: string;
  rate: string;
  amount: string;
  reference_number: string;
  membership: BatchMembership;
  latin_honor: BatchLatinHonor;
  remarks: string;
}

let batchLineCounter = 0;

export function emptyBatchLine(
  particulars = "Tuition Fee",
): BatchLine {
  batchLineCounter += 1;

  return {
    id: `line-${Date.now()}-${batchLineCounter}`,
    entry_type: "ar",
    particulars,
    units: "",
    rate: "",
    amount: "",
    reference_number: "",
    membership: "",
    latin_honor: "",
    remarks: "",
  };
}

const ENTRY_TYPES: Array<{
  value: BatchEntryType;
  label: string;
  dot: string;
  active: string;
}> = [
  {
    value: "ar",
    label: "AR",
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

export function batchLineAmount(line: BatchLine): number {
  const explicit = parseFloat(line.amount);
  if (!Number.isNaN(explicit) && line.amount !== "") return explicit;

  const units = parseFloat(line.units);
  const rate = parseFloat(line.rate);
  if (!Number.isNaN(units) && !Number.isNaN(rate)) return units * rate;

  return Number.isNaN(explicit) ? 0 : explicit;
}

export function BatchLinesEditor({
  ledger,
  lines,
  onChange,
}: {
  ledger: Ledger;
  lines: BatchLine[];
  onChange: (lines: BatchLine[]) => void;
}) {
  const updateLine = (id: string, patch: Partial<BatchLine>) => {
    onChange(
      lines.map((line) => {
        if (line.id !== id) return line;

        const next = { ...line, ...patch };

        if (patch.entry_type && patch.entry_type !== "ar") {
          next.membership = "";
          next.latin_honor = "";
        }

        // Recompute the amount when units / rate change on a blank amount.
        if (
          (patch.units !== undefined || patch.rate !== undefined) &&
          next.amount === ""
        ) {
          const units = parseFloat(next.units);
          const rate = parseFloat(next.rate);
          if (!Number.isNaN(units) && !Number.isNaN(rate) && units > 0) {
            next.amount = (units * rate).toFixed(2);
          }
        }

        return next;
      }),
    );
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    onChange(lines.filter((line) => line.id !== id));
  };

  const totals = lines.reduce(
    (acc, line) => {
      const amount = batchLineAmount(line);
      if (line.entry_type === "ar") acc.charges += amount;
      else if (line.entry_type === "payment") acc.payments += amount;
      else acc.adjustments += amount;
      if (line.entry_type === "ar" && ledger === "law") {
        acc.scholarships += latinHonorDiscount(amount, line.latin_honor);
      }

      return acc;
    },
    { charges: 0, payments: 0, adjustments: 0, scholarships: 0 },
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs font-semibold">Transaction Lines</Label>
          <p className="text-[11px] text-muted-foreground">
            {lines.length} line{lines.length === 1 ? "" : "s"} · posted together
            for the selected student.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => onChange([...lines, emptyBatchLine()])}
          disabled={lines.length >= 50}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Line
        </Button>
      </div>

      <div className="max-h-[42vh] space-y-3 overflow-y-auto pr-1">
        {lines.map((line, index) => {
          const isAR = line.entry_type === "ar";
          const showMembership = isAR && ledger === "graduate";
          const showLatinHonor = isAR && ledger === "law";
          const lineAmount = batchLineAmount(line);
          const honorDiscount = latinHonorDiscount(lineAmount, line.latin_honor);

          return (
            <div
              key={line.id}
              className="rounded-xl border bg-card p-3 shadow-xs"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Line #{index + 1}
                  </span>
                  {ENTRY_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        updateLine(line.id, { entry_type: type.value })
                      }
                      className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium transition-all ${
                        line.entry_type === type.value
                          ? `${type.active} font-semibold shadow-xs`
                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${type.dot}`}
                      />
                      {type.label}
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                  onClick={() => removeLine(line.id)}
                  disabled={lines.length <= 1}
                  aria-label={`Remove line ${index + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="col-span-2 space-y-1">
                  <Label className="text-[11px]">Particulars</Label>
                  <Input
                    value={line.particulars}
                    onChange={(e) =>
                      updateLine(line.id, { particulars: e.target.value })
                    }
                    placeholder="e.g. Tuition Fee"
                    className="h-9 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Units</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={line.units}
                    onChange={(e) =>
                      updateLine(line.id, { units: e.target.value })
                    }
                    className="h-9 rounded-lg font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Rate</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.rate}
                    onChange={(e) =>
                      updateLine(line.id, { rate: e.target.value })
                    }
                    className="h-9 rounded-lg font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Amount (₱)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.amount}
                    onChange={(e) =>
                      updateLine(line.id, { amount: e.target.value })
                    }
                    className="h-9 rounded-lg font-mono text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Reference / OR</Label>
                  <Input
                    value={line.reference_number}
                    onChange={(e) =>
                      updateLine(line.id, { reference_number: e.target.value })
                    }
                    placeholder="Optional"
                    className="h-9 rounded-lg font-mono text-xs"
                  />
                </div>
                {showMembership && (
                  <div className="space-y-1">
                    <Label className="text-[11px]">Membership</Label>
                    <select
                      value={line.membership}
                      onChange={(e) =>
                        updateLine(line.id, {
                          membership: e.target.value as BatchMembership,
                        })
                      }
                      className="h-9 w-full rounded-lg border border-input bg-card px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">None</option>
                      <option value="NAPU">NAPU</option>
                      <option value="NORSUFFA">NORSUFFA</option>
                    </select>
                  </div>
                )}
                {showLatinHonor && (
                  <div className="col-span-2 space-y-2 rounded-lg border border-border/70 bg-muted/20 p-2 sm:col-span-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground">Latin Honor Scholarship:</span>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => updateLine(line.id, { latin_honor: "" })}
                          className={`rounded px-2 py-0.5 text-[10px] ${!line.latin_honor ? "bg-slate-200 font-bold text-slate-800" : "text-slate-500"}`}
                        >
                          None
                        </button>
                        {LATIN_HONOR_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateLine(line.id, { latin_honor: option.value })}
                            className={`rounded px-2 py-0.5 text-[10px] ${line.latin_honor === option.value ? "bg-purple-600 font-bold text-white" : "border border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300"}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {line.latin_honor && (
                      <div className="flex items-center gap-2 rounded-md border border-dashed border-purple-300 bg-purple-50/60 px-3 py-2 text-[11px] text-purple-800 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300">
                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                        <span>
                          <strong>Auto-generated on save:</strong> Scholarship Adjustment −{formatCurrency(honorDiscount)}. Net line impact: <strong>{formatCurrency(lineAmount - honorDiscount)}</strong>.
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="col-span-2 space-y-1">
                  <Label className="text-[11px]">Remarks</Label>
                  <Input
                    value={line.remarks}
                    onChange={(e) =>
                      updateLine(line.id, { remarks: e.target.value })
                    }
                    placeholder="Optional"
                    className="h-9 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border bg-muted/30 px-3 py-2 text-[11px]">
        <span className="font-semibold text-rose-600 dark:text-rose-400">
          Charges: {formatCurrency(totals.charges)}
        </span>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          Payments: {formatCurrency(totals.payments)}
        </span>
        <span className="font-semibold text-sky-600 dark:text-sky-400">
          Adjustments: {formatCurrency(totals.adjustments)}
        </span>
        {ledger === "law" && totals.scholarships > 0 && (
          <span className="font-semibold text-purple-600 dark:text-purple-400">
            Honor Credits: {formatCurrency(totals.scholarships)}
          </span>
        )}
        <span className="ml-auto font-bold text-foreground">
          Net:{" "}
          {formatCurrency(
            totals.charges - totals.payments - totals.adjustments - totals.scholarships,
          )}
        </span>
      </div>
    </div>
  );
}
