import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Mail, Printer, RefreshCw } from "lucide-react";
import { useState } from "react";
import { ApiError, apiUrl } from "../../../api/client";
import { assessmentStatementUrl, emailAssessmentStatement, getAssessment, updateAssessmentStatus, type AssessmentStatus } from "./assessmentApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statuses: { value: AssessmentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "mailed", label: "Mailed" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
];
function formatDate(value: string) { return new Date(value).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "2-digit" }); }
function statusVariant(status: AssessmentStatus | null) { return status === "completed" ? "success" : status === "rejected" ? "destructive" : status === "pending" ? "warning" : "info"; }
function Detail({ label, value }: { label: string; value?: string | null }) { return <div className="flex min-h-16 items-center justify-between gap-4 border-b border-border/70 py-3 last:border-b-0"><span className="text-sm font-semibold text-slate-700">{label}</span><p className="text-right text-base font-medium text-slate-900">{value || "—"}</p></div>; }

export function AssessmentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [emailOpen, setEmailOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [note, setNote] = useState("");
  const assessmentQuery = useQuery({ queryKey: ["assessment", id], queryFn: ({ signal }) => getAssessment(id ?? "", signal), enabled: Boolean(id) });
  const statusMutation = useMutation({ mutationFn: (status: AssessmentStatus) => updateAssessmentStatus(id ?? "", status), onSuccess: () => client.invalidateQueries({ queryKey: ["assessment", id] }) });
  const emailMutation = useMutation({ mutationFn: () => emailAssessmentStatement(id ?? "", { subject, recipient_name: recipientName, note }), onSuccess: () => { setEmailOpen(false); void client.invalidateQueries({ queryKey: ["assessment", id] }); } });
  if (assessmentQuery.isPending) return <div className="p-6 text-muted-foreground">Loading assessment...</div>;
  if (assessmentQuery.isError) return <Card className="border-destructive/30 bg-destructive/5 p-6"><h1 className="text-xl font-bold text-destructive">Unable to load assessment</h1><p className="mt-2 text-sm">{assessmentQuery.error instanceof ApiError ? assessmentQuery.error.message : "Assessment loading failed."}</p><Button className="mt-4" variant="outline" onClick={() => void assessmentQuery.refetch()}><RefreshCw /> Try again</Button></Card>;
  const assessment = assessmentQuery.data.data;
  const displayName = [assessment.first_name, assessment.middle_name, assessment.last_name].filter(Boolean).join(" ");
  const openEmail = () => { setSubject(`Statement of Account - ${assessment.reference_number}`); setRecipientName(`${assessment.first_name} ${assessment.last_name}`); setNote(""); setEmailOpen(true); };
  return <>
    <div className="min-h-screen w-full min-w-0 space-y-4 bg-page-background">
      <Card className="rounded-2xl border border-border/70 bg-card px-2! py-2! shadow-sm"><CardHeader className="flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:justify-between"><CardTitle className="bg-[#3399FF] bg-clip-text font-['Poppins'] text-2xl! font-black tracking-tight text-transparent sm:text-4xl">Assessment: {assessment.reference_number}</CardTitle><div className="flex flex-wrap items-center gap-2"><Select value={assessment.status ?? "pending"} onValueChange={(value) => statusMutation.mutate(value as AssessmentStatus)} disabled={statusMutation.isPending}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{statuses.map((status) => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}</SelectContent></Select><Link to="/staff/assessments" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"><ArrowLeft /> Back</Link></div></CardHeader></Card>
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2"><Card className="h-full rounded-2xl border border-border/70 bg-card shadow-sm"><CardContent className="p-4 sm:p-6"><h2 className="mb-4 text-sm font-bold tracking-wider text-primary uppercase">Student Information</h2><div className="rounded-xl border border-slate-100 px-4"><Detail label="Full Name" value={displayName} /><Detail label="Student ID" value={assessment.student_id} /><Detail label="Email" value={assessment.email} /><Detail label="Contact Number" value={assessment.contact_num} /><Detail label="Address" value={assessment.address} /></div></CardContent></Card><Card className="h-full rounded-2xl border border-border/70 bg-card shadow-sm"><CardContent className="p-4 sm:p-6"><h2 className="mb-4 text-sm font-bold tracking-wider text-primary uppercase">Course & Academic Information Requested</h2><div className="rounded-xl border border-slate-100 px-4"><Detail label="Course Code" value={assessment.course?.course_code} /><Detail label="Course Description" value={assessment.course?.course_desc} /><Detail label="Enrolled Under" value={assessment.enrolled_under} /><Detail label="Semester" value={assessment.semester} /><Detail label="SY Last Attended | SY Requested" value={assessment.sy_last_attended} /><Detail label="Submitted" value={formatDate(assessment.created_at)} /><Detail label="Status" value={assessment.status ? statuses.find((item) => item.value === assessment.status)?.label : "Pending"} /></div></CardContent></Card></div>
      <Card className="rounded-2xl border border-border bg-card shadow-sm"><CardHeader><CardTitle>Statement of Account</CardTitle><CardDescription>Generate or email the student statement.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-2"><Button variant="outline" onClick={openEmail} disabled={emailMutation.isPending}><Mail /> Email Statement</Button><Button onClick={() => window.open(apiUrl(assessmentStatementUrl(assessment.id)), "_blank", "noopener,noreferrer")}><Printer /> Print Statement</Button><Badge variant={statusVariant(assessment.status)}>{assessment.status ? statuses.find((item) => item.value === assessment.status)?.label : "Pending"}</Badge></CardContent></Card>
    </div>
    <Dialog open={emailOpen} onOpenChange={setEmailOpen}><DialogContent><DialogHeader><DialogTitle>Email Statement of Account</DialogTitle><DialogDescription>Review the email details before sending the statement.</DialogDescription></DialogHeader><div className="space-y-4"><Input value={assessment.email} disabled /><Input placeholder="Recipient name" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} /><Input placeholder="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} /><Textarea placeholder="Additional note (optional)" value={note} onChange={(event) => setNote(event.target.value)} rows={4} /></div><DialogFooter><Button variant="outline" onClick={() => setEmailOpen(false)}>Cancel</Button><Button onClick={() => emailMutation.mutate()} disabled={emailMutation.isPending}>{emailMutation.isPending ? "Sending..." : "Send Email"}</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
