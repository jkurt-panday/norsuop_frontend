import { useState } from "react";
import "./opform.css";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, User, ClipboardList, FileText, GraduationCap, Plus } from "lucide-react";
import { ApiError } from "../../../api/client";
import { getExpiringLocalStorage, setExpiringLocalStorage } from "../../../lib/expiring-local-storage";
import { useSubmitOpForm } from "./mutations";
import { useOpOptions } from "./queries";

const reqTypes = ["New Request", "Re-issue Request"] as const;
const tabs = ["general", "student"] as const;
type FormTab = (typeof tabs)[number];

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
  const prefill = getExpiringLocalStorage<Record<string, string>>("submit-form-prefill");
  const navigate = useNavigate();
  const options = useOpOptions();
  const mutation = useSubmitOpForm();
  const [activeTab, setActiveTab] = useState<FormTab>("student");
  const [values, setValues] = useState({ ...initialValues, ...prefill });
  const [documents, setDocuments] = useState<File[]>([]);

  if (options.isPending) return <main className="public-form-loading">Loading Order of Payment options…</main>;
  if (options.isError) {
    return <main className="public-form-loading"><h1>Unable to load form</h1><p>{options.error.message}</p><button type="button" onClick={() => void options.refetch()}>Try again</button></main>;
  }

  const data = options.data.data;
  const errors = mutation.error instanceof ApiError ? mutation.error.errors : {};
  const isStudent = activeTab === "student";

  function update(key: string, value: string) { setValues((current) => ({ ...current, [key]: value })); }
  function updateDigits(key: string, value: string, max: number) { update(key, value.replace(/\D/g, "").slice(0, max)); }
  function changeTab(tab: FormTab) {
    setActiveTab(tab);
    if (tab === "student") update("position_or_designation", "Student");
    else setValues((current) => ({ ...current, position_or_designation: "", student_num: "", course_id: "", school_year: "", semester: "" }));
  }
  function reset() { setValues({ ...initialValues, request_type: "New Request" }); setDocuments([]); setActiveTab("student"); mutation.reset(); }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setExpiringLocalStorage("submit-form-prefill", values);
    mutation.mutate({ ...values, documents }, { onSuccess: (response) => navigate(`/public/success/${encodeURIComponent(response.data.reference_number)}?token=${encodeURIComponent(response.data.access_token)}`) });
  }
  function fieldError(key: string) { return errors[key]?.map((message) => <small className="field-error" key={message}>{message}</small>); }

  return <main className="public-form-shell">
    <div className="public-form-header">
      <div className="public-form-logo"><img src="/finance_logo1.png" alt="NORSU Logo" /></div>
      <h1>NORSU Order of Payment - MAIN CAMPUS</h1>
      <p>Fill out the form below to submit your request.</p>
    </div>
    <div className="public-form-tabs" role="tablist" aria-label="Request type">
      {tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? "active" : ""} onClick={() => changeTab(tab)}>{tab === "general" ? "General" : "Student"}</button>)}
    </div>
    <form className="public-form-card" noValidate onSubmit={submit}>
      <section className="public-form-section"><header><Mail size={20} /><div><h2>Contact Information</h2><p>Fill out the details below</p></div></header><div className="public-form-grid two">
        <FormField label="Email Address" error={fieldError("email")}><input type="email" value={values.email} onChange={(event) => update("email", event.target.value)} /></FormField>
        <FormField label="Contact Number" error={fieldError("contact_num")}><input type="tel" maxLength={11} value={values.contact_num} onChange={(event) => updateDigits("contact_num", event.target.value, 11)} /></FormField>
      </div></section>
      <section className="public-form-section"><header><User size={20} /><div><h2>Identity Details</h2></div></header><div className="public-form-grid three">
        <FormField label="First Name / Office" error={fieldError("firstname_or_office")}><input value={values.firstname_or_office} onChange={(event) => update("firstname_or_office", event.target.value)} /></FormField>
        <FormField label="Middle Name / Project" error={fieldError("middlename_or_project")}><input value={values.middlename_or_project} onChange={(event) => update("middlename_or_project", event.target.value)} /></FormField>
        <FormField label="Last Name / Agency" error={fieldError("lastname_or_agency")}><input value={values.lastname_or_agency} onChange={(event) => update("lastname_or_agency", event.target.value)} /></FormField>
      </div><div className="public-form-grid two">
        <FormField label="Office / College" error={fieldError("office_or_college")}><div className="public-form-inline-field"><select value={values.office_or_college} onChange={(event) => update("office_or_college", event.target.value)}><option value="">Select office / college</option>{data.collegeOffices.map((office) => <option key={office.id} value={office.name}>{office.name}</option>)}</select><button type="button" className="icon-button" title="Add new office / college" aria-label="Add new office / college" disabled><Plus size={18} /></button></div></FormField>
        <FormField label="Position / Designation" error={fieldError("position_or_designation")}><input disabled={isStudent} value={isStudent ? "Student" : values.position_or_designation} onChange={(event) => update("position_or_designation", event.target.value)} /></FormField>
      </div><FormField label="Address" error={fieldError("address")}><input value={values.address} onChange={(event) => update("address", event.target.value)} /></FormField></section>
      <section className="public-form-section"><header><ClipboardList size={20} /><div><h2>Payment Information</h2></div></header><div className="public-form-grid three">
        <FormField label="Request Type" error={fieldError("request_type")}><select value={values.request_type} onChange={(event) => update("request_type", event.target.value)}>{reqTypes.map((type) => <option key={type}>{type}</option>)}</select></FormField>
        <FormField label="Membership" error={fieldError("membership_id")}><select value={values.membership_id} onChange={(event) => update("membership_id", event.target.value)}><option value="">Select membership</option>{data.memberships.map((item) => <option key={item.id} value={item.id}>{item.member_desc ?? item.member_code}</option>)}</select></FormField>
        <FormField label="Payment Detail" error={fieldError("payment_detail_option_id")}><select value={values.payment_detail_option_id} onChange={(event) => update("payment_detail_option_id", event.target.value)}><option value="">Select payment detail</option>{data.paymentOptions.map((item) => <option key={item.id} value={item.id}>{item.payment_desc}</option>)}</select></FormField>
      </div><FormField label="Amount" error={fieldError("amount")}><input type="number" min="0.01" step="0.01" value={values.amount} onChange={(event) => update("amount", event.target.value)} /></FormField></section>
      {isStudent && <section className="public-form-section"><header><GraduationCap size={20} /><div><h2>Academic Details</h2></div></header><div className="public-form-grid two"><FormField label="Student Number" error={fieldError("student_num")}><input inputMode="numeric" maxLength={9} value={values.student_num} onChange={(event) => updateDigits("student_num", event.target.value, 9)} /></FormField><FormField label="Course" error={fieldError("course_id")}><select value={values.course_id} onChange={(event) => update("course_id", event.target.value)}><option value="">Select course</option>{data.courses.map((course) => <option key={course.id} value={course.id}>{course.course_code} — {course.course_desc}</option>)}</select></FormField><FormField label="School Year" error={fieldError("school_year")}><select value={values.school_year} onChange={(event) => update("school_year", event.target.value)}><option value="">Select school year</option>{SCHOOL_YEAR_OPTIONS.map((year) => <option key={year}>{year}</option>)}</select></FormField><FormField label="Semester" error={fieldError("semester")}><select value={values.semester} onChange={(event) => update("semester", event.target.value)}><option value="">Select semester</option>{["First Semester", "Second Semester", "Summer"].map((semester) => <option key={semester}>{semester}</option>)}</select></FormField></div></section>}
      <section className="public-form-section"><header><FileText size={20} /><div><h2>Supporting Documents</h2><p>Optional PDF or image files, maximum 5 files.</p></div></header><input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(event: ChangeEvent<HTMLInputElement>) => setDocuments(Array.from(event.target.files ?? []).slice(0, 5))} />{documents.length > 0 && <ul className="public-form-file-list">{documents.map((file) => <li key={`${file.name}-${file.lastModified}`}>{file.name}<span>{Math.ceil(file.size / 1024)} KB</span></li>)}</ul>}</section>
      {mutation.isError && Object.keys(errors).length === 0 && <p className="field-error">{mutation.error instanceof Error ? mutation.error.message : "Submission failed."}</p>}
      <footer className="public-form-footer"><Link to="/">Cancel</Link><button type="button" onClick={reset} disabled={mutation.isPending}>Reset</button><button className="primary" type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Submitting…" : "Submit Request"}</button></footer>
    </form>
  </main>;
}

function FormField({ label, error, children }: { label: string; error?: React.ReactNode; children: React.ReactNode }) { return <label className="public-form-field"><span>{label}</span>{children}{error}</label>; }
