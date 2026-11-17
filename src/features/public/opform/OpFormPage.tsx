import { useEffect, useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router";
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
import { OpFormSkeleton } from "./OpFormSkeleton";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/application/file-upload/file-upload-base";
import AddCollegeOfficeModal from "@/components/ui/AddCollegeOfficeModal";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

const tabs = ["general", "student"] as const;
type FormTab = (typeof tabs)[number];
const requestTypes = ["New Request", "Re-issue Request"];
const enlarge =
  "h-12 rounded-xl border-border bg-white px-4 text-base shadow-sm transition-all duration-200";
const semesters = ["First Semester", "Second Semester", "Summer"];
const schoolYears = Array.from({ length: 27 }, (_, index) => {
  const now = new Date();
  const start =
    (now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1) - index;
  return `${start}-${start + 1}`;
});

const initialValues = {
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
type FormValues = typeof initialValues;

type Option = {
  id: number;
  name?: string;
  member_code?: string;
  member_desc?: string;
  payment_desc?: string;
  course_code?: string;
  course_desc?: string;
};

export function OpFormPage() {
  const navigate = useNavigate();
  const options = useOpOptions();
  const mutation = useSubmitOpForm();
  const prefill = getExpiringLocalStorage<Partial<FormValues>>(
    "submit-form-prefill",
  );
  const [activeTab, setActiveTab] = useState<FormTab>("student");
  const [values, setValues] = useState<FormValues>({
    ...initialValues,
    ...prefill,
  });
  const [documents, setDocuments] = useState<File[]>([]);
  const [documentError, setDocumentError] = useState("");
  const [officeOptions, setOfficeOptions] = useState<Option[]>([]);
  const [addOfficeOpen, setAddOfficeOpen] = useState(false);

  useEffect(() => {
    if (options.data?.data.collegeOffices) setOfficeOptions(options.data.data.collegeOffices);
  }, [options.data]);

  if (options.isPending) return <OpFormSkeleton />;
  if (options.isError)
    return (
      <main className="mx-auto mt-16 max-w-3xl rounded-2xl bg-white p-8 text-center shadow-xl">
        <h1 className="text-2xl font-bold text-blue-900">
          Unable to load form
        </h1>
        <p className="mt-2 text-slate-600">{options.error.message}</p>
        <button
          type="button"
          className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          onClick={() => void options.refetch()}
        >
          Try again
        </button>
      </main>
    );

  const data = options.data.data;
  const errors =
    mutation.error instanceof ApiError ? mutation.error.errors : {};
  const isStudent = activeTab === "student";
  const contactInvalid =
    values.contact_num.length > 0 && values.contact_num.length !== 11;
  const update = (key: keyof FormValues, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  const updateDigits = (key: keyof FormValues, value: string, max: number) =>
    update(key, value.replace(/\D/g, "").slice(0, max));
  const error = (key: keyof FormValues) =>
    errors[key]?.map((message) => (
      <FieldError key={message}>{message}</FieldError>
    ));
  const changeTab = (tab: FormTab) => {
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
  };
  const reset = () => {
    setValues({ ...initialValues });
    setDocuments([]);
    setActiveTab("student");
    mutation.reset();
  };
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = isStudent
      ? values
      : {
          ...values,
          position_or_designation: values.position_or_designation,
          student_num: "",
          course_id: "",
          school_year: "",
          semester: "",
        };
    setExpiringLocalStorage("submit-form-prefill", values);
    mutation.mutate(
      { ...payload, documents },
      {
        onSuccess: (response) =>
          navigate(
            `/public/success/${encodeURIComponent(response.data.reference_number)}?token=${encodeURIComponent(response.data.access_token)}`,
          ),
      },
    );
  };
  const removeDocument = (index: number) => {
    setDocuments((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setDocumentError("");
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-blue-500 via-slate-300 to-white px-3 py-6 sm:px-6 sm:py-12">
      <title>Order of Payment Form</title>
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 rounded-2xl border border-blue-100 bg-white px-4 py-8 text-center shadow-md sm:px-8">
          <img
            src="/finance_logo1.png"
            alt="NORSU Logo"
            width={600}
            height={114}
            className="mx-auto h-auto max-w-full pb-6"
          />
          <h1 className="text-3xl font-bold tracking-tight text-blue-900 sm:text-4xl">
            NORSU Order of Payment - MAIN CAMPUS
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Fill out the form below to submit your request.
          </p>
        </header>
        <Tabs
          value={activeTab}
          onValueChange={(value) => changeTab(value as FormTab)}
          className="mb-2 w-full rounded-2xl! bg-transparent! p-0!"
        >
          <TabsList className="flex h-auto min-h-8! w-full items-stretch gap-1 rounded-2xl bg-blue-50 px-1 py-1!">
            <TabsTrigger
              value="general"
              className="min-h-6! flex-1 rounded-xl py-2! text-base font-semibold after:bg-blue-500! data-active:text-lg data-active:text-blue-700"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="student"
              className="min-h-6! flex-1 rounded-xl py-2! text-base font-semibold after:bg-blue-500! data-active:text-lg data-active:text-blue-700"
            >
              Student
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <form noValidate onSubmit={submit}>
          <Card className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl">
            <CardHeader className="border-b border-slate-100 pb-6">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-blue-900">
                <Mail className="h-5 w-5 text-blue-600" />
                Contact Information
              </CardTitle>
              <CardDescription>Fill out the details below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Email Address" error={error("email")}>
                  <Input
                    className={`${enlarge} focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30`}
                    type="email"
                    placeholder="jondoe@mail.com"
                    value={values.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </FormField>
                <FormField label="Contact Number" error={error("contact_num")}>
                   <Input
                     className={`${enlarge} focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30`}
                     type="tel"
                     placeholder="0912 333 4444"
                     inputMode="numeric"
                     aria-invalid={Boolean(errors.contact_num || contactInvalid)}
                     maxLength={13}
                     value={values.contact_num.replace(
                       /^(\d{0,4})(\d{0,3})(\d{0,4}).*/,
                       (_, a, b, c) => [a, b, c].filter(Boolean).join(" "),
                     )}
                     onChange={(e) =>
                       updateDigits("contact_num", e.target.value, 11)
                     }
                   />
                   {contactInvalid && (
                     <FieldError>
                       Contact number must contain exactly 11 digits.
                     </FieldError>
                   )}
                 </FormField>
              </div>
              <Separator className="bg-blue-100" />
              <SectionTitle icon={<User className="h-5 w-5 text-blue-600" />}>
                Identity Details
              </SectionTitle>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  label="First Name / Office"
                  error={error("firstname_or_office")}
                >
                  <Input
                    className={`${enlarge} focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30`}
                    placeholder="Juan"
                    value={values.firstname_or_office}
                    onChange={(e) =>
                      update("firstname_or_office", e.target.value)
                    }
                  />
                </FormField>
                <FormField
                  label="Middle Name / Project"
                  error={error("middlename_or_project")}
                >
                  <Input
                    className={`${enlarge} focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30`}
                    placeholder="Carlos"
                    value={values.middlename_or_project}
                    onChange={(e) =>
                      update("middlename_or_project", e.target.value)
                    }
                  />
                </FormField>
                <FormField
                  label="Last Name / Agency"
                  error={error("lastname_or_agency")}
                >
                  <Input
                    className={`${enlarge} focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30`}
                    placeholder="Dela Cruz"
                    value={values.lastname_or_agency}
                    onChange={(e) =>
                      update("lastname_or_agency", e.target.value)
                    }
                  />
                </FormField>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Office / College"
                  error={error("office_or_college")}
                >
                  <div className="flex gap-2">
                    <OptionCombobox
                      value={values.office_or_college}
                      placeholder="Select office / college"
                      items={officeOptions.map((item) => ({
                        value: item.name ?? "",
                        label: item.name ?? "",
                      }))}
                      onValueChange={(value) =>
                        update("office_or_college", value)
                      }
                    />
                    <Button
                      type="button"
                      size="icon"
                      title="Add new office / college"
                      onClick={() => setAddOfficeOpen(true)}
                      className="h-12! w-12! rounded-xl bg-blue-500!"
                    >
                      <Plus className="h-5! w-5!" />
                    </Button>
                  </div>
                  <AddCollegeOfficeModal
                    open={addOfficeOpen}
                    onOpenChange={setAddOfficeOpen}
                    onCreated={(newOffice) => {
                      setOfficeOptions((current) => [...current, newOffice]);
                      update("office_or_college", newOffice.name);
                    }}
                  />
                </FormField>
                <FormField
                  label="Position / Designation"
                  error={error("position_or_designation")}
                >
                  <Input
                    className={`${enlarge} focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30`}
                    disabled={isStudent}
                    placeholder="Teacher"
                    value={
                      isStudent ? "Student" : values.position_or_designation
                    }
                    onChange={(e) =>
                      update("position_or_designation", e.target.value)
                    }
                  />
                </FormField>
              </div>
              <FormField label="Address" error={error("address")}>
                <Input
                  className={`${enlarge} focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30`}
                  placeholder="Kagawasan Ave. Dumaguete City"
                  value={values.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </FormField>
              <Separator className="bg-blue-100" />
              <SectionTitle
                icon={<ClipboardList className="h-5 w-5 text-blue-600" />}
              >
                Payment Info
              </SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Request Type" error={error("request_type")}>
                  <OptionCombobox
                    value={values.request_type}
                    placeholder="Select a request type"
                    items={requestTypes.map((value) => ({ value, label: value }))}
                    onValueChange={(value) => update("request_type", value)}
                  />
                </FormField>
                <FormField label="Membership" error={error("membership_id")}>
                  <OptionCombobox
                    value={values.membership_id}
                    placeholder="Select membership"
                    items={data.memberships.map((item: Option) => ({
                      value: String(item.id),
                      label: item.member_desc ?? item.member_code ?? "",
                    }))}
                    onValueChange={(value) => update("membership_id", value)}
                  />
                </FormField>
                <FormField
                  label="Payment Detail"
                  error={error("payment_detail_option_id")}
                >
                  <OptionCombobox
                    value={values.payment_detail_option_id}
                    placeholder="Select payment details"
                    items={data.paymentOptions.map((item: Option) => ({
                      value: String(item.id),
                      label: item.payment_desc ?? "",
                    }))}
                    onValueChange={(value) =>
                      update("payment_detail_option_id", value)
                    }
                  />
                </FormField>
                <FormField label="Amount" error={error("amount")}>
                  <div className="flex">
                    <span className="flex h-12 items-center justify-center rounded-l-md border border-r-0 border-blue-200 bg-blue-50 px-4 text-base font-semibold text-blue-700">
                      &#x20B1;
                    </span>
                    <Input
                      className={`${enlarge} w-full rounded-l-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30`}
                      type="text"
                      inputMode="decimal"
                      placeholder="00.00"
                      aria-invalid={Boolean(errors.amount)}
                      value={values.amount}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                          update("amount", value);
                        }
                      }}
                    />
                  </div>
                </FormField>
              </div>
              {isStudent && (
                <>
                  <Separator className="bg-blue-100" />
                  <SectionTitle
                    icon={<GraduationCap className="h-5 w-5 text-blue-600" />}
                  >
                    Academic Details
                  </SectionTitle>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="Student Number"
                      error={error("student_num")}
                    >
                      <Input
                        className={`${enlarge} focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30`}
                        inputMode="numeric"
                        placeholder="202100123"
                        maxLength={9}
                        value={values.student_num}
                        onChange={(e) =>
                          updateDigits("student_num", e.target.value, 9)
                        }
                      />
                    </FormField>
                    <FormField label="Course" error={error("course_id")}>
                      <OptionCombobox
                        value={values.course_id}
                        placeholder="Select course"
                        items={data.courses.map((item: Option) => ({
                          value: String(item.id),
                          label: `${item.course_code} — ${item.course_desc}`,
                        }))}
                        onValueChange={(value) => update("course_id", value)}
                      />
                    </FormField>
                    <FormField label="School Year" error={error("school_year")}>
                      <OptionCombobox
                        value={values.school_year}
                        placeholder="Select school year"
                        items={schoolYears.map((value) => ({ value, label: value }))}
                        onValueChange={(value) => update("school_year", value)}
                      />
                    </FormField>
                    <FormField label="Semester" error={error("semester")}>
                      <OptionCombobox
                        value={values.semester}
                        placeholder="Select semester"
                        items={semesters.map((value) => ({ value, label: value }))}
                        onValueChange={(value) => update("semester", value)}
                      />
                    </FormField>
                  </div>
                </>
              )}
              <Separator className="bg-blue-100" />
              <SectionTitle
                icon={<FileText className="h-5 w-5 text-blue-600" />}
              >
                Supporting Documents
              </SectionTitle>
              <p className="text-sm text-slate-500">
                Optional PDF or image files, maximum 5 files.
              </p>
                {/* Legacy native file input retained as a study reference:
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={addDocuments}
                />
                */}
                <FileUpload.DropZone
                  className="border border-blue-500 bg-transparent [&_button]:text-blue-400 [&_button:hover]:text-blue-500"
                   accept=".pdf,.jpg,.jpeg,.png,.webp"
                   allowsMultiple
                   maxSize={10 * 1024 * 1024}
                   hint="PDF, JPG, JPEG, PNG or WEBP (maximum 10 MB per file)"
                 onDropFiles={(files) => {
                   const incoming = Array.from(files);
                   if (documents.length + incoming.length > 5) {
                     setDocumentError("You can upload a maximum of 5 supporting documents.");
                     return;
                   }
                   setDocumentError("");
                   setDocuments((current) => [...current, ...incoming]);
                 }}
                 onDropUnacceptedFiles={() =>
                   setDocumentError("Only PDF, JPG, JPEG, PNG, and WEBP files are allowed.")
                 }
                 onSizeLimitExceed={() =>
                   setDocumentError("Each file must not exceed 10 MB.")
                 }
               />
               {documentError && <FieldError>{documentError}</FieldError>}
               <FileUpload.Root>
                 <FileUpload.List>
                   {documents.map((file, index) => (
                     <FileUpload.ListItemProgressBar
                       key={`upload-${file.name}-${file.size}-${file.lastModified}`}
                       name={file.name}
                       size={file.size}
                        progress={100}
                        type={file.name.split(".").pop() as "pdf" | "jpg" | "png" | undefined}
                        className="border! border-blue-500! bg-blue-500! text-white! ring-blue-500! [&_p]:text-white! [&_svg]:text-white! [&_hr]:bg-white/50! [&_button]:text-white!"
                        onDelete={() => removeDocument(index)}
                     />
                   ))}
                 </FileUpload.List>
               </FileUpload.Root>

              {mutation.isError && Object.keys(errors).length === 0 && (
                <p className="text-sm text-red-700">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : "Submission failed."}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-3 border-t px-4 py-6 sm:px-6">
              <Link
                className="mr-auto text-blue-600 hover:text-blue-800"
                to="/"
              >
                Cancel
              </Link>
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={reset}
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-blue-600 font-semibold text-white hover:bg-blue-700"
              >
                {mutation.isPending ? "Submitting…" : "Submit Request"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </main>
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
    <h2 className="flex items-center gap-3 text-xl font-semibold text-blue-900">
      {icon}
      {children}
    </h2>
  );
}
function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Field>
      <FieldLabel className="mb-2 font-medium text-slate-700">
        {label}
      </FieldLabel>
      {children}
      {error}
    </Field>
  );
}
function OptionCombobox({
  value,
  items,
  placeholder,
  onValueChange,
}: {
  value: string;
  items: Array<{ value: string; label: string }>;
  placeholder: string;
  onValueChange: (value: string) => void;
}) {
  const selected = items.find((item) => item.value === value);
  return (
    <Combobox
      items={items}
      value={selected?.label ?? ""}
      onValueChange={(label) =>
        onValueChange(items.find((item) => item.label === label)?.value ?? "")
      }
    >
      <ComboboxInput
        className={`${enlarge} w-full focus-within:border-blue-600! focus-within:ring-2! focus-within:ring-blue-600/30! data-open:border-blue-600! data-open:ring-2! data-open:ring-blue-600/30!`}
        placeholder={placeholder}
        aria-label={placeholder}
        showClear={Boolean(value)}
      />
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.value} value={item.label}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
