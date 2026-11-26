import { LightModeWrapper } from "@/components/ui/LightModeWrapper";
import { Link, useParams, useSearchParams } from "react-router";
import { useEffect } from "react";
import {
  CheckCircle,
  Download,
  FileText,
  GraduationCap,
  Home,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Printer,
  Receipt,
  User,
} from "lucide-react";
import { ApiError } from "../../../api/client";
import { setExpiringLocalStorage } from "../../../lib/expiring-local-storage";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { opReceiptUrl } from "./resultApi";
import { useOpResult } from "./resultQueries";

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value?: string | number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  })
    .format(amount)
    .replace("₱", "₱  ");
}

function formatContactNumber(value?: string) {
  if (!value) return "—";
  return value.replace(/^(\d{4})(\d{3})(\d{4})$/, "$1 $2 $3");
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${Number((bytes / 1024 ** index).toFixed(2))} ${units[index]}`;
}

function Detail({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | null;
  icon?: typeof Mail;
}) {
  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />}
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-medium tracking-wide text-slate-500 uppercase sm:text-sm">
          {label}
        </p>
        <p className="text-base font-semibold wrap-break-word text-slate-900 sm:text-xl">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export function OpFormSuccessPage() {
  const [params] = useSearchParams();
  const { reference: routeReference } = useParams();
  const reference = params.get("reference") ?? routeReference ?? undefined;
  const token = params.get("token") ?? undefined;
  const result = useOpResult(reference, token);
  useEffect(() => {
    const submission = result.data?.data;
    if (!submission) return;
    setExpiringLocalStorage("submit-form-prefill", {
      email: submission.email ?? "",
      contact_num: submission.contact_num ?? "",
      firstname_or_office: submission.firstname_or_office ?? "",
      middlename_or_project: submission.middlename_or_project ?? "",
      lastname_or_agency: submission.lastname_or_agency ?? "",
      office_or_college: submission.office_or_college ?? "",
      position_or_designation: submission.position_or_designation ?? "",
      address: submission.address ?? "",
      student_num: submission.submitted_student_number ?? "",
      course_id: submission.course?.id ? String(submission.course.id) : "",
      school_year: submission.academic_term?.school_year ?? "",
      semester: submission.academic_term?.semester ?? "",
    });
  }, [result.data]);

  if (!reference || !token) {
    return (
      <ResultMessage
        title="Receipt link incomplete"
        message="Try to submit another request."
      />
    );
  }
  if (result.isPending)
    return <ResultMessage title="Loading your submission…" />;
  if (result.isError) {
    return (
      <ResultMessage
        title="Submission unavailable"
        message={
          result.error instanceof ApiError && result.error.status === 404
            ? "This receipt link is invalid or expired."
            : "We could not load this submission."
        }
      />
    );
  }

  const submission = result.data.data;

  const fullName = [
    submission.lastname_or_agency ? `${submission.lastname_or_agency},` : "",
    submission.firstname_or_office,
    submission.middlename_or_project,
  ]
    .filter(Boolean)
    .join(" ");
  const printUrl = opReceiptUrl(reference, token);
  const downloadUrl = opReceiptUrl(reference, token, true);

  return (
    <LightModeWrapper>
      <main className="min-h-screen bg-linear-to-b from-blue-500 via-slate-100 to-white px-3 py-6 sm:px-6 sm:py-12">
        <title>Order of Payment Submission Successful</title>
        <div className="mx-auto max-w-5xl">
        <Card className="pt-0! overflow-hidden rounded-2xl shadow-xl sm:rounded-3xl">
          <CardHeader className="rounded-2xl bg-linear-to-b from-blue-600 to-blue-400 px-4 text-center text-white sm:rounded-t-3xl sm:py-10">
            <img
              src="/finance_logo1.png"
              alt="NORSU Logo"
              width={600}
              height={114}
              className="mx-auto h-auto max-w-70 pb-4 sm:max-w-md sm:pb-6"
            />
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 sm:h-24 sm:w-24">
              <CheckCircle className="h-10 w-10 sm:h-14 sm:w-14" />
            </div>
            <CardTitle className="mt-2 text-2xl text-green-300 sm:text-3xl">
              Submission Successful!
            </CardTitle>
            <CardDescription className="text-blue-100">
              Your request has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-4 pt-6 sm:space-y-10 sm:px-6 sm:pt-8">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-center sm:p-8">
              <p className="text-sm text-muted-foreground">Reference Number</p>
              <p className="my-2 font-mono text-2xl font-bold tracking-wider break-all text-blue-700 sm:text-4xl">
                {submission.reference_number}
              </p>
              <p className="text-sm text-slate-500">
                Please keep this reference number for tracking your request.
              </p>
            </div>
            <Separator />
            <section>
              <SectionTitle icon={<User className="h-5 w-5 text-blue-700" />}>
                Contact Information
              </SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Email" value={submission.email} icon={Mail} />
                <Detail
                  label="Contact Number"
                  value={formatContactNumber(submission.contact_num)}
                  icon={Phone}
                />
              </div>
            </section>
            <Separator />
            <section>
              <SectionTitle icon={<IdCard className="h-5 w-5 text-blue-700" />}>
                Identity Details
              </SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail
                  label="Full Name / Agency / Office / Project"
                  value={fullName}
                />
                <Detail
                  label="Office / College"
                  value={submission.office_or_college}
                />
                <Detail
                  label="Position / Designation"
                  value={submission.position_or_designation}
                />
                <Detail
                  label="Address"
                  value={submission.address}
                  icon={MapPin}
                />
              </div>
            </section>
            <Separator />
            <section>
              <SectionTitle
                icon={<GraduationCap className="h-5 w-5 text-blue-600" />}
              >
                Academic Details
              </SectionTitle>
              <div className="grid gap-5 sm:grid-cols-2">
                <Detail label="Course" value={submission.course ? `${submission.course.course_code ?? ""} — ${submission.course.course_desc ?? ""}` : undefined} />
                <Detail label="Student Number" value={submission.submitted_student_number} />
                <Detail label="School Year" value={submission.academic_term?.school_year} />
                <Detail label="Semester" value={submission.academic_term?.semester} />
              </div>
            </section>
            <Separator />
            <section>
              <SectionTitle
                icon={<Receipt className="h-5 w-5 text-blue-700" />}
              >
                Request Details
              </SectionTitle>
              <div className="grid gap-5 sm:grid-cols-2">
                <Detail label="Request Type" value={submission.request_type} />
                <Detail
                  label="Amount"
                  value={formatCurrency(submission.amount)}
                />
                <Detail
                  label="Membership Type"
                  value={
                    submission.membership?.member_code ??
                    submission.membership?.member_desc
                  }
                />
                <Detail
                  label="Payment Details"
                  value={
                    submission.payment_detail_option?.payment_desc ?? "N/A"
                  }
                />

              </div>
            </section>
            {submission.supporting_documents?.length ? (
              <>
                <Separator />
                <section>
                  <SectionTitle
                    icon={<FileText className="h-5 w-5 text-blue-700" />}
                  >
                    Supporting Documents
                  </SectionTitle>
                  <div className="space-y-2">
                    {submission.supporting_documents.map((document) => (
                      <div
                        key={`${document.id ?? document.original_filename}-${document.file_size ?? 0}`}
                        className="flex flex-col justify-between gap-2 rounded-lg bg-blue-400/25 p-3 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 items-start gap-3 sm:items-center">
                          <FileText className="mt-1 h-5 w-5 shrink-0 text-muted-foreground sm:mt-0" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium sm:text-lg">
                              {document.original_filename}
                            </p>
                            <p className="flex flex-wrap gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                              <span>{formatFileSize(document.file_size)}</span>
                              <span>•</span>
                              <span>{document.mime_type}</span>
                              {document.uploaded_at && (
                                <>
                                  <span>•</span>
                                  <span>
                                    Uploaded: {formatDate(document.uploaded_at)}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : null}
            <Separator />
            <p className="text-center text-sm text-slate-500">
              Submitted on: {formatDate(submission.created_at)}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 border-t px-4 py-6 sm:px-6">
            <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
              <Link
                to="/opform"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700"
              >
                Submit Another Request
              </Link>
              <Link
                to="/assessmentform"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700"
              >
                Submit Assessment Request
              </Link>
              <a
                href={downloadUrl}
                download={`OP-Transaction-${submission.reference_number}.pdf`}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-blue-200 px-6 font-semibold text-blue-700 hover:bg-blue-50"
              >
                <Download className="mr-2 h-5 w-5" />
                Download Transaction
              </a>
              <a
                href={printUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-blue-200 px-6 font-semibold text-blue-700 hover:bg-blue-50"
              >
                <Printer className="mr-2 h-5 w-5" />
                Print Transaction
              </a>
              <Link
                to="/"
                className="inline-flex h-11 items-center justify-center rounded-xl border px-6 font-semibold text-slate-700 hover:bg-slate-50 sm:col-span-2"
              >
                <Home className="mr-2 h-5 w-5" />
                Go back to Home
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  </LightModeWrapper>
  );
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h2 className="mb-4 flex items-center gap-3 text-xl font-semibold text-blue-900 sm:text-2xl">
      {icon}
      {children}
    </h2>
  );
}

function ResultMessage({
  title,
  message,
}: {
  title: string;
  message?: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-blue-500 p-4">
      <Dialog open>
        <DialogContent
          showCloseButton={false}
          className="max-w-md border-0 bg-[#F8F9FA] text-slate-900 shadow-2xl"
        >
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-2xl font-bold text-blue-950">
              {title}
            </DialogTitle>
            {message && (
              <DialogDescription className="text-base text-slate-700">
                {message}
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter className="justify-center sm:justify-center">
            <Button
              nativeButton={false}
              render={<Link to="/opform" />}
              className="bg-blue-700 text-white hover:bg-blue-800"
            >
              Submit another request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
