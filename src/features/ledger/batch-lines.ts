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

export function batchLineAmount(line: BatchLine): number {
  const explicit = parseFloat(line.amount);
  if (!Number.isNaN(explicit) && line.amount !== "") return explicit;

  const units = parseFloat(line.units);
  const rate = parseFloat(line.rate);
  if (!Number.isNaN(units) && !Number.isNaN(rate)) return units * rate;

  return Number.isNaN(explicit) ? 0 : explicit;
}
