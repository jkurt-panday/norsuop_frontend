import { useState, type FormEvent } from 'react'
import { Mail, University, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../../../api/client'
import { setExpiringLocalStorage } from '../../../lib/expiring-local-storage'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Field, FieldError, FieldLabel, Input, Separator } from '../../../components/ui'
import { useSubmitAssessment } from './mutations'
import { useAssessmentOptions } from './queries'

const SCHOOL_YEAR_OPTIONS = Array.from({ length: 27 }, (_, index) => {
  const currentYear = new Date().getFullYear()
  const startYear = (new Date().getMonth() >= 5 ? currentYear : currentYear - 1) - index
  return `${startYear}-${startYear + 1}`
})

const initialValues = { email: '', contact_num: '', first_name: '', middle_name: '', last_name: '', student_id: '', address: '', enrolled_under: 'Undergraduate', sy_last_attended: '', semester: 'First Semester', course_id: '' }

export function AssessmentPage() {
  const navigate = useNavigate()
  const options = useAssessmentOptions()
  const mutation = useSubmitAssessment()
  const [values, setValues] = useState(initialValues)

  if (options.isPending) return <main className="mx-auto mt-16 max-w-3xl rounded-2xl bg-white p-8 text-center shadow-xl">Loading assessment options…</main>
  if (options.isError) return <main className="mx-auto mt-16 max-w-3xl rounded-2xl bg-white p-8 text-center shadow-xl"><h1 className="text-2xl font-bold text-blue-900">Unable to load assessment form</h1><p className="mt-2 text-slate-600">{options.error.message}</p><button type="button" className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white" onClick={() => void options.refetch()}>Try again</button></main>

  const errors = mutation.error instanceof ApiError ? mutation.error.errors : {}
  function update(key: keyof typeof initialValues, value: string) { setValues((current) => ({ ...current, [key]: value })) }
  function updateDigits(key: 'contact_num' | 'student_id', value: string) { update(key, value.replace(/\D/g, '').slice(0, key === 'contact_num' ? 11 : 9)) }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setExpiringLocalStorage('assessment-form-prefill', values)
    mutation.mutate(values, { onSuccess: (response) => navigate(`/assessment/result?reference=${encodeURIComponent(response.data.reference_number)}&token=${encodeURIComponent(response.data.access_token)}`) })
  }
  function reset() { setValues(initialValues); mutation.reset() }
  function error(key: string) { return errors[key]?.map((message) => <FieldError key={message}>{message}</FieldError>) }

  return <main className="min-h-screen bg-gradient-to-b from-blue-500 via-slate-200 to-white px-4 py-8 sm:px-6 sm:py-12">
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 rounded-2xl border border-blue-100 bg-white px-6 py-8 text-center shadow-md sm:px-8">
        <img src="/finance_logo1.png" alt="NORSU Logo" width={600} height={114} className="mx-auto mb-6 w-full max-w-2xl" />
        <h1 className="text-3xl font-bold tracking-tight text-blue-900 sm:text-4xl">Assessment Form - Main Campus 1</h1>
        <p className="mt-3 text-base text-slate-600">For Undergraduate (not covered under RA 10931-FHE), Graduate School and School of Law students only</p>
      </div>
      <form noValidate onSubmit={submit}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-3"><Mail className="h-5 w-5 text-blue-600" />Contact Information</CardTitle><CardDescription>Fill out the details below</CardDescription></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field><FieldLabel htmlFor="assessment-email">Email Address</FieldLabel><Input id="assessment-email" type="email" placeholder="jondoe@mail.com" value={values.email} onChange={(event) => update('email', event.target.value)} aria-invalid={Boolean(errors.email)} />{error('email')}</Field>
              <Field><FieldLabel htmlFor="assessment-contact">Contact Number</FieldLabel><Input id="assessment-contact" type="tel" inputMode="numeric" placeholder="0912 333 4444" maxLength={11} value={values.contact_num} onChange={(event) => updateDigits('contact_num', event.target.value)} aria-invalid={Boolean(errors.contact_num || (values.contact_num.length > 0 && values.contact_num.length !== 11))} />{error('contact_num')}{values.contact_num.length > 0 && values.contact_num.length !== 11 && <FieldError>Contact number must contain exactly 11 digits.</FieldError>}</Field>
            </div>
            <Separator />
            <CardTitle className="flex items-center gap-3"><User className="h-5 w-5 text-blue-600" />Identity Details</CardTitle>
            <div className="grid gap-4 sm:grid-cols-3">
              {([['first_name', 'First Name', 'Juan'], ['middle_name', 'Middle Name', 'Carlos'], ['last_name', 'Last Name', 'Dela Cruz']] as const).map(([key, label, placeholder]) => <Field key={key}><FieldLabel htmlFor={`assessment-${key}`}>{label}</FieldLabel><Input id={`assessment-${key}`} placeholder={placeholder} value={values[key]} onChange={(event) => update(key, event.target.value)} aria-invalid={Boolean(errors[key])} />{error(key)}</Field>)}
            </div>
            <div className="grid gap-4 sm:grid-cols-2"><Field><FieldLabel htmlFor="assessment-student-id">Student ID</FieldLabel><Input id="assessment-student-id" inputMode="numeric" placeholder="202300000" maxLength={9} value={values.student_id} onChange={(event) => updateDigits('student_id', event.target.value)} aria-invalid={Boolean(errors.student_id)} />{error('student_id')}</Field><Field><FieldLabel htmlFor="assessment-course">Course</FieldLabel><select id="assessment-course" required className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base" value={values.course_id} onChange={(event) => update('course_id', event.target.value)} aria-invalid={Boolean(errors.course_id)}><option value="">Select course</option>{options.data.data.courses.map((course) => <option key={course.id} value={course.id}>{course.course_code} — {course.course_desc}</option>)}</select>{error('course_id')}</Field></div>
            <Field><FieldLabel htmlFor="assessment-address">Address</FieldLabel><Input id="assessment-address" placeholder="Kagawasan Ave. Dumaguete City" value={values.address} onChange={(event) => update('address', event.target.value)} aria-invalid={Boolean(errors.address)} />{error('address')}</Field>
            <Separator />
            <CardTitle className="flex items-center gap-3"><University className="h-5 w-5 text-blue-600" />Academic Details</CardTitle>
            <FieldLabel>Enrolled Under</FieldLabel><div className="grid gap-3 sm:grid-cols-3">{['Undergraduate', 'Graduate', 'School of Law'].map((value) => <label key={value} className="flex cursor-pointer items-center justify-between rounded-xl border border-blue-100 p-4"><span className="font-medium text-slate-700">{value}</span><input type="radio" name="enrolled_under" value={value} checked={values.enrolled_under === value} onChange={(event) => update('enrolled_under', event.target.value)} /></label>)}</div>{error('enrolled_under')}
            <FieldLabel htmlFor="assessment-semester">Semester</FieldLabel><select id="assessment-semester" required className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base" value={values.semester} onChange={(event) => update('semester', event.target.value)}>{['First Semester', 'Second Semester', 'Summer'].map((value) => <option key={value}>{value}</option>)}</select>
            <Field><FieldLabel htmlFor="assessment-school-year">School-Year last attended | SY Request</FieldLabel><select id="assessment-school-year" required className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base" value={values.sy_last_attended} onChange={(event) => update('sy_last_attended', event.target.value)}><option value="">Select School Year</option>{SCHOOL_YEAR_OPTIONS.map((value) => <option key={value}>{value}</option>)}</select>{error('sy_last_attended')}</Field>
            {mutation.isError && Object.keys(errors).length === 0 && <FieldError>{mutation.error instanceof Error ? mutation.error.message : 'Submission failed.'}</FieldError>}
          </CardContent>
          <CardFooter><Link className="mr-auto text-blue-600" to="/">Cancel</Link><button type="button" className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700" onClick={reset} disabled={mutation.isPending}>Reset</button><button type="submit" className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-60" disabled={mutation.isPending}>{mutation.isPending ? 'Submitting…' : 'Submit Assessment'}</button></CardFooter>
        </Card>
      </form>
    </div>
  </main>
}
