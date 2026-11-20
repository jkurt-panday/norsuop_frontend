import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileDown,
  Loader2,
  Mail,
  Search,
  Send,
  Users,
} from "lucide-react";
import { ApiError } from "../../api/client";
import type { Ledger, LedgerFilterParams } from "./api";
import { useLedgerPdf, useSendLedgerEmails } from "./mutations";
import { useLedgerEmailRecipients } from "./queries";
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

interface LedgerActionsProps {
  ledger: Ledger;
  studentId?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  filters?: LedgerFilterParams;
}

export function LedgerActions({
  ledger,
  studentId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  filters = {},
}: LedgerActionsProps) {
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

  const pdfMutation = useLedgerPdf();
  const emailMutation = useSendLedgerEmails();
  const recipientsQuery = useLedgerEmailRecipients(ledger, filters, isOpen);

  const [selectedIds, setSelectedIds] = useState<number[]>(
    studentId ? [studentId] : [],
  );
  const [recipientSearch, setRecipientSearch] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState(
    `${ledger === "graduate" ? "Graduate" : "Law"} School Statement of Account`,
  );
  const [note, setNote] = useState("");
  const [examPeriod, setExamPeriod] = useState<"Midterm" | "Final" | "">("");
  const [examDeadline, setExamDeadline] = useState("");
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const allRecipients = recipientsQuery.data?.data ?? [];
  const filteredRecipients = allRecipients.filter((r) => {
    const q = recipientSearch.toLowerCase();
    const displayName = (r.full_name || r.name || "").toLowerCase();
    return (
      displayName.includes(q) ||
      (r.student_number || "").toLowerCase().includes(q) ||
      (r.email || "").toLowerCase().includes(q)
    );
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecipients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecipients.map((r) => r.id));
    }
  };

  const toggleStudent = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSendEmails = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    setSuccessInfo(null);

    emailMutation.mutate(
      {
        ledger,
        payload: {
          ...filters,
          student_ids: selectedIds,
          school_year: schoolYear || undefined,
          semester: semester || undefined,
          subject: subject || undefined,
          note: note || undefined,
          exam_period: examPeriod || undefined,
          exam_deadline: examDeadline || undefined,
        },
      },
      {
        onSuccess: (data) => {
          setSuccessInfo(
            data.message ||
              `Emailed statements to ${data.queued_count} student(s).`,
          );
        },
      },
    );
  };

  function handleSinglePdf(id: number) {
    pdfMutation.mutate(
      { ledger, studentId: id },
      {
        onSuccess: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${ledger}-statement-${id}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        },
      },
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger
          render={
            <Button variant="outline" className="gap-2 shadow-xs">
              <Mail className="h-4 w-4 text-blue-600" />
              Send Statements
            </Button>
          }
        />
      )}

      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Send Statement Emails
          </DialogTitle>
          <DialogDescription className="text-xs">
            Email official ledger statements of account to students in the{" "}
            {ledger === "graduate" ? "Graduate School" : "School of Law"}, based on the
            current ledger filters.
          </DialogDescription>
        </DialogHeader>

        {successInfo ? (
          <div className="space-y-4 py-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Email Results
              </div>
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                {successInfo}
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => {
                  setSuccessInfo(null);
                  setSelectedIds([]);
                  setOpen(false);
                }}
                className="bg-blue-600 text-white hover:bg-blue-700 text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendEmails} className="space-y-4 pt-2">
            {/* Recipient Selection Card */}
            <div className="space-y-2 rounded-xl border bg-muted/20 p-3.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Select Recipients ({selectedIds.length} of {allRecipients.length})
                </Label>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  {selectedIds.length === filteredRecipients.length &&
                  filteredRecipients.length > 0
                    ? "Deselect All"
                    : "Select All Filtered"}
                </button>
              </div>

              {/* Recipient search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter eligible recipients by name, ID, or email…"
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  className="pl-8 h-8 rounded-lg text-xs"
                />
              </div>

              {/* Scrollable Recipient list */}
              <div className="max-h-48 overflow-y-auto divide-y rounded-lg border bg-card">
                {recipientsQuery.isPending ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Loading eligible recipients…
                  </div>
                ) : filteredRecipients.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No eligible students with registered emails found for the current filters.
                  </div>
                ) : (
                  filteredRecipients.map((rec) => {
                    const isSelected = selectedIds.includes(rec.id);
                    const displayName = rec.full_name || rec.name || "Unnamed student";
                    return (
                      <div
                        key={rec.id}
                        className={`flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer hover:bg-muted/70 ${
                          isSelected ? "bg-blue-50/60 dark:bg-blue-950/20" : ""
                        }`}
                        onClick={() => toggleStudent(rec.id)}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-input text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-semibold text-foreground">
                              {displayName}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {rec.student_number} · {rec.email}
                              {typeof rec.balance === "number"
                                ? ` · ₱${rec.balance.toLocaleString("en-PH", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })} (${rec.balance_status ?? (rec.balance > 0 ? "outstanding" : "settled")})`
                                : ""}
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
                          title="Download individual PDF statement"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSinglePdf(rec.id);
                          }}
                        >
                          <FileDown className="h-3.5 w-3.5 mr-1" />
                          PDF
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Email Header Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">School Year (Optional)</Label>
                <Input
                  placeholder="e.g. 2025-2026"
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  className="h-9 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Semester (Optional)</Label>
                <Input
                  placeholder="e.g. 1st Semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Exam Period (Optional)</Label>
                <select
                  value={examPeriod}
                  onChange={(e) => setExamPeriod(e.target.value as "Midterm" | "Final" | "")}
                  className="h-9 w-full rounded-xl border border-input bg-card px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">None</option>
                  <option value="Midterm">Midterm</option>
                  <option value="Final">Final</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Exam Deadline (Optional)</Label>
                <Input
                  type="date"
                  value={examDeadline}
                  onChange={(e) => setExamDeadline(e.target.value)}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Email Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-9 rounded-xl text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                Custom Message / Instructions (Optional)
              </Label>
              <textarea
                rows={3}
                placeholder="Include payment deadlines, cashier hours, or university guidelines…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-xl border border-input bg-card p-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {emailMutation.isError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  {emailMutation.error instanceof ApiError
                    ? emailMutation.error.message
                    : "Failed to queue statement emails."}
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={emailMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={selectedIds.length === 0 || emailMutation.isPending}
                className="bg-blue-600 text-white hover:bg-blue-700 min-w-36 gap-2"
              >
                {emailMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Queueing…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Queue {selectedIds.length} Email{selectedIds.length === 1 ? "" : "s"}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
