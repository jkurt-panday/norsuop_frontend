import { useState, type SubmitEvent } from "react";
import { Mail, University, User } from "lucide-react";
import { useNavigate } from "react-router";
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSubmitAssessment } from "./mutations";
import { useAssessmentOptions } from "./queries";

const SCHOOL_YEAR_OPTIONS = Array.from({ length: 27 }, (_, index) => {
  const currentYear = new Date().getFullYear();
  const startYear =
    (new Date().getMonth() >= 5 ? currentYear : currentYear - 1) - index;
  return `${startYear}-${startYear + 1}`;
});

const enlarge =
  "h-12 rounded-xl border-border bg-white px-4 text-base shadow-sm transition-all duration-200";

const initialValues = {
  email: "",
  contact_num: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  student_id: "",
  address: "",
  enrolled_under: "Undergraduate",
  sy_last_attended: "",
  semester: "First Semester",
  course_id: "",
};
type FormValues = typeof initialValues;

export function AssessmentPage() {
  const navigate = useNavigate();
  const options = useAssessmentOptions();
  const mutation = useSubmitAssessment();
  const [values, setValues] = useState<FormValues>(initialValues);

  if (options.isPending) {
    return (
      <main className="mx-auto mt-16 max-w-3xl rounded-2xl bg-white p-8 text-center shadow-xl">
        Loading assessment options…
      </main>
    );
  }

  if (options.isError) {
    return (
      <main className="mx-auto mt-16 max-w-3xl rounded-2xl bg-white p-8 text-center shadow-xl">
        <h1 className="text-2xl font-bold text-blue-900">
          Unable to load assessment form
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
  }

  const errors =
    mutation.error instanceof ApiError ? mutation.error.errors : {};
  const update = (key: keyof FormValues, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  const error = (key: string) =>
    errors[key]?.map((message) => <FieldError key={message}>{message}</FieldError>);
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setExpiringLocalStorage("assessment-form-prefill", values);
    mutation.mutate(values, {
      onSuccess: (response) =>
        navigate(
          `/assessment/success?reference=${encodeURIComponent(response.data.reference_number)}&token=${encodeURIComponent(response.data.access_token)}`,
        ),
    });
  };
  const reset = () => {
    setValues(initialValues);
    mutation.reset();
  };
  const contactInvalid =
    values.contact_num.length > 0 && values.contact_num.length !== 11;
  const courses = options.data.data.courses;

  return (
    <>
      <title>Assessment Form</title>
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
              Assessment Form - Main Campus 1
            </h1>
            <p className="mt-3 text-base text-slate-600">
              For Undergraduate (not covered under RA 10931-FHE), Graduate
              School and School of Law students only
            </p>
          </header>

          <form noValidate onSubmit={submit}>
            <Card className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl">
              <CardHeader className="border-b border-slate-100 bg-white pb-6">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-blue-900">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Contact Information
                </CardTitle>
                <CardDescription>Fill out the details below</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Field>
                        <FieldLabel htmlFor="input-field-email" className="mb-2 font-medium text-slate-700">
                          Email Address
                        </FieldLabel>
                        <Input
                          className={`${enlarge} focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30`}
                          id="input-field-email"
                          type="email"
                          aria-invalid={Boolean(errors.email)}
                          placeholder="jondoe@mail.com"
                          value={values.email}
                          onChange={(event) => update("email", event.target.value)}
                        />
                        {error("email")}
                      </Field>
                    </div>
                    <div className="space-y-2">
                      <Field>
                        <FieldLabel htmlFor="input-field-contact" className="mb-2 font-medium text-slate-700">
                          Contact Number
                        </FieldLabel>
                        <Input
                          className={`${enlarge} focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30`}
                          id="input-field-contact"
                          type="tel"
                          inputMode="numeric"
                          aria-invalid={Boolean(errors.contact_num || contactInvalid)}
                          placeholder="0912 333 4444"
                          maxLength={13}
                          value={values.contact_num.replace(
                            /^(\d{0,4})(\d{0,3})(\d{0,4}).*/,
                            (_, a, b, c) => [a, b, c].filter(Boolean).join(" "),
                          )}
                          onChange={(event) =>
                            update(
                              "contact_num",
                              event.target.value.replace(/\D/g, "").slice(0, 11),
                            )
                          }
                        />
                        {error("contact_num")}
                        {contactInvalid && (
                          <FieldError>Contact number must contain exactly 11 digits.</FieldError>
                        )}
                      </Field>
                    </div>
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
                        ["first_name", "First Name", "Juan"],
                        ["middle_name", "Middle Name", "Carlos"],
                        ["last_name", "Last Name", "Dela Cruz"],
                      ] as const
                    ).map(([key, label, placeholder]) => (
                      <div className="space-y-2" key={key}>
                        <Field>
                          <FieldLabel htmlFor={`input-field-${key}`} className="mb-2 font-medium text-slate-700">
                            {label}
                          </FieldLabel>
                          <Input
                            className={`${enlarge} focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30`}
                            id={`input-field-${key}`}
                            type="text"
                            placeholder={placeholder}
                            value={values[key]}
                            onChange={(event) => update(key, event.target.value)}
                            aria-invalid={Boolean(errors[key])}
                          />
                          {error(key)}
                        </Field>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="input-field-studentId" className="mb-2 font-medium text-slate-700">
                        Student ID
                      </FieldLabel>
                      <Input
                        className={`${enlarge} focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                        id="input-field-studentId"
                        inputMode="numeric"
                        maxLength={9}
                        placeholder="202300000"
                        value={values.student_id}
                        onChange={(event) =>
                          update("student_id", event.target.value.replace(/\D/g, "").slice(0, 9))
                        }
                        aria-invalid={Boolean(errors.student_id)}
                      />
                      {error("student_id")}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="input-field-courses" className="mb-2 font-medium text-slate-700">
                        Course
                      </FieldLabel>
                      <Combobox
                        required
                        items={courses}
                        value={courses.find((course) => String(course.id) === values.course_id)?.course_desc ?? ""}
                        onValueChange={(value) =>
                          update("course_id", String(courses.find((course) => course.course_desc === value)?.id ?? ""))
                        }
                      >
                        <ComboboxInput
                          placeholder="Select course"
                          aria-label="Course"
                          aria-invalid={Boolean(errors.course_id)}
                          className={`border-border focus-within:border-blue-600! focus-within:ring-2! focus-within:ring-blue-600/30! data-[state=open]:border-blue-600! data-[state=open]:ring-2! data-[state=open]:ring-blue-600/30! data-open:border-blue-600! data-open:ring-2! data-open:ring-blue-600/30! ${enlarge}`}
                          showClear={Boolean(values.course_id)}
                        />
                        <ComboboxContent>
                          <ComboboxEmpty>No items found.</ComboboxEmpty>
                          <ComboboxList>
                            {(course) => (
                              <ComboboxItem key={course.id} value={course.course_desc}>
                                {course.course_desc}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                      {error("course_id")}
                    </Field>
                  </div>
                  <div className="space-y-4">
                    <Field>
                      <FieldLabel htmlFor="input-field-address" className="mb-2 font-medium text-slate-700">
                        Address
                      </FieldLabel>
                      <Input
                        className={`${enlarge} focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30`}
                        id="input-field-address"
                        type="text"
                        placeholder="Kagawasan Ave. Dumaguete City"
                        value={values.address}
                        onChange={(event) => update("address", event.target.value)}
                        aria-invalid={Boolean(errors.address)}
                      />
                      {error("address")}
                    </Field>
                  </div>
                </div>

                <Separator className="bg-blue-100" />
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-blue-900">
                  <University className="h-5 w-5 text-blue-600" />
                  Academic Details
                </CardTitle>

                <FieldLabel className="mb-2 text-lg font-medium text-primary">
                  Enrolled Under:
                </FieldLabel>
                <RadioGroup
                  value={values.enrolled_under}
                  onValueChange={(value) => update("enrolled_under", value)}
                  className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3"
                >
                  <FieldLabel htmlFor="enrolled-undergraduate">
                    <Field orientation="horizontal" className="h-full cursor-pointer justify-between">
                      <FieldContent>
                        <FieldTitle>Undergraduate</FieldTitle>
                        <FieldDescription>(not covered under RA 10931 - Free Higher Education)</FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value="Undergraduate" id="enrolled-undergraduate" />
                    </Field>
                  </FieldLabel>
                  <FieldLabel htmlFor="enrolled-graduate">
                    <Field orientation="horizontal" className="h-full cursor-pointer justify-between">
                      <FieldContent>
                        <FieldTitle>Graduate</FieldTitle>
                        <FieldDescription>For master's and doctoral degree students.</FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value="Graduate" id="enrolled-graduate" />
                    </Field>
                  </FieldLabel>
                  <FieldLabel htmlFor="enrolled-law">
                    <Field orientation="horizontal" className="h-full cursor-pointer justify-between">
                      <FieldContent>
                        <FieldTitle>School of Law</FieldTitle>
                        <FieldDescription>For Juris Doctor and legal studies students.</FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value="School of Law" id="enrolled-law" />
                    </Field>
                  </FieldLabel>
                </RadioGroup>
                {error("enrolled_under")}

                <FieldLabel className="mb-2 text-lg font-medium text-primary">
                  Semester:
                </FieldLabel>
                <RadioGroup
                  value={values.semester}
                  onValueChange={(value) => update("semester", value)}
                  className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3"
                >
                  {[
                    ["sem-first", "First Semester"],
                    ["sem-second", "Second Semester"],
                    ["sem-summer", "Summer"],
                  ].map(([id, label]) => (
                    <FieldLabel htmlFor={id} key={id}>
                      <Field orientation="horizontal" className="h-full cursor-pointer justify-between">
                        <FieldContent><FieldTitle>{label}</FieldTitle></FieldContent>
                        <RadioGroupItem value={label} id={id} />
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
                {error("semester")}

                <FieldLabel className="mb-2 text-lg font-medium text-primary">
                  School-Year last attended | SY Request:
                </FieldLabel>
                <Combobox
                  items={SCHOOL_YEAR_OPTIONS}
                  value={values.sy_last_attended}
                  onValueChange={(value) => update("sy_last_attended", value ?? "")}
                >
                  <ComboboxInput
                    placeholder="Select School Year"
                    aria-label="School Year last attended"
                    aria-invalid={Boolean(errors.sy_last_attended)}
                    className={`border-border focus-within:border-blue-600! focus-within:ring-2! focus-within:ring-blue-600/30! data-[state=open]:border-blue-600! data-[state=open]:ring-2! data-[state=open]:ring-blue-600/30! data-open:border-blue-600! data-open:ring-2! data-open:ring-blue-600/30! ${enlarge}`}
                    showClear={Boolean(values.sy_last_attended)}
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No school year found.</ComboboxEmpty>
                    <ComboboxList>
                      {(year) => <ComboboxItem key={year} value={year}>SY {year}</ComboboxItem>}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {error("sy_last_attended")}

                {mutation.isError && Object.keys(errors).length === 0 && (
                  <FieldError>
                    {mutation.error instanceof Error ? mutation.error.message : "Submission failed."}
                  </FieldError>
                )}
              </CardContent>

              <CardFooter className="flex items-center justify-end gap-3 border-t border-slate-100 px-8 py-6 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={mutation.isPending}
                  onClick={reset}
                  className="cursor-pointer rounded-xl border-border text-slate-700 hover:bg-slate-100 disabled:opacity-50"
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
                      <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : "Submit Assessment"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </main>
    </>
  );
}
