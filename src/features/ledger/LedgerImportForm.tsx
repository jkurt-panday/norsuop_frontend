import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  FileUp,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { ApiError } from "../../api/client";
import type { Ledger } from "./api";
import { useImportLedger } from "./mutations";
import { useLedgerMasterData } from "./queries";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LedgerImportFormProps {
  ledger: Ledger;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LedgerImportForm({
  ledger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: LedgerImportFormProps) {
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

  const [file, setFile] = useState<File | undefined>();
  const [isDragging, setIsDragging] = useState(false);
  const [presetCourseId, setPresetCourseId] = useState<number | "">("");
  const [presetTermId, setPresetTermId] = useState<number | "">("");

  const masterQuery = useLedgerMasterData(ledger);
  const mutation = useImportLedger();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleReset = () => {
    setFile(undefined);
    setPresetCourseId("");
    setPresetTermId("");
    mutation.reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    mutation.mutate({
      ledger,
      file,
      presetCourseId: presetCourseId !== "" ? Number(presetCourseId) : undefined,
      presetAcademicTermId: presetTermId !== "" ? Number(presetTermId) : undefined,
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) handleReset();
      }}
    >
      {!isControlled && (
        <DialogTrigger
          render={
            <Button variant="outline" className="gap-2 shadow-xs">
              <FileUp className="h-4 w-4 text-emerald-600" />
              Import Excel/CSV
            </Button>
          }
        />
      )}

      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            Import {ledger === "graduate" ? "Graduate" : "Law"} Ledger
          </DialogTitle>
          <DialogDescription className="text-xs">
            Upload an Excel (.xlsx, .xls) or CSV file with student ledgers. You can
            optionally set a fallback course and academic term for unassigned rows.
          </DialogDescription>
        </DialogHeader>

        {mutation.isSuccess ? (
          <div className="space-y-4 py-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Import Complete
              </div>
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                {mutation.data.message || "Ledger records processed successfully."}
              </p>
            </div>

            {/* Granular Report */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border bg-card p-3 text-center">
                <div className="text-xl font-bold text-emerald-600 font-mono">
                  {mutation.data.imported}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Imported
                </div>
              </div>

              <div className="rounded-xl border bg-card p-3 text-center">
                <div className="text-xl font-bold text-amber-600 font-mono">
                  {mutation.data.skipped}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Skipped
                </div>
              </div>

              <div className="rounded-xl border bg-card p-3 text-center">
                <div className="text-xl font-bold text-sky-600 font-mono">
                  {mutation.data.duplicates}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Duplicates
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                onClick={handleReset}
                className="text-xs"
              >
                Import Another File
              </Button>
              <Button
                onClick={() => setOpen(false)}
                className="bg-blue-600 text-white hover:bg-blue-700 text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
                isDragging
                  ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                  : file
                  ? "border-emerald-400 bg-muted/20"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/10"
              }`}
            >
              {file ? (
                <div className="flex items-center gap-3 w-full justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-foreground truncate max-w-xs">
                        {file.name}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(undefined)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    Click to browse or drag file here
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Accepts CSV, XLSX, or XLS files (up to 50MB)
                  </p>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setFile(e.target.files?.[0])}
                    required
                  />
                </>
              )}
            </div>

            {/* Presets Row */}
            <div className="rounded-xl border bg-muted/20 p-3.5 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground">
                Optional Presets (Applied when file columns are empty)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Preset Course</Label>
                  <select
                    className="w-full h-9 rounded-lg border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={presetCourseId}
                    onChange={(e) =>
                      setPresetCourseId(e.target.value === "" ? "" : Number(e.target.value))
                    }
                  >
                    <option value="">None (detect from file)</option>
                    {masterQuery.data?.courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.course_code} - {c.course_desc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">Preset Academic Term</Label>
                  <select
                    className="w-full h-9 rounded-lg border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={presetTermId}
                    onChange={(e) =>
                      setPresetTermId(e.target.value === "" ? "" : Number(e.target.value))
                    }
                  >
                    <option value="">None (detect from file)</option>
                    {masterQuery.data?.academicTerms.map((t) => (
                      <option key={t.id} value={t.id}>
                        SY {t.school_year} — {t.semester}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {mutation.isError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Import Failed</div>
                  <div>
                    {mutation.error instanceof ApiError
                      ? mutation.error.message
                      : "File parsing error. Please check formatting."}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!file || mutation.isPending}
                className="bg-emerald-600 text-white hover:bg-emerald-700 min-w-28"
              >
                {mutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing…
                  </div>
                ) : (
                  "Start Import"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
