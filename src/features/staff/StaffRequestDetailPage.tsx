import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  FileText,
  User,
  Building,
  GraduationCap,
  Calendar,
  CreditCard,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";
import { ApiError } from "../../api/client";
import { useStaffRequest } from "./detailQueries";
import { ProcessingForm } from "./ProcessingForm";
import { StudentMatcher } from "./StudentMatcher";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

function formatPayorFullName(req: {
  firstname_or_office: string;
  middlename_or_project?: string | null;
  lastname_or_agency: string;
}) {
  return [
    req.firstname_or_office,
    req.middlename_or_project,
    req.lastname_or_agency,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function StaffRequestDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const query = useStaffRequest(Number.isFinite(id) ? id : undefined);

  if (query.isPending) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 my-8">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Unable to load order of payment
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {query.error instanceof ApiError
                ? query.error.message
                : "The requested order of payment record could not be loaded."}
            </p>
          </div>
          <div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/staff/requests">Back to requests</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { data: request, bankAccounts, uacsList } = query.data;
  const rawStatus = request.staff_input?.status ?? request.staffInput?.status ?? "unprocessed";
  const fullName = formatPayorFullName(request);
  const supportingDocs = request.supporting_documents ?? request.supportingDocuments ?? [];
  const staffInput = request.staff_input ?? request.staffInput;
  const isProcessedOrPaid = rawStatus === "processed" || rawStatus === "paid";

  return (
    <div className="space-y-6">
      {/* Back button and page title banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-xs" asChild>
            <Link to="/staff/requests" aria-label="Back to requests">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {request.reference_number}
              </h1>
              <StatusBadge status={rawStatus} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submitted on {formatDate(request.created_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Request Details & Supporting Documents */}
        <div className="space-y-6 lg:col-span-2">
          {/* Main Information Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Payor Details</CardTitle>
                  <CardDescription className="text-xs">
                    Client contact and billing classification
                  </CardDescription>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">Amount Due</span>
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    {currencyFormatter.format(Number(request.amount || 0))}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="size-3" /> Payor Name / Office
                  </span>
                  <p className="font-medium text-foreground mt-0.5">{fullName || "—"}</p>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building className="size-3" /> Office / College
                  </span>
                  <p className="font-medium text-foreground mt-0.5">
                    {request.office_or_college || "—"}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground">Email Address</span>
                  <p className="font-medium text-foreground mt-0.5">{request.email || "—"}</p>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground">Contact Number</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {request.contact_num || "—"}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground">Membership</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {request.membership?.member_desc ?? "—"}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground">Payment Nature / Detail</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {request.payment_detail_option?.payment_desc ?? "—"}
                  </p>
                </div>

                {request.course && (
                  <div className="sm:col-span-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <GraduationCap className="size-3" /> Course Program
                    </span>
                    <p className="font-medium text-foreground mt-0.5">
                      {request.course.course_code} — {request.course.course_desc}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Student Matching Section */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">Student Verification</CardTitle>
              <CardDescription className="text-xs">
                Link to university student master ledger
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {request.student ? (
                <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-200">
                        {request.student.full_name}
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono">
                        Student ID: {request.student.student_number}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-1 rounded-full">
                    Linked
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 dark:text-amber-300">
                      <p className="font-medium">No student linked to this request</p>
                      {request.submitted_student_number && (
                        <p className="mt-0.5">
                          Submitted student ID:{" "}
                          <span className="font-mono font-semibold">
                            {request.submitted_student_number}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <StudentMatcher
                    id={request.id}
                    initialQuery={request.submitted_student_number ?? request.lastname_or_agency}
                    onSuccess={() => void query.refetch()}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supporting Documents Section */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Supporting Documents</CardTitle>
                  <CardDescription className="text-xs">
                    Uploaded verification requirements and attachments
                  </CardDescription>
                </div>
                <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full">
                  {supportingDocs.length} file{supportingDocs.length === 1 ? "" : "s"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {supportingDocs.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  <FolderOpen className="mx-auto size-8 text-muted-foreground/60 mb-1" />
                  No supporting documents attached to this order of payment.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {supportingDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground truncate max-w-sm">
                          {doc.original_filename}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="xs"
                          asChild
                          className="gap-1 text-xs"
                        >
                          <a
                            href={`/api/v1/supporting-documents/${doc.id}/view`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="size-3" />
                            <span>View</span>
                          </a>
                        </Button>
                        <Button
                          variant="secondary"
                          size="xs"
                          asChild
                          className="gap-1 text-xs"
                        >
                          <a
                            href={`/api/v1/supporting-documents/${doc.id}/download`}
                            download
                          >
                            <Download className="size-3" />
                            <span>Download</span>
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Processing & Accounting Assignment */}
        <div className="space-y-6">
          {isProcessedOrPaid && staffInput ? (
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-semibold">Processing Record</CardTitle>
                <CardDescription className="text-xs">
                  Assigned accounting classification and date
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Status</span>
                  <div className="mt-1">
                    <StatusBadge status={rawStatus} />
                  </div>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground">Reference Date</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {formatDate(staffInput.ref_date)}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground">Bank Account / Fund Cluster</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {staffInput.bank_account
                      ? `${staffInput.bank_account.bank_name} — ${staffInput.bank_account.account_name} (${staffInput.bank_account.account_num})`
                      : "—"}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground">UACS Object Code</span>
                  <p className="font-medium text-foreground mt-0.5 font-mono text-xs">
                    {staffInput.uacs
                      ? `${staffInput.uacs.uacs_object_code} — ${staffInput.uacs.account_title}`
                      : "—"}
                  </p>
                </div>

                {staffInput.purpose && (
                  <div>
                    <span className="text-xs text-muted-foreground">Purpose / Remarks</span>
                    <p className="text-xs text-foreground mt-0.5 bg-muted/40 p-2.5 rounded-lg border">
                      {staffInput.purpose}
                    </p>
                  </div>
                )}

                {staffInput.or_no && (
                  <div className="border-t pt-3">
                    <span className="text-xs text-muted-foreground">Official Receipt #</span>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                      {staffInput.or_no}
                    </p>
                    {staffInput.or_date && (
                      <span className="text-xs text-muted-foreground">
                        Date: {formatDate(staffInput.or_date)}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <ProcessingForm
              id={request.id}
              bankAccounts={bankAccounts}
              uacsList={uacsList}
              initialValues={{
                status: "processed",
                ref_date: staffInput?.ref_date,
                purpose: staffInput?.purpose,
              }}
              onComplete={() => void query.refetch()}
            />
          )}
        </div>
      </div>
    </div>
  );
}
