import { LightModeWrapper } from "../../../components/ui/LightModeWrapper";
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { FileUpload } from "../../../components/application/file-upload/file-upload-base";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardDescription,
  CardTitle,
} from "../../../components/ui/card";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldDescription,
} from "../../../components/ui/field";
import { Input } from "../../../components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../../../components/ui/combobox";
import { Separator } from "../../../components/ui/separator";
import type { SubmitEvent } from "react";
import { useNavigate } from "react-router";
import AddCollegeOfficeModal from "../../../components/ui/AddCollegeOfficeModal";
import {
  ClipboardList,
  FileText,
  GraduationCap,
  Mail,
  Plus,
  User,
} from "lucide-react";
import { ApiError } from "../../../api/client";
import {
  getExpiringLocalStorage,
  setExpiringLocalStorage,
} from "../../../lib/expiring-local-storage";
import { useSubmitOpForm } from "./mutations";
import { useOpOptions } from "./queries";
import type { Option } from "./api";
import { OpFormSkeleton } from "./OpFormSkeleton";

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
  const [values, setValues] = useState<Record<string, string>>({
    ...initialValues,
    ...prefill,
    position_or_designation: "Student",
  });
  const [documents, setDocuments] = useState<File[]>([]);
  const [documentProgress, setDocumentProgress] = useState<
    Record<string, number>
  >({});
  const [documentError, setDocumentError] = useState("");
  const [addCollegeOffices, setAddCollegeOffices] = useState<Option[]>([]);
  const [addCollegeOfficeOpen, setAddCollegeOfficeOpen] = useState(false);

  if (options.isPending) return <OpFormSkeleton />;
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
  function fileKey(file: File) {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }
  function handleDropFiles(files: FileList) {
    const incoming = Array.from(files);
    if (documents.length + incoming.length > 5) {
      setDocumentError("You can upload a maximum of 5 supporting documents.");
      return;
    }
    setDocumentError("");
    setDocuments((current) => [...current, ...incoming]);
    incoming.forEach((file) =>
      setDocumentProgress((current) => ({ ...current, [fileKey(file)]: 100 })),
    );
  }
  function fileType(file: File): "pdf" | "image" | "empty" {
    if (file.name.toLowerCase().endsWith(".pdf")) return "pdf";
    if (file.type.startsWith("image/")) return "image";
    return "empty";
  }

  return (
    <LightModeWrapper>
      <title>Order of Payment Form</title>
      <main className="min-h-screen bg-linear-to-b from-blue-500 via-slate-200 to-white px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <header className="mb-6 rounded-2xl border border-blue-100 bg-white px-8 py-8 text-center shadow-md">
            <div className="flex justify-center">
              <img
                src="/finance_logo1.png"
                alt="NORSU Logo"
                width={600}
                height={114}
                className="pb-6"
              />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-blue-900">
              NORSU Order of Payment - MAIN CAMPUS
            </h1>
            <p className="mt-3 text-base text-slate-600">
              Fill out the form below to submit your request.
            </p>
          </header>
          <Tabs
            value={activeTab}
            onValueChange={(value) => changeTab(value as FormTab)}
            className="public-form-tabs mb-2 w-full rounded-2xl! bg-transparent! p-0!"
          >
            <TabsList className="flex h-12 w-full items-stretch gap-1 rounded-2xl bg-white p-1">
              <TabsTrigger
                value="general"
                className="flex-1 rounded-xl text-base font-semibold data-active:text-blue-700"
              >
                General
              </TabsTrigger>
              <TabsTrigger
                value="student"
                className="flex-1 rounded-xl text-base font-semibold data-active:text-blue-700"
              >
                Student
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Card className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl">
            <form noValidate onSubmit={submit}>
              <CardHeader className="border-b border-slate-100 bg-white pb-6 mb-4!">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-blue-900">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Contact Information
                </CardTitle>
                <CardDescription>Fill out the details below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel
                        htmlFor="input-field-email"
                        className="mb-2 font-medium text-slate-700"
                      >
                        Email Address
                      </FieldLabel>
                      <Input
                        className="h-12 rounded-xl border-border bg-white px-4 text-base shadow-sm transition-all duration-200 focus-visible:border-blue-500! focus-visible:ring-2! focus-visible:ring-blue-500/30!"
                        id="input-field-email"
                        type="email"
                        placeholder="jondoe@mail.com"
                        value={values.email}
                        aria-invalid={Boolean(errors.email)}
                        onChange={(event) =>
                          update("email", event.target.value)
                        }
                      />
                      {fieldError("email")}
                    </Field>
                    <Field>
                      <FieldLabel
                        htmlFor="input-field-contact"
                        className="mb-2 font-medium text-slate-700"
                      >
                        Contact Number
                      </FieldLabel>
                      <Input
                        className="h-12 rounded-xl border-border bg-white px-4 text-base shadow-sm transition-all duration-200 focus-visible:border-blue-500! focus-visible:ring-2! focus-visible:ring-blue-500/30!"
                        id="input-field-contact"
                        type="tel"
                        inputMode="numeric"
                        aria-invalid={Boolean(
                          errors.contact_num ||
                          (values.contact_num.length > 0 &&
                            values.contact_num.length !== 11),
                        )}
                        placeholder="0912 333 4444"
                        maxLength={13}
                        value={values.contact_num.replace(
                          /^(\d{0,4})(\d{0,3})(\d{0,4}).*/,
                          (_, a, b, c) => [a, b, c].filter(Boolean).join(" "),
                        )}
                        onChange={(event) =>
                          updateDigits("contact_num", event.target.value, 11)
                        }
                      />
                      {fieldError("contact_num")}
                      {values.contact_num.length > 0 &&
                        values.contact_num.length !== 11 && (
                          <FieldError>
                            Contact number must contain exactly 11 digits.
                          </FieldError>
                        )}
                    </Field>
                  </div>
                </div>
                <Separator className="bg-blue-100" />
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-blue-900">
                  <User className="h-5 w-5 text-blue-600" />
                  Identity Details
                </CardTitle>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-3">
                    {(
                      [
                        ["firstname_or_office", "First Name / Office", "Juan"],
                        [
                          "middlename_or_project",
                          "Middle Name / Project",
                          "Carlos",
                        ],
                        [
                          "lastname_or_agency",
                          "Last Name / Agency",
                          "Dela Cruz",
                        ],
                      ] as const
                    ).map(([key, label, placeholder]) => (
                      <Field key={key}>
                        <FieldLabel
                          htmlFor={`input-field-${key}`}
                          className="mb-2 font-medium text-slate-700"
                        >
                          {label}
                        </FieldLabel>
                        <Input
                          className="h-12 rounded-xl border-border bg-white px-4 text-base shadow-sm transition-all duration-200 focus-visible:border-blue-500! focus-visible:ring-2! focus-visible:ring-blue-500/30!"
                          id={`input-field-${key}`}
                          type="text"
                          placeholder={placeholder}
                          value={values[key]}
                          aria-invalid={Boolean(errors[key])}
                          onChange={(event) => update(key, event.target.value)}
                        />
                        {fieldError(key)}
                      </Field>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-2">
                    <Field>
                      <FieldLabel
                        htmlFor="combobox-office"
                        className="mb-2 font-medium text-slate-700"
                      >
                        Office / College
                      </FieldLabel>
                      <FieldDescription>
                        * N/A if not applicable
                      </FieldDescription>
                      <div className="grid grid-cols-[88%_10%] gap-2">
                        <Combobox
                          items={[...data.collegeOffices, ...addCollegeOffices]}
                          value={values.office_or_college}
                          onValueChange={(value) =>
                            update("office_or_college", value ?? "")
                          }
                        >
                          <ComboboxInput
                            id="combobox-office"
                            placeholder="Select office / college"
                            aria-label="Office or College"
                            className="h-12 rounded-xl border-border bg-white px-4 text-base shadow-sm focus-visible:border-blue-500! focus-visible:ring-2! focus-visible:ring-blue-500/30!"
                            showClear={Boolean(values.office_or_college)}
                          />
                          <ComboboxContent>
                            <ComboboxEmpty>No items found.</ComboboxEmpty>
                            <ComboboxList>
                              {(office) => (
                                <ComboboxItem
                                  key={office.id}
                                  value={office.name}
                                >
                                  {office.name}
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => setAddCollegeOfficeOpen(true)}
                          title="Add new office / college"
                          className="h-12 w-12 rounded-xl bg-blue-500"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <AddCollegeOfficeModal
                          open={addCollegeOfficeOpen}
                          onOpenChange={setAddCollegeOfficeOpen}
                          onCreated={(item) => {
                            setAddCollegeOffices((current) => [
                              ...current,
                              item,
                            ]);
                            update("office_or_college", item.name);
                          }}
                        />
                      </div>
                      {fieldError("office_or_college")}
                    </Field>
                    <Field>
                      <FieldLabel
                        htmlFor="input-field-pos-des"
                        className="mb-2 font-medium text-slate-700"
                      >
                        Position / Designation
                      </FieldLabel>
                      <FieldDescription>
                        * N/A if not applicable
                      </FieldDescription>
                      <Input
                        className="h-12 rounded-xl border-border bg-white px-4 text-base shadow-sm focus-visible:border-blue-500! focus-visible:ring-2! focus-visible:ring-blue-500/30!"
                        id="input-field-pos-des"
                        disabled={isStudent}
                        value={
                          isStudent ? "Student" : values.position_or_designation
                        }
                        onChange={(event) =>
                          update("position_or_designation", event.target.value)
                        }
                        aria-invalid={Boolean(errors.position_or_designation)}
                      />
                      {fieldError("position_or_designation")}
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel
                      htmlFor="input-field-address"
                      className="mb-2 font-medium text-slate-700"
                    >
                      Address
                    </FieldLabel>
                    <Input
                      className="h-12 rounded-xl border-border bg-white px-4 text-base shadow-sm focus-visible:border-blue-500! focus-visible:ring-2! focus-visible:ring-blue-500/30!"
                      id="input-field-address"
                      placeholder="Kagawasan Ave. Dumaguete City"
                      value={values.address}
                      onChange={(event) =>
                        update("address", event.target.value)
                      }
                      aria-invalid={Boolean(errors.address)}
                    />
                    {fieldError("address")}
                  </Field>
                </div>
                {isStudent && (
                  <>
                    <Separator className="bg-blue-100" />
                    <CardTitle className="flex items-center gap-3 text-xl font-semibold text-blue-900">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                      Academic Details
                    </CardTitle>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
                      <Field>
                        <FieldLabel
                          htmlFor="input-field-studentnum"
                          className="mb-2 font-medium text-slate-700"
                        >
                          Student Number
                        </FieldLabel>
                        <Input
                          className="h-12 rounded-xl border-border bg-white px-4 text-base shadow-sm focus-visible:border-blue-500! focus-visible:ring-2! focus-visible:ring-blue-500/30!"
                          id="input-field-studentnum"
                          inputMode="numeric"
                          maxLength={9}
                          placeholder="202100123"
                          value={values.student_num}
                          onChange={(event) =>
                            updateDigits("student_num", event.target.value, 9)
                          }
                          aria-invalid={Boolean(errors.student_num)}
                        />
                        {fieldError("student_num")}
                      </Field>
                      <Field>
                        <FieldLabel
                          htmlFor="input-field-course"
                          className="mb-2 font-medium text-slate-700"
                        >
                          Course
                        </FieldLabel>
                        <Combobox
                          required
                          items={data.courses}
                          value={(() => {
                            const selected = data.courses.find(
                              (course) =>
                                String(course.id) === values.course_id,
                            );
                            return selected
                              ? `${selected.course_code} — ${selected.course_desc}`
                              : "";
                          })()}
                          onValueChange={(value) => {
                            const selected = data.courses.find(
                              (course) =>
                                `${course.course_code} — ${course.course_desc}` ===
                                value,
                            );
                            update(
                              "course_id",
                              selected ? String(selected.id) : "",
                            );
                          }}
                        >
                          <ComboboxInput
                            placeholder="Select course"
                            aria-label="Course"
                            className="h-12 rounded-xl border-border bg-white px-4 text-base shadow-sm focus-visible:border-blue-500! focus-visible:ring-2! focus-visible:ring-blue-500/30!"
                            showClear={Boolean(values.course_id)}
                          />
                          <ComboboxContent>
                            <ComboboxEmpty>No items found.</ComboboxEmpty>
                            <ComboboxList>
                              {(course) => {
                                const label = `${course.course_code} — ${course.course_desc}`;
                                return (
                                  <ComboboxItem key={course.id} value={label}>
                                    {label}
                                  </ComboboxItem>
                                );
                              }}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        {fieldError("course_id")}
                      </Field>
                      <Field>
                        <FieldLabel
                          htmlFor="input-field-schoolyear"
                          className="mb-2 font-medium text-slate-700"
                        >
                          School Year
                        </FieldLabel>
                        <Combobox
                          items={SCHOOL_YEAR_OPTIONS}
                          value={values.school_year}
                          onValueChange={(value) =>
                            update("school_year", value ?? "")
                          }
                        >
                          <ComboboxInput
                            placeholder="Select school year"
                            aria-label="School Year"
                            className="h-12 rounded-xl border-border bg-white px-4 text-base shadow-sm focus-visible:border-blue-500! focus-visible:ring-2! focus-visible:ring-blue-500/30!"
                            showClear={Boolean(values.school_year)}
                          />
                          <ComboboxContent>
                            <ComboboxEmpty>No items found.</ComboboxEmpty>
                            <ComboboxList>
                              {(year) => (
                                <ComboboxItem key={year} value={year}>
                                  SY {year}
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        {fieldError("school_year")}
                      </Field>
                      <Field>
                        <FieldLabel
                          htmlFor="input-field-semester"
                          className="mb-2 font-medium text-slate-700"
                        >
                          Semester
                        </FieldLabel>
                        <Combobox
                          items={semesters}
                          value={values.semester}
                          onValueChange={(value) =>
                            update("semester", value ?? "")
                          }
                        >
                          <ComboboxInput
                            placeholder="Select semester"
                            aria-label="Semester"
                            className="h-12 rounded-xl border-border bg-white px-4 text-base shadow-sm focus-visible:border-blue-500! focus-visible:ring-2! focus-visible:ring-blue-500/30!"
                            showClear={Boolean(values.semester)}
                          />
                          <ComboboxContent>
                            <ComboboxEmpty>No items found.</ComboboxEmpty>
                            <ComboboxList>
                              {(semester) => (
                                <ComboboxItem key={semester} value={semester}>
                                  {semester}
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        {fieldError("semester")}
                      </Field>
                    </div>
                  </>
                )}
                <Separator className="bg-blue-100" />
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-blue-900">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                  Request Details
                </CardTitle>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
                  <Field>
                    <FieldLabel
                      htmlFor="input-field-amount"
                      className="mb-2 font-medium text-slate-700"
                    >
                      Amount
                    </FieldLabel>
                    <div className="flex">
                      <div className="flex h-12 items-center justify-center rounded-l-md border border-r-0 border-blue-200 bg-blue-50 px-4 text-base font-semibold text-blue-700">
                        ₱
                      </div>
                      <Input
                        className="h-12 rounded-l-none rounded-r-xl border-border bg-white px-4 text-base shadow-sm"
                        id="input-field-amount"
                        inputMode="decimal"
                        placeholder="00.00"
                        value={values.amount}
                        aria-invalid={Boolean(errors.amount)}
                        onChange={(event) => {
                          if (/^\d*\.?\d{0,2}$/.test(event.target.value))
                            update("amount", event.target.value);
                        }}
                      />
                    </div>
                    {fieldError("amount")}
                  </Field>
                  <Field>
                    <FieldLabel
                      htmlFor="input-field-reqtype"
                      className="mb-2 font-medium text-slate-700"
                    >
                      Request Type
                    </FieldLabel>
                    <Combobox
                      items={reqTypes}
                      value={values.request_type}
                      onValueChange={(value) =>
                        update("request_type", value ?? "")
                      }
                    >
                      <ComboboxInput
                        placeholder="Select a request type"
                        aria-label="Request Type"
                        className="h-12 rounded-xl border-border bg-white px-4 text-base shadow-sm focus-visible:border-blue-500! focus-visible:ring-2! focus-visible:ring-blue-500/30!"
                        showClear={Boolean(values.request_type)}
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>No items found.</ComboboxEmpty>
                        <ComboboxList>
                          {(type) => (
                            <ComboboxItem key={type} value={type}>
                              {type}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {fieldError("request_type")}
                  </Field>
                  <Field>
                    <FieldLabel
                      htmlFor="input-field-memtype"
                      className="mb-2 font-medium text-slate-700"
                    >
                      Membership Type
                    </FieldLabel>
                    <Combobox
                      items={data.memberships}
                      value={
                        data.memberships.find(
                          (item) => String(item.id) === values.membership_id,
                        )?.member_code ?? ""
                      }
                      onValueChange={(value) =>
                        update(
                          "membership_id",
                          String(
                            data.memberships.find(
                              (item) => item.member_code === value,
                            )?.id ?? "",
                          ),
                        )
                      }
                    >
                      <ComboboxInput
                        placeholder="Select membership"
                        aria-label="Membership Type"
                        className="h-12 rounded-xl border-border bg-white px-4 text-base shadow-sm focus-visible:border-blue-500! focus-visible:ring-2! focus-visible:ring-blue-500/30!"
                        showClear={Boolean(values.membership_id)}
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>No items found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item) => (
                            <ComboboxItem
                              key={item.id}
                              value={item.member_code ?? ""}
                            >
                              {item.member_code}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {fieldError("membership_id")}
                  </Field>
                  <Field>
                    <FieldLabel
                      htmlFor="input-field-paydet"
                      className="mb-2 font-medium text-slate-700"
                    >
                      Payment Details
                    </FieldLabel>
                    <Combobox
                      items={data.paymentOptions}
                      value={
                        data.paymentOptions.find(
                          (item) =>
                            String(item.id) === values.payment_detail_option_id,
                        )?.payment_desc ?? ""
                      }
                      onValueChange={(value) =>
                        update(
                          "payment_detail_option_id",
                          String(
                            data.paymentOptions.find(
                              (item) => item.payment_desc === value,
                            )?.id ?? "",
                          ),
                        )
                      }
                    >
                      <ComboboxInput
                        placeholder="Select payment details"
                        aria-label="Payment Details"
                        className="h-12 rounded-xl border-border bg-white px-4 text-base shadow-sm focus-visible:border-blue-500! focus-visible:ring-2! focus-visible:ring-blue-500/30!"
                        showClear={Boolean(values.payment_detail_option_id)}
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>No items found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item) => (
                            <ComboboxItem
                              key={item.id}
                              value={item.payment_desc ?? ""}
                            >
                              {item.payment_desc}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {fieldError("payment_detail_option_id")}
                  </Field>
                </div>
                <Separator className="bg-blue-100" />
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-blue-900">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Supporting Document(s)
                </CardTitle>
                <p className="mt-3 text-sm text-slate-600">
                  e.g. Assessment Form, Billing Statement, Computation
                  Documents, Student ID, Liquidation Form
                </p>
                {documentError && <FieldError>{documentError}</FieldError>}
                <FileUpload.Root className="mt-4">
                  <FileUpload.DropZone
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    maxSize={10 * 1024 * 1024}
                    allowsMultiple
                    hint="PDF, JPG, PNG, or WEBP up to 10MB each"
                    className="rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/40 text-blue-700 hover:border-blue-500 hover:bg-blue-50"
                    onDropFiles={handleDropFiles}
                    onDropUnacceptedFiles={() =>
                      setDocumentError(
                        "Only PDF and image files are supported.",
                      )
                    }
                    onSizeLimitExceed={() =>
                      setDocumentError("Each file must be 10MB or smaller.")
                    }
                  />
                  {documents.length > 0 && (
                    <FileUpload.List>
                      {documents.map((file) => (
                        <FileUpload.ListItemProgressFill
                          key={fileKey(file)}
                          className="text-white [&_p]:text-white [&_svg]:text-white [&_hr]:bg-white/40"
                          name={file.name}
                          size={file.size}
                          type={fileType(file)}
                          progress={documentProgress[fileKey(file)] ?? 0}
                          onDelete={() =>
                            setDocuments((current) =>
                              current.filter(
                                (item) => fileKey(item) !== fileKey(file),
                              ),
                            )
                          }
                        />
                      ))}
                    </FileUpload.List>
                  )}
                </FileUpload.Root>
              </CardContent>
              {mutation.isError && Object.keys(errors).length === 0 && (
                <p className="field-error form-error">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : "Submission failed."}
                </p>
              )}
              <CardFooter className="flex flex-wrap justify-end gap-2 px-8 py-6 pt-2 mt-6!">
                <Button
                  variant="outline"
                  type="button"
                  disabled={mutation.isPending}
                  className="rounded-xl border-border hover:bg-slate-100"
                  onClick={reset}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="cursor-pointer rounded-xl bg-blue-600 font-semibold text-white shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {mutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </LightModeWrapper>
  );
}
