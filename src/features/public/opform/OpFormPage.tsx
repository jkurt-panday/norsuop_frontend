import { useState } from "react";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardDescription,
  CardTitle,
} from "../../../components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "../../../components/ui/field";
import { Input } from "../../../components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import type { ChangeEvent, ReactNode, SubmitEvent } from "react";
import { Link, useNavigate } from "react-router";
import AddCollegeOfficeModal from "../../../components/ui/AddCollegeOfficeModal";
import {
  ClipboardList,
  FileText,
  GraduationCap,
  Mail,
  Plus,
  User,
  UploadCloud,
} from "lucide-react";
import { ApiError } from "../../../api/client";
import {
  getExpiringLocalStorage,
  setExpiringLocalStorage,
} from "../../../lib/expiring-local-storage";
import { useSubmitOpForm } from "./mutations";
import { useOpOptions } from "./queries";
import type { Option } from "./api";

const reqTypes = ["New Request", "Re-issue Request"] as const;
type FormTab = "general" | "student";

const SCHOOL_YEAR_OPTIONS = Array.from({ length: 27 }, (_, index) => {
  const now = new Date();
  const start = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  const year = start - index;
  return `${year}-${year + 1}`;
});

const initialValues: Record<string, string> = {
  request_type: "New Request",
  email: "",
  contact_num: "",
  firstname_or_office: "",
  middlename_or_project: "",
  lastname_or_agency: "",
  office_or_college: "",
  position_or_designation: "",
  address: "",
  amount: "",
  membership_id: "",
  payment_detail_option_id: "",
  student_num: "",
  course_id: "",
  school_year: "",
  semester: "",
};

export function OpFormPage() {
  const prefill = getExpiringLocalStorage<Record<string, string>>(
    "submit-form-prefill",
  );
  const navigate = useNavigate();
  const options = useOpOptions();
  const mutation = useSubmitOpForm();
  const [activeTab, setActiveTab] = useState<FormTab>("student");
  const [values, setValues] = useState({ ...initialValues, ...prefill });
  const [documents, setDocuments] = useState<File[]>([]);
  const [documentError, setDocumentError] = useState("");
  const [addCollegeOffices, setAddCollegeOffices] = useState<Option[]>([]);
  const [addCollegeOfficeOpen, setAddCollegeOfficeOpen] = useState(false);

  if (options.isPending)
    return (
      <main className="public-form-loading">
        Loading Order of Payment options…
      </main>
    );
  if (options.isError)
    return (
      <main className="public-form-loading">
        <h1>Unable to load form</h1>
        <p>{options.error.message}</p>
        <button type="button" onClick={() => void options.refetch()}>
          Try again
        </button>
      </main>
    );

  const data = options.data.data;
  const errors =
    mutation.error instanceof ApiError ? mutation.error.errors : {};
  const isStudent = activeTab === "student";
  const semesters = [
    ...new Set(data.academicTerms.map((term) => term.semester).filter(Boolean)),
  ];

  function update(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }
  function updateDigits(key: string, value: string, max: number) {
    update(key, value.replace(/\D/g, "").slice(0, max));
  }
  function changeTab(tab: FormTab) {
    setActiveTab(tab);
    if (tab === "student") update("position_or_designation", "Student");
    else
      setValues((current) => ({
        ...current,
        position_or_designation: "",
        student_num: "",
        course_id: "",
        school_year: "",
        semester: "",
      }));
  }
  function reset() {
    setValues({ ...initialValues, position_or_designation: "Student" });
    setDocuments([]);
    setDocumentError("");
    setActiveTab("student");
    mutation.reset();
  }
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setExpiringLocalStorage("submit-form-prefill", values);
    mutation.mutate(
      { ...values, documents },
      {
        onSuccess: (response) =>
          navigate(
            `/public/success/${encodeURIComponent(response.data.reference_number)}?token=${encodeURIComponent(response.data.access_token)}`,
          ),
      },
    );
  }
  function fieldError(key: string) {
    return errors[key]?.map((message) => (
      <small className="field-error" key={message}>
        {message}
      </small>
    ));
  }
  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 5)
      setDocumentError("You can upload a maximum of 5 supporting documents.");
    else setDocumentError("");
    setDocuments(files.slice(0, 5));
  }

  return (
    <main className="public-form-shell">
      <div className="public-form-header">
        <div className="public-form-logo">
          <img src="/finance_logo1.png" alt="NORSU Logo" />
        </div>
        <h1>NORSU Order of Payment - MAIN CAMPUS</h1>
        <p>Fill out the form below to submit your request.</p>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => changeTab(value as FormTab)}
        className="public-form-tabs mb-2 w-full rounded-2xl! bg-transparent! p-0!"
      >
        <TabsList className="flex h-12 w-full items-stretch gap-1 rounded-2xl bg-blue-50 p-1">
          <TabsTrigger value="general" className="flex-1 rounded-xl text-base font-semibold data-active:text-blue-700">General</TabsTrigger>
          <TabsTrigger value="student" className="flex-1 rounded-xl text-base font-semibold data-active:text-blue-700">Student</TabsTrigger>
        </TabsList>
      </Tabs>
      <Card className="public-form-card overflow-hidden rounded-3xl border border-blue-100 bg-card shadow-xl">
      <form noValidate onSubmit={submit}>
        <section className="public-form-section">
          <SectionHeader
            icon={<Mail size={20} />}
            title="Contact Information"
            description="Fill out the details below"
          />
          <div className="public-form-grid two">
            <FormField label="Email Address" error={fieldError("email")}>
              <Input
                className="h-12 rounded-xl border-border bg-card px-4 text-base shadow-sm"
                type="email"
                value={values.email}
                placeholder="jondoe@mail.com"
                aria-invalid={Boolean(errors.email)}
                onChange={(event) => update("email", event.target.value)}
              />
            </FormField>
            <FormField label="Contact Number" error={fieldError("contact_num")}>
              <input
                type="tel"
                maxLength={11}
                inputMode="numeric"
                placeholder="09123334444"
                value={values.contact_num}
                aria-invalid={Boolean(errors.contact_num)}
                onChange={(event) =>
                  updateDigits("contact_num", event.target.value, 11)
                }
              />
            </FormField>
          </div>
        </section>
        <section className="public-form-section">
          <SectionHeader icon={<User size={20} />} title="Identity Details" />
          <div className="public-form-grid three">
            <FormField
              label="First Name / Office"
              error={fieldError("firstname_or_office")}
            >
              <input
                value={values.firstname_or_office}
                placeholder="Juan"
                onChange={(event) =>
                  update("firstname_or_office", event.target.value)
                }
              />
            </FormField>
            <FormField
              label="Middle Name / Project"
              error={fieldError("middlename_or_project")}
            >
              <input
                value={values.middlename_or_project}
                placeholder="Carlos"
                onChange={(event) =>
                  update("middlename_or_project", event.target.value)
                }
              />
            </FormField>
            <FormField
              label="Last Name / Agency"
              error={fieldError("lastname_or_agency")}
            >
              <input
                value={values.lastname_or_agency}
                placeholder="Dela Cruz"
                onChange={(event) =>
                  update("lastname_or_agency", event.target.value)
                }
              />
            </FormField>
          </div>
          <div className="public-form-grid two">
            <FormField
              label="Office / College"
              description="* N/A if not applicable"
              error={fieldError("office_or_college")}
            >
              <div className="public-form-inline-field">
                <select
                  value={values.office_or_college}
                  onChange={(event) =>
                    update("office_or_college", event.target.value)
                  }
                >
                  <option value="">Select office / college</option>
                  {([...data.collegeOffices, ...addCollegeOffices]).map((office) => (
                    <option key={office.id} value={office.name}>
                      {office.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="icon-button"
                  title="Add new office / college"
                  aria-label="Add new office / college"
                  onClick={() => setAddCollegeOfficeOpen(true)}
                >
                  <Plus size={18} />
                </button>
                <AddCollegeOfficeModal
                  open={addCollegeOfficeOpen}
                  onOpenChange={setAddCollegeOfficeOpen}
                  onCreated={(item) => {
                    setAddCollegeOffices((current) => [...current, item]);
                    update("office_or_college", item.name);
                  }}
                />
              </div>
            </FormField>
            <FormField
              label="Position / Designation"
              description="* N/A if not applicable"
              error={fieldError("position_or_designation")}
            >
              <input
                disabled={isStudent}
                value={isStudent ? "Student" : values.position_or_designation}
                onChange={(event) =>
                  update("position_or_designation", event.target.value)
                }
              />
            </FormField>
          </div>
          <FormField label="Address" error={fieldError("address")}>
            <input
              value={values.address}
              placeholder="Kagawasan Ave. Dumaguete City"
              onChange={(event) => update("address", event.target.value)}
            />
          </FormField>
        </section>
        {isStudent && (
          <section className="public-form-section">
            <SectionHeader
              icon={<GraduationCap size={20} />}
              title="Academic Details"
            />
            <div className="public-form-grid two">
              <FormField
                label="Student Number"
                error={fieldError("student_num")}
              >
                <input
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="202100123"
                  value={values.student_num}
                  onChange={(event) =>
                    updateDigits("student_num", event.target.value, 9)
                  }
                />
              </FormField>
              <FormField label="Course" error={fieldError("course_id")}>
                <select
                  value={values.course_id}
                  onChange={(event) => update("course_id", event.target.value)}
                >
                  <option value="">Select course</option>
                  {data.courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.course_code} — {course.course_desc}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="School Year" error={fieldError("school_year")}>
                <select
                  value={values.school_year}
                  onChange={(event) =>
                    update("school_year", event.target.value)
                  }
                >
                  <option value="">Select school year</option>
                  {SCHOOL_YEAR_OPTIONS.map((year) => (
                    <option key={year}>{year}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Semester" error={fieldError("semester")}>
                <select
                  value={values.semester}
                  onChange={(event) => update("semester", event.target.value)}
                >
                  <option value="">Select semester</option>
                  {semesters.map((semester) => (
                    <option key={semester}>{semester}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </section>
        )}
        <section className="public-form-section">
          <SectionHeader
            icon={<ClipboardList size={20} />}
            title="Request Details"
          />
          <div className="public-form-grid two">
            <FormField label="Amount" error={fieldError("amount")}>
              <div className="currency-field">
                <span>₱</span>
                <input
                  inputMode="decimal"
                  placeholder="00.00"
                  value={values.amount}
                  onChange={(event) => {
                    if (/^\d*\.?\d{0,2}$/.test(event.target.value))
                      update("amount", event.target.value);
                  }}
                />
              </div>
            </FormField>
            <FormField label="Request Type" error={fieldError("request_type")}>
              <select
                value={values.request_type}
                onChange={(event) => update("request_type", event.target.value)}
              >
                {reqTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </FormField>
            <FormField
              label="Membership Type"
              error={fieldError("membership_id")}
            >
              <select
                value={values.membership_id}
                onChange={(event) =>
                  update("membership_id", event.target.value)
                }
              >
                <option value="">Select membership</option>
                {data.memberships.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.member_code}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              label="Payment Details"
              error={fieldError("payment_detail_option_id")}
            >
              <select
                value={values.payment_detail_option_id}
                onChange={(event) =>
                  update("payment_detail_option_id", event.target.value)
                }
              >
                <option value="">Select payment details</option>
                {data.paymentOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.payment_desc}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </section>
        <section className="public-form-section">
          <SectionHeader
            icon={<FileText size={20} />}
            title="Supporting Document(s)"
            description="e.g. Assessment Form, Billing Statement, Student ID. Optional PDF or image files, maximum 5 files."
          />
          {documentError && (
            <small className="field-error">{documentError}</small>
          )}
          <label className="upload-dropzone">
            <UploadCloud size={28} />
            <strong>Choose files to upload</strong>
            <span>PDF, JPG, PNG, or WEBP up to 10MB each</span>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={selectFiles}
            />
          </label>
          {documents.length > 0 && (
            <ul className="public-form-file-list">
              {documents.map((file, index) => (
                <li key={`${file.name}-${file.lastModified}-${index}`}>
                  <span>{file.name}</span>
                  <small>{Math.ceil(file.size / 1024)} KB</small>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() =>
                      setDocuments((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        {mutation.isError && Object.keys(errors).length === 0 && (
          <p className="field-error form-error">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Submission failed."}
          </p>
        )}
        <footer className="public-form-footer">
          <Link to="/">Cancel</Link>
          <Button type="button" variant="outline" onClick={reset} disabled={mutation.isPending} className="rounded-xl border-border">
            Reset
          </Button>
          <Button type="submit" disabled={mutation.isPending} className="rounded-xl bg-blue-600 font-semibold text-white hover:bg-blue-700">
            {mutation.isPending ? "Submitting…" : "Submit Request"}
          </Button>
        </footer>
      </form>
      </Card>
    </main>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <header>
      <span>{icon}</span>
      <div>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </div>
    </header>
  );
}
function FormField({
  label,
  description,
  error,
  children,
}: {
  label: string;
  description?: string;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Field className="public-form-field">
      <FieldLabel className="font-medium text-slate-700">{label}</FieldLabel>
      {description && <FieldDescription>{description}</FieldDescription>}
      {children}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
