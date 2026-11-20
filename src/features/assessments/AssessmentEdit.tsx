import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { ArrowLeft, Mail, Printer, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiError, apiUrl } from "../../api/client";
import {
  getAssessmentPrintSoaUrl,
  emailAssessmentSoa,
  getAssessment,
  updateAssessmentStatus,
  type AssessmentStatus,
} from "./api";
import { useLedgerBalance, useLedgerRoster } from "../ledger/queries";
import type { Ledger } from "../ledger/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

const statuses: { value: AssessmentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "mailed", label: "Mailed" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
];

const statusDotClass: Record<AssessmentStatus, string> = {
  pending: "bg-amber-500",
  mailed: "bg-blue-500",
  rejected: "bg-red-500",
  completed: "bg-emerald-500",
};
function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}
function SummaryCard({
  label,
  value,
  valueClassName = "text-foreground",
}: {
  label: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <Card className="border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-base font-bold ${valueClassName}`}>
        {value.toLocaleString("en-PH", { style: "currency", currency: "PHP" })}
      </p>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 border-b border-border/70 py-3 last:border-b-0">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <p className="text-right text-base font-medium text-slate-900">
        {value || "—"}
      </p>
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

export function AssessmentEdit() {
  const { id } = useParams();
  // const navigate = useNavigate();
  const client = useQueryClient();
  const [emailOpen, setEmailOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [note, setNote] = useState("");
  const [selectedLedgerStudentId, setSelectedLedgerStudentId] = useState<
    number | null
  >(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [isChangingStudent, setIsChangingStudent] = useState(false);
  const assessmentQuery = useQuery({
    queryKey: ["assessment", id],
    queryFn: ({ signal }) => getAssessment(id ?? "", signal),
    enabled: Boolean(id),
  });
  const ledger = (
    assessmentQuery.data?.data.enrolled_under === "Graduate"
      ? "graduate"
      : assessmentQuery.data?.data.enrolled_under === "School of Law"
        ? "law"
        : null
  ) as Ledger | null;
  const statusMutation = useMutation({
    mutationFn: (status: AssessmentStatus) =>
      updateAssessmentStatus(id ?? "", status),
    onSuccess: () => client.invalidateQueries({ queryKey: ["assessment", id] }),
  });
  const studentsQuery = useLedgerRoster(ledger ?? "graduate", Boolean(ledger));
  const balanceQuery = useLedgerBalance(
    ledger ?? "graduate",
    selectedLedgerStudentId ?? undefined,
  );
  const ledgerStudentKey =
    selectedLedgerStudentId && ledger
      ? `${ledger}:${selectedLedgerStudentId}`
      : "";
  const emailMutation = useMutation({
    mutationFn: () =>
      emailAssessmentSoa(id ?? "", {
        subject,
        recipient_name: recipientName,
        note,
        ledger_student: ledgerStudentKey,
      }),
    onSuccess: () => {
      setEmailOpen(false);
      void client.invalidateQueries({ queryKey: ["assessment", id] });
    },
  });
  useEffect(() => {
    const assessment = assessmentQuery.data?.data;
    const students = studentsQuery.data?.data ?? [];
    if (ledger && assessment?.student_id && selectedLedgerStudentId === null) {
      const matchingStudent = students.find(
        (student) => student.student_number === assessment.student_id,
      );
      if (matchingStudent) setSelectedLedgerStudentId(matchingStudent.id);
    }
  }, [
    assessmentQuery.data,
    ledger,
    selectedLedgerStudentId,
    studentsQuery.data,
  ]);
  if (assessmentQuery.isPending)
    return (
      <div className="p-6 text-muted-foreground">Loading assessment...</div>
    );
  if (assessmentQuery.isError)
    return (
      <Card className="border-destructive/30 bg-destructive/5 p-6">
        <h1 className="text-xl font-bold text-destructive">
          Unable to load assessment
        </h1>
        <p className="mt-2 text-sm">
          {assessmentQuery.error instanceof ApiError
            ? assessmentQuery.error.message
            : "Assessment loading failed."}
        </p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => void assessmentQuery.refetch()}
        >
          <RefreshCw /> Try again
        </Button>
      </Card>
    );
  const assessment = assessmentQuery.data.data;
  const selectedStatus =
    statuses.find(
      (status) => status.value === (assessment.status ?? "pending"),
    ) ?? statuses[0];
  const displayName = [
    assessment.first_name,
    assessment.middle_name,
    assessment.last_name,
  ]
    .filter(Boolean)
    .join(" ");
  const openEmail = () => {
    setSubject(`Statement of Account - ${assessment.reference_number}`);
    setRecipientName(`${assessment.first_name} ${assessment.last_name}`);
    setNote("");
    setEmailOpen(true);
  };
  const emailPreviewHtml = `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #1e293b; margin: 0; padding: 16px;">
    <p>Dear ${escapeHtml(recipientName.trim() || `${assessment.first_name} ${assessment.last_name}`)},</p>
    <p>
      Please find attached your Statement of Account
      (Reference No. <strong>${escapeHtml(assessment.reference_number)}</strong>)
      for ${escapeHtml(assessment.enrolled_under)} ${escapeHtml(assessment.semester)} ${escapeHtml(assessment.sy_last_attended)}.
    </p>
    ${note.trim() ? `<p>${escapeHtml(note).replace(/\n/g, "<br>")}</p>` : ""}
    <p>This statement includes your billed charges and payments for the requested term.</p>
    <p>Regards,<br>NORSU Accounting Office</p>
  </body>
</html>`;
  const records = (balanceQuery.data?.transactions ?? []).filter(
    (record) =>
      record.academic_term?.school_year === assessment.sy_last_attended &&
      record.academic_term?.semester === assessment.semester,
  );
  const summary = records.reduce(
    (totals, record) => {
      const amount = Number(record.amount ?? 0);
      if (record.entry_type === "ar") totals.total_charges += amount;
      if (
        record.entry_type === "payment" ||
        record.entry_type === "adjustment"
      ) {
        totals.total_payments += amount;
      }
      totals.outstanding_balance = totals.total_charges - totals.total_payments;
      return totals;
    },
    { total_charges: 0, total_payments: 0, outstanding_balance: 0 },
  );
  const studentCandidates = studentsQuery.data?.data ?? [];
  const filteredStudentCandidates = studentCandidates.filter((student) => {
    const term = studentSearch.trim().toLowerCase();
    return (
      !term ||
      `${student.name} ${student.student_number}`.toLowerCase().includes(term)
    );
  });
  const selectedStudent = balanceQuery.data?.student;
  const selectedStudentName = selectedStudent
    ? (selectedStudent.name ??
      `${selectedStudent.first_name ?? ""} ${selectedStudent.last_name ?? ""}`.trim())
    : "Student Record";
  const printStatement = () => {
    if (!id || !ledgerStudentKey) return;

    const printUrl = apiUrl(
      getAssessmentPrintSoaUrl(id, ledgerStudentKey),
    );
    const printWindow = window.open(printUrl, "_blank");

    if (!printWindow) {
      window.alert("Please allow pop-ups to print the statement.");
    }
  };
  return (
    <>
      <div className="min-h-screen w-full min-w-0 space-y-4 bg-page-background">
        <Card className="rounded-2xl border border-border/70 bg-card px-2! py-2! shadow-sm">
          <CardHeader className="flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="bg-[#3399FF] bg-clip-text font-['Poppins'] text-2xl! font-black tracking-tight text-transparent sm:text-4xl">
              Assessment: {assessment.reference_number}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={assessment.status ?? "pending"}
                onValueChange={(value) =>
                  statusMutation.mutate(value as AssessmentStatus)
                }
                disabled={statusMutation.isPending}
              >
                <SelectTrigger className="w-40">
                  <span className="inline-flex items-center gap-2 capitalize">
                    <span
                      aria-hidden="true"
                      className={`size-2 rounded-full ${statusDotClass[selectedStatus.value]}`}
                    />
                    {selectedStatus.label}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={`size-2 rounded-full ${statusDotClass[status.value]}`}
                        />
                        {status.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Link
                to="/staff/assessments"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
              >
                <ArrowLeft /> Back
              </Link>
            </div>
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
          <Card className="h-full rounded-2xl border border-border/70 bg-card shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <h2 className="mb-4 text-sm font-bold tracking-wider text-primary uppercase">
                Student Information
              </h2>
              <div className="rounded-xl border border-slate-100 px-4">
                <Detail label="Full Name" value={displayName} />
                <Detail label="Student ID" value={assessment.student_id} />
                <Detail label="Email" value={assessment.email} />
                <Detail label="Contact Number" value={assessment.contact_num} />
                <Detail label="Address" value={assessment.address} />
              </div>
            </CardContent>
          </Card>
          <Card className="h-full rounded-2xl border border-border/70 bg-card shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <h2 className="mb-4 text-sm font-bold tracking-wider text-primary uppercase">
                Course & Academic Information Requested
              </h2>
              <div className="rounded-xl border border-slate-100 px-4">
                <Detail
                  label="Course Code"
                  value={assessment.course?.course_code}
                />
                <Detail
                  label="Course Description"
                  value={assessment.course?.course_desc}
                />
                <Detail
                  label="Enrolled Under"
                  value={assessment.enrolled_under}
                />
                <Detail label="Semester" value={assessment.semester} />
                <Detail
                  label="SY Last Attended | SY Requested"
                  value={assessment.sy_last_attended}
                />
                <Detail
                  label="Submitted"
                  value={formatDate(assessment.created_at)}
                />
                <Detail
                  label="Status"
                  value={
                    assessment.status
                      ? statuses.find(
                          (item) => item.value === assessment.status,
                        )?.label
                      : "Pending"
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader className="gap-3 border-b border-border sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Student Statement Printer</CardTitle>
              <CardDescription>
                Review ledger transactions for the requested term and print a
                formal SOA PDF.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsChangingStudent((current) => !current)}
                disabled={studentCandidates.length === 0}
              >
                <Search /> Change Student
              </Button>
              <Button
                variant="outline"
                onClick={openEmail}
                disabled={!ledgerStudentKey || emailMutation.isPending}
              >
                <Mail /> Email Statement
              </Button>
              <Button
                onClick={printStatement}
                disabled={!ledgerStudentKey || balanceQuery.isPending}
              >
                <Printer /> Print Statement
              </Button>
            </div>
          </CardHeader>
          {isChangingStudent && ledger && (
            <div className="border-b border-border bg-blue-50/40 px-4 py-4 sm:px-6">
              <div className="max-w-xl space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Select student for statement
                </label>
                <div className="relative">
                  <Input
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Search by name or student ID..."
                  />
                </div>
                <div className="max-h-60 overflow-y-auto rounded-lg border border-border bg-card">
                  {studentsQuery.isPending ? (
                    <p className="p-3 text-sm text-muted-foreground">
                      Loading students...
                    </p>
                  ) : filteredStudentCandidates.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">
                      No matching students found.
                    </p>
                  ) : (
                    filteredStudentCandidates.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        className={`block w-full px-3 py-2 text-left text-sm hover:bg-muted ${student.id === selectedLedgerStudentId ? "bg-primary/10 font-medium text-primary" : ""}`}
                        onClick={() => {
                          setSelectedLedgerStudentId(student.id);
                          setStudentSearch("");
                          setIsChangingStudent(false);
                        }}
                      >
                        {student.name} · {student.student_number}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          <CardContent className="space-y-6 p-4 sm:p-6">
            {!ledger ? (
              <p className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Ledger statements are unavailable for this enrollment type.
              </p>
            ) : (
              <>
                {selectedLedgerStudentId && balanceQuery.isPending ? (
                  <p className="text-sm text-muted-foreground">
                    Loading ledger statement...
                  </p>
                ) : selectedLedgerStudentId && balanceQuery.data ? (
                  <>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                      <p className="font-semibold">{selectedStudentName}</p>
                      <p className="text-sm">
                        {records.length} transaction
                        {records.length === 1 ? "" : "s"} found for the
                        requested term.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <SummaryCard
                        label="Total Billed Charges (AR)"
                        value={summary.total_charges}
                      />
                      <SummaryCard
                        label="Total Payments Received"
                        value={summary.total_payments}
                        valueClassName="text-emerald-600"
                      />
                      <SummaryCard
                        label="Outstanding Balance"
                        value={summary.outstanding_balance}
                      />
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full min-w-180 text-left text-sm">
                        <thead className="border-b bg-muted/40">
                          <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Course</th>
                            <th className="px-4 py-3">Ref / OR #</th>
                            <th className="px-4 py-3">Particulars</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-4 py-8 text-center text-muted-foreground"
                              >
                                No ledger transactions were found for this term.
                              </td>
                            </tr>
                          ) : (
                            records.map((record) => (
                              <tr
                                key={record.id}
                                className="border-b last:border-0"
                              >
                                <td className="px-4 py-3">
                                  {formatDate(record.transaction_date)}
                                </td>
                                <td className="px-4 py-3">
                                  {record.course?.course_code ?? "—"}
                                </td>
                                <td className="px-4 py-3">
                                  {record.reference_number ?? "—"}
                                </td>
                                <td className="px-4 py-3">
                                  {record.particulars || "—"}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge
                                    variant={
                                      record.entry_type === "ar"
                                        ? "outline"
                                        : "secondary"
                                    }
                                  >
                                    {record.entry_type.toUpperCase()}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-right font-mono">
                                  {Number(record.amount ?? 0).toLocaleString(
                                    "en-PH",
                                    { style: "currency", currency: "PHP" },
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a student to preview ledger records.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Email Statement of Account</DialogTitle>
            <DialogDescription>
              Review and customize the email before sending the Statement of
              Account PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            <div className="space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  To
                </label>
                <Input
                  value={assessment.email}
                  disabled
                  className="bg-slate-50 text-slate-600"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Recipient Name
                </label>
                <Input
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                  placeholder="Recipient name"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Subject
                </label>
                <Input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Email subject"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Additional Note (optional)
                </label>
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add a personal note..."
                  rows={4}
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Live Preview
              </label>
              <div className="overflow-hidden rounded-xl border border-border">
                <iframe
                  title="Email preview"
                  srcDoc={emailPreviewHtml}
                  className="h-112 w-100 bg-card"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="lg"
              className="min-h-11"
              onClick={() => setEmailOpen(false)}
              disabled={emailMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={() => emailMutation.mutate()}
              disabled={emailMutation.isPending}
              className="min-w-32 bg-primary hover:bg-primary/90"
            >
              {emailMutation.isPending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
