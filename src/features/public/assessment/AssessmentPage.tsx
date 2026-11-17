import { useState, type SubmitEvent } from "react";
import { Mail, University, User } from "lucide-react";
import { Link, useNavigate } from "react-router";
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
const inputClass =
  "h-12 rounded-xl border-slate-300 bg-white px-4 text-base shadow-sm transition-all duration-200 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/30";
const comboClass =
  "border-slate-300 bg-white text-base shadow-sm transition-all duration-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/30";
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
  if (options.isPending)
    return (
      <main className="mx-auto mt-16 max-w-3xl rounded-2xl bg-white p-8 text-center shadow-xl">
        Loading assessment options…
      </main>
    );
  if (options.isError)
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
  const errors =
    mutation.error instanceof ApiError ? mutation.error.errors : {};
  const update = (key: keyof FormValues, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  const error = (key: string) =>
    errors[key]?.map((message) => (
      <FieldError key={message}>{message}</FieldError>
    ));
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setExpiringLocalStorage("assessment-form-prefill", values);
    mutation.mutate(values, {
      onSuccess: (response) =>
        navigate(
          `/assessment/result?reference=${encodeURIComponent(response.data.reference_number)}&token=${encodeURIComponent(response.data.access_token)}`,
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
                        <FieldLabel
                          htmlFor="assessment-email"
                          className="mb-2 font-medium text-slate-700"
                        >
                          Email Address
                        </FieldLabel>
                        <Input
                          className={inputClass}
                          id="assessment-email"
                          type="email"
                          aria-invalid={Boolean(errors.email)}
                          placeholder="jondoe@mail.com"
                          value={values.email}
                          onChange={(event) =>
                            update("email", event.target.value)
                          }
                        />
                        {error("email")}
                      </Field>
                    </div>
                    <div className="space-y-2">
                      <Field>
                        <FieldLabel
                          htmlFor="assessment-contact"
                          className="mb-2 font-medium text-slate-700"
                        >
                          Contact Number
                        </FieldLabel>
                        <Input
                          className={inputClass}
                          id="assessment-contact"
                          type="tel"
                          inputMode="numeric"
                          aria-invalid={Boolean(
                            errors.contact_num || contactInvalid,
                          )}
                          placeholder="0912 333 4444"
                          maxLength={13}
                          value={values.contact_num.replace(
                            /^(\d{0,4})(\d{0,3})(\d{0,4}).*/,
                            (_, a, b, c) => [a, b, c].filter(Boolean).join(" "),
                          )}
                          onChange={(event) =>
                            update(
                              "contact_num",
                              event.target.value
                                .replace(/\D/g, "")
                                .slice(0, 11),
                            )
                          }
                        />
                        {error("contact_num")}
                        {contactInvalid && (
                          <FieldError>
                            Contact number must contain exactly 11 digits.
                          </FieldError>
                        )}
                      </Field>
                    </div>
                  </div>
                </div>
                <Separator className="bg-blue-100" />
                <h2 className="flex items-center gap-3 text-xl font-semibold text-blue-900">
                  <User className="h-5 w-5 text-blue-600" />
                  Identity Details
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {(
                      [
                        ["first_name", "First Name", "Juan"],
                        ["middle_name", "Middle Name", "Carlos"],
                        ["last_name", "Last Name", "Dela Cruz"],
                      ] as const
                    ).map(([key, label, placeholder]) => (
                      <div className="space-y-2" key={key}>
                        <FieldLabel
                          htmlFor={`assessment-${key}`}
                          className="mb-2 font-medium text-slate-700"
                        >
                          {label}
                        </FieldLabel>
                        <Input
                          className={inputClass}
                          id={`assessment-${key}`}
                          placeholder={placeholder}
                          value={values[key]}
                          onChange={(event) => update(key, event.target.value)}
                          aria-invalid={Boolean(errors[key])}
                        />
                        {error(key)}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel
                        htmlFor="assessment-student-id"
                        className="mb-2 font-medium text-slate-700"
                      >
                        Student ID
                      </FieldLabel>
                      <Input
                        className={`${inputClass} [appearance:textfield]`}
                        id="assessment-student-id"
                        inputMode="numeric"
                        maxLength={9}
                        placeholder="202300000"
                        value={values.student_id}
                        onChange={(event) =>
                          update(
                            "student_id",
                            event.target.value.replace(/\D/g, "").slice(0, 9),
                          )
                        }
                        aria-invalid={Boolean(errors.student_id)}
                      />
                      {error("student_id")}
                    </div>
                    <div className="space-y-2">
                      <FieldLabel
                        htmlFor="assessment-course"
                        className="mb-2 font-medium text-slate-700"
                      >
                        Course
                      </FieldLabel>
                      <Combobox
                        items={courses}
                        value={
                          courses.find(
                            (course) => String(course.id) === values.course_id,
                          )?.course_desc ?? ""
                        }
                        onValueChange={(value) =>
                          update(
                            "course_id",
                            String(
                              courses.find(
                                (course) => course.course_desc === value,
                              )?.id ?? "",
                            ),
                          )
                        }
                      >
                        <ComboboxInput
                          id="assessment-course"
                          placeholder="Select course"
                          aria-label="Course"
                          aria-invalid={Boolean(errors.course_id)}
                          className={`${comboClass} ${inputClass}`}
                          showClear={Boolean(values.course_id)}
                        />
                        <ComboboxContent>
                          <ComboboxEmpty>No items found.</ComboboxEmpty>
                          <ComboboxList>
                            {(course) => (
                              <ComboboxItem
                                key={course.id}
                                value={course.course_desc}
                              >
                                {course.course_desc}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                      {error("course_id")}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <FieldLabel
                        htmlFor="assessment-address"
                        className="mb-2 font-medium text-slate-700"
                      >
                        Address
                      </FieldLabel>
                      <Input
                        className={inputClass}
                        id="assessment-address"
                        placeholder="Kagawasan Ave. Dumaguete City"
                        value={values.address}
                        onChange={(event) =>
                          update("address", event.target.value)
                        }
                        aria-invalid={Boolean(errors.address)}
                      />
                      {error("address")}
                    </div>
                  </div>
                </div>
                <Separator className="bg-blue-100" />
                <h2 className="flex items-center gap-3 text-xl font-semibold text-blue-900">
                  <University className="h-5 w-5 text-blue-600" />
                  Academic Details
                </h2>
                <section>
                  <h3 className="mb-2 text-lg font-medium text-blue-900">
                    Enrolled Under:
                  </h3>
                  <RadioGroup
                    value={values.enrolled_under}
                    onValueChange={(value) => update("enrolled_under", value)}
                    className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3"
                  >
                    <FieldLabel htmlFor="enrolled-undergraduate">
                      <Field
                        orientation="horizontal"
                        className="h-full cursor-pointer justify-between"
                      >
                        <FieldContent>
                          <FieldTitle>Undergraduate</FieldTitle>
                          <FieldDescription>
                            (not covered under RA 10931 - Free Higher Education)
                          </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem
                          value="Undergraduate"
                          id="enrolled-undergraduate"
                        />
                      </Field>
                    </FieldLabel>
                    <FieldLabel htmlFor="enrolled-graduate">
                      <Field
                        orientation="horizontal"
                        className="h-full cursor-pointer justify-between"
                      >
                        <FieldContent>
                          <FieldTitle>Graduate</FieldTitle>
                          <FieldDescription>
                            For master's and doctoral degree students.
                          </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem
                          value="Graduate"
                          id="enrolled-graduate"
                        />
                      </Field>
                    </FieldLabel>
                    <FieldLabel htmlFor="enrolled-law">
                      <Field
                        orientation="horizontal"
                        className="h-full cursor-pointer justify-between"
                      >
                        <FieldContent>
                          <FieldTitle>School of Law</FieldTitle>
                          <FieldDescription>
                            For Juris Doctor and legal studies students.
                          </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem
                          value="School of Law"
                          id="enrolled-law"
                        />
                      </Field>
                    </FieldLabel>
                  </RadioGroup>
                  {error("enrolled_under")}
                </section>
                <section>
                  <h3 className="mb-2 text-lg font-medium text-blue-900">
                    Semester:
                  </h3>
                  <RadioGroup
                    value={values.semester}
                    onValueChange={(value) => update("semester", value)}
                    className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3"
                  >
                    <FieldLabel htmlFor="sem-first">
                      <Field
                        orientation="horizontal"
                        className="h-full cursor-pointer justify-between"
                      >
                        <FieldContent>
                          <FieldTitle>First Semester</FieldTitle>
                        </FieldContent>
                        <RadioGroupItem value="First Semester" id="sem-first" />
                      </Field>
                    </FieldLabel>
                    <FieldLabel htmlFor="sem-second">
                      <Field
                        orientation="horizontal"
                        className="h-full cursor-pointer justify-between"
                      >
                        <FieldContent>
                          <FieldTitle>Second Semester</FieldTitle>
                        </FieldContent>
                        <RadioGroupItem
                          value="Second Semester"
                          id="sem-second"
                        />
                      </Field>
                    </FieldLabel>
                    <FieldLabel htmlFor="sem-summer">
                      <Field
                        orientation="horizontal"
                        className="h-full cursor-pointer justify-between"
                      >
                        <FieldContent>
                          <FieldTitle>Summer</FieldTitle>
                        </FieldContent>
                        <RadioGroupItem value="Summer" id="sem-summer" />
                      </Field>
                    </FieldLabel>
                  </RadioGroup>
                  {error("semester")}
                </section>
                <section>
                  <FieldLabel
                    htmlFor="assessment-school-year"
                    className="mb-2 text-lg font-medium text-blue-900"
                  >
                    School-Year last attended | SY Request:
                  </FieldLabel>
                  <Combobox
                    items={SCHOOL_YEAR_OPTIONS}
                    value={values.sy_last_attended}
                    onValueChange={(value) =>
                      update("sy_last_attended", value ?? "")
                    }
                  >
                    <ComboboxInput
                      id="assessment-school-year"
                      placeholder="Select School Year"
                      aria-label="School Year last attended"
                      aria-invalid={Boolean(errors.sy_last_attended)}
                      className={`${comboClass} ${inputClass}`}
                      showClear={Boolean(values.sy_last_attended)}
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>No school year found.</ComboboxEmpty>
                      <ComboboxList>
                        {(year) => (
                          <ComboboxItem key={year} value={year}>
                            SY {year}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {error("sy_last_attended")}
                </section>
                {mutation.isError && Object.keys(errors).length === 0 && (
                  <FieldError>
                    {mutation.error instanceof Error
                      ? mutation.error.message
                      : "Submission failed."}
                  </FieldError>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-end gap-3 border-t border-slate-100 px-8 py-6 pt-4">
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
                  className="cursor-pointer rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="cursor-pointer rounded-xl bg-blue-600 font-semibold text-white shadow-md hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {mutation.isPending ? "Submitting…" : "Submit Assessment"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </main>
    </>
  );
}
