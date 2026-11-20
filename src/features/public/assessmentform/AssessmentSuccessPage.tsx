import { Link, useSearchParams } from "react-router";
import {
  CheckCircle,
  Download,
  Hash,
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
import { assessmentReceiptUrl } from "./resultApi";
import { useAssessmentResult } from "./resultQueries";

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

function formatContactNumber(value?: string) {
  if (!value) return "—";
  return value.replace(/^(\d{4})(\d{3})(\d{4})$/, "$1 $2 $3");
}

function badgeClass(value: string | undefined) {
  switch (value) {
    case "Undergraduate":
    case "First Semester":
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
    case "Graduate":
    case "Second Semester":
      return "border-blue-200 bg-blue-100 text-blue-700";
    case "School of Law":
    case "Summer":
      return "border-amber-200 bg-amber-100 text-amber-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
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

export function AssessmentSuccessPage() {
  const [params] = useSearchParams();
  const reference = params.get("reference") ?? undefined;
  const token = params.get("token") ?? undefined;
  const result = useAssessmentResult(reference, token);

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
        title="Assessment unavailable"
        message={
          result.error instanceof ApiError && result.error.status === 404
            ? "This receipt link is invalid or expired."
            : "We could not load this assessment."
        }
      />
    );
  }

  const assessment = result.data.data;
  setExpiringLocalStorage("assessment-form-prefill", {
    email: assessment.email ?? "",
    contact_num: assessment.contact_num ?? "",
    first_name: assessment.first_name ?? "",
    middle_name: assessment.middle_name ?? "",
    last_name: assessment.last_name ?? "",
    student_id: assessment.student_id ?? "",
    course_id: assessment.course?.id ? String(assessment.course.id) : "",
    address: assessment.address ?? "",
    enrolled_under: assessment.enrolled_under ?? "Undergraduate",
    sy_last_attended: assessment.sy_last_attended ?? "",
    semester: assessment.semester ?? "First Semester",
  });

  const fullName = [
    assessment.last_name ? `${assessment.last_name},` : "",
    assessment.first_name,
    assessment.middle_name,
  ]
    .filter(Boolean)
    .join(" ");
  const printUrl = assessmentReceiptUrl(reference, token);
  const downloadUrl = assessmentReceiptUrl(reference, token, true);

  return (
    <main className="min-h-screen bg-linear-to-b from-blue-500 via-slate-100 to-white px-3 py-6 sm:px-6 sm:py-12">
      <title>Assessment Submission Successful</title>
      <div className="mx-auto max-w-5xl">
        <Card className="pt-0! overflow-hidden rounded-2xl shadow-xl sm:rounded-3xl">
          <CardHeader className="bg-linear-to-b rounded-2xl from-blue-600 to-blue-400 px-4 text-center text-white sm:py-10">
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
                {assessment.reference_number}
              </p>
              <p className="text-sm text-slate-500">
                Please keep this reference number for tracking your request.
              </p>
            </div>
            <Separator />
            <section>
              <h2 className="mb-4 flex items-center gap-3 text-xl font-semibold text-blue-900 sm:text-2xl">
                <User className="h-5 w-5 text-blue-700" />
                Contact Information
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Email" value={assessment.email} icon={Mail} />
                <Detail
                  label="Contact Number"
                  value={formatContactNumber(assessment.contact_num)}
                  icon={Phone}
                />
              </div>
            </section>
            <Separator />
            <section>
              <h2 className="mb-4 flex items-center gap-3 text-xl font-semibold text-blue-900 sm:text-2xl">
                <IdCard className="h-5 w-5 text-blue-700" />
                Identity Details
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Full Name" value={fullName} />
                <Detail
                  label="Student ID"
                  value={assessment.student_id}
                  icon={Hash}
                />
                <Detail
                  label="Address"
                  value={assessment.address}
                  icon={MapPin}
                />
                <Detail label="Course" value={assessment.course?.course_desc} />
              </div>
            </section>
            <Separator />
            <section>
              <h2 className="mb-4 flex items-center gap-3 text-xl font-semibold text-blue-900 sm:text-2xl">
                <Receipt className="h-5 w-5 text-blue-700" />
                Assessment Details
              </h2>
              <div className="grid gap-5 sm:grid-cols-3">
                {[
                  ["Enrolled Under", assessment.enrolled_under],
                  ["Semester", assessment.semester],
                  ["School Year", assessment.sy_last_attended],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase sm:text-sm">
                      {label}
                    </p>
                    <span
                      className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold sm:text-base ${label === "School Year" ? badgeClass(undefined) : badgeClass(value)}`}
                    >
                      {value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
            <Separator />
            <p className="text-center text-sm text-slate-500">
              Submitted on: {formatDate(assessment.created_at)}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 border-t px-4 py-6 sm:px-6">
            <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
              <Link
                to="/assessment"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700"
              >
                Submit Another Request
              </Link>
              <Link
                to="/opform"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700"
              >
                Submit Order of Payment
              </Link>
              <a
                href={downloadUrl}
                download={`Assessment-Transaction-${assessment.reference_number}.pdf`}
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
              render={<Link to="/assessment" />}
              className="bg-blue-700 text-white hover:bg-blue-800"
            >
              Submit another assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
