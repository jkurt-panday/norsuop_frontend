import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { ArrowLeft, Mail, Printer, RefreshCw } from "lucide-react";
import { useState } from "react";
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
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
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
function SummaryCard({ label, value, valueClassName = "text-foreground" }: { label: string; value: number; valueClassName?: string }) {
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

export function AssessmentEdit() {
  const { id } = useParams();
  // const navigate = useNavigate();
  const client = useQueryClient();
  const [emailOpen, setEmailOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [note, setNote] = useState("");
  const [selectedLedgerStudentId, setSelectedLedgerStudentId] = useState<number | null>(null);
  const assessmentQuery = useQuery({
    queryKey: ["assessment", id],
    queryFn: ({ signal }) => getAssessment(id ?? "", signal),
    enabled: Boolean(id),
  });
  const ledger = (assessmentQuery.data?.data.enrolled_under === "Graduate"
    ? "graduate"
    : assessmentQuery.data?.data.enrolled_under === "School of Law"
      ? "law"
      : null) as Ledger | null;
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
  const emailMutation = useMutation({
    mutationFn: () =>
      emailAssessmentSoa(id ?? "", {
        subject,
        recipient_name: recipientName,
        note,
      }),
    onSuccess: () => {
      setEmailOpen(false);
      void client.invalidateQueries({ queryKey: ["assessment", id] });
    },
  });
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
  const selectedStatus = statuses.find(
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
  const records = (balanceQuery.data?.transactions ?? []).filter(
    (record) =>
      record.academic_term?.school_year === assessment.sy_last_attended &&
      record.academic_term?.semester === assessment.semester,
  );
  const summary = records.reduce(
    (totals, record) => {
      const amount = Number(record.amount ?? 0);
      if (record.entry_type === "ar") totals.total_charges += amount;
      if (record.entry_type === "payment" || record.entry_type === "adjustment") {
        totals.total_payments += amount;
      }
      totals.outstanding_balance =
        totals.total_charges - totals.total_payments;
      return totals;
    },
    { total_charges: 0, total_payments: 0, outstanding_balance: 0 },
  );
  const studentCandidates = studentsQuery.data?.data ?? [];
  const selectedStudent = balanceQuery.data?.student;
  const selectedStudentName = selectedStudent
    ? selectedStudent.name ?? `${selectedStudent.first_name ?? ""} ${selectedStudent.last_name ?? ""}`.trim()
    : "Student Record";
  const printStatement = () => {
    if (!selectedLedgerStudentId || !id) return;
    window.open(
      apiUrl(getAssessmentPrintSoaUrl(id, String(selectedLedgerStudentId))),
      "_blank",
      "noopener,noreferrer",
    );
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
                Review ledger transactions for the requested term and print a formal SOA PDF.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={openEmail} disabled={!selectedLedgerStudentId || emailMutation.isPending}>
                <Mail /> Email Statement
              </Button>
              <Button onClick={printStatement} disabled={!selectedLedgerStudentId || balanceQuery.isPending}>
                <Printer /> Print Statement
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-4 sm:p-6">
            {!ledger ? (
              <p className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Ledger statements are unavailable for this enrollment type.
              </p>
            ) : (
              <>
                <Combobox
                  items={studentCandidates}
                  value={
                    studentCandidates.find((student) => student.id === selectedLedgerStudentId)
                      ? `${studentCandidates.find((student) => student.id === selectedLedgerStudentId)?.student_number} - ${studentCandidates.find((student) => student.id === selectedLedgerStudentId)?.name}`
                      : ""
                  }
                  onValueChange={(value) => {
                    const student = studentCandidates.find(
                      (candidate) => `${candidate.student_number} - ${candidate.name}` === value,
                    );
                    setSelectedLedgerStudentId(student?.id ?? null);
                  }}
                >
                  <ComboboxInput
                    placeholder="Search by name or student ID..."
                     showClear={Boolean(selectedLedgerStudentId)}
                    className="w-full"
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No matching students found.</ComboboxEmpty>
                    <ComboboxList>
                      {(student) => (
                        <ComboboxItem
                          key={student.id}
                           value={`${student.student_number} - ${student.name}`}
                         >
                           <span className="font-medium">
                             {student.student_number} - {student.name}
                           </span>
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {selectedLedgerStudentId && balanceQuery.isPending ? (
                  <p className="text-sm text-muted-foreground">Loading ledger statement...</p>
                ) : selectedLedgerStudentId && balanceQuery.data ? (
                  <>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                      <p className="font-semibold">{selectedStudentName}</p>
                      <p className="text-sm">{records.length} transaction{records.length === 1 ? "" : "s"} found for the requested term.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <SummaryCard label="Total Billed Charges (AR)" value={summary.total_charges} />
                      <SummaryCard label="Total Payments Received" value={summary.total_payments} valueClassName="text-emerald-600" />
                      <SummaryCard label="Outstanding Balance" value={summary.outstanding_balance} />
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full min-w-180 text-left text-sm">
                        <thead className="border-b bg-muted/40"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Ref / OR #</th><th className="px-4 py-3">Particulars</th><th className="px-4 py-3">Type</th><th className="px-4 py-3 text-right">Amount</th></tr></thead>
                        <tbody>{records.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No ledger transactions were found for this term.</td></tr> : records.map((record) => <tr key={record.id} className="border-b last:border-0"><td className="px-4 py-3">{formatDate(record.transaction_date)}</td><td className="px-4 py-3">{record.course?.course_code ?? "—"}</td><td className="px-4 py-3">{record.reference_number ?? "—"}</td><td className="px-4 py-3">{record.particulars || "—"}</td><td className="px-4 py-3"><Badge variant={record.entry_type === "ar" ? "outline" : "secondary"}>{record.entry_type}</Badge></td><td className="px-4 py-3 text-right font-mono">{Number(record.amount ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</td></tr>)}</tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Select a student to preview ledger records.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Statement of Account</DialogTitle>
            <DialogDescription>
              Review the email details before sending the statement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={assessment.email} disabled />
            <Input
              placeholder="Recipient name"
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
            />
            <Input
              placeholder="Subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
            <Textarea
              placeholder="Additional note (optional)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => emailMutation.mutate()}
              disabled={emailMutation.isPending}
            >
              {emailMutation.isPending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
