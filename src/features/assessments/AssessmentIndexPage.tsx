import { useState, useTransition } from "react";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Printer,
  Mail,
  AlertCircle,
  CheckCircle2,
  Filter,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type AssessmentFilterParams,
  type AssessmentItem,
  type AssessmentStatus,
  getAssessmentPrintSoaUrl,
} from "./api";
import {
  useDeleteAssessment,
  useEmailAssessmentSoa,
  useUpdateAssessmentStatus,
} from "./mutations";
import { useAssessments } from "./queries";

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-800/40",
  mailed:
    "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:border dark:border-blue-800/40",
  rejected:
    "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 dark:border dark:border-rose-800/40",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/40",
};

const ENROLLED_UNDER_CLASSES: Record<string, string> = {
  Undergraduate:
    "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/40",
  Graduate:
    "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/40",
  "School of Law":
    "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/40",
};

const STATUS_OPTIONS: { value: AssessmentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "mailed", label: "Mailed" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
];

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AssessmentIndexPage() {
  const [, startTransition] = useTransition();

  const [filters, setFilters] = useState<AssessmentFilterParams>({
    page: 1,
    per_page: 10,
    search: "",
    status: "all",
    enrolled_under: "all",
    semester: "all",
    date_from: "",
    date_to: "",
  });

  const [showFilters, setShowFilters] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Status edit modal state
  const [editingAssessment, setEditingAssessment] = useState<AssessmentItem | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AssessmentStatus>("pending");

  // Email modal state
  const [emailingAssessment, setEmailingAssessment] = useState<AssessmentItem | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailRecipientName, setEmailRecipientName] = useState("");
  const [emailNote, setEmailNote] = useState("");

  // Delete confirm state
  const [deletingAssessment, setDeletingAssessment] = useState<AssessmentItem | null>(null);

  const query = useAssessments(filters);
  const updateStatusMutation = useUpdateAssessmentStatus();
  const deleteMutation = useDeleteAssessment();
  const emailMutation = useEmailAssessmentSoa();

  const handleSearchChange = (value: string) => {
    startTransition(() => {
      setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    });
  };

  const handleFilterChange = (key: keyof AssessmentFilterParams, value: string) => {
    startTransition(() => {
      setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    });
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      per_page: 10,
      search: "",
      status: "all",
      enrolled_under: "all",
      semester: "all",
      date_from: "",
      date_to: "",
    });
  };

  const openStatusModal = (item: AssessmentItem) => {
    setEditingAssessment(item);
    setSelectedStatus(item.status ?? "pending");
  };

  const handleSaveStatus = async () => {
    if (!editingAssessment) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: editingAssessment.id,
        status: selectedStatus,
      });
      setSuccessBanner(`Assessment ${editingAssessment.reference_number} status updated to ${selectedStatus}.`);
      setEditingAssessment(null);
    } catch {
      setErrorBanner("Failed to update status. Please try again.");
    }
  };

  const openEmailModal = (item: AssessmentItem) => {
    setEmailingAssessment(item);
    setEmailSubject(`Statement of Account - ${item.reference_number}`);
    setEmailRecipientName(`${item.first_name} ${item.last_name}`.trim());
    setEmailNote("");
  };

  const handleSendEmail = async () => {
    if (!emailingAssessment) return;
    try {
      await emailMutation.mutateAsync({
        id: emailingAssessment.id,
        payload: {
          subject: emailSubject,
          recipient_name: emailRecipientName,
          note: emailNote,
        },
      });
      setSuccessBanner(`Statement of Account emailed to ${emailingAssessment.email}.`);
      setEmailingAssessment(null);
    } catch {
      setErrorBanner("Failed to send email. Please check network/SMTP configuration.");
    }
  };

  const handleDelete = async () => {
    if (!deletingAssessment) return;
    try {
      await deleteMutation.mutateAsync(deletingAssessment.id);
      setSuccessBanner(`Assessment ${deletingAssessment.reference_number} deleted.`);
      setDeletingAssessment(null);
    } catch {
      setErrorBanner("Failed to delete assessment.");
    }
  };

  const assessments = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      {/* Header Banner */}
      <Card className="rounded-2xl bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <div>
            <CardTitle className="font-['Poppins'] text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              Student Assessments
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage and review submitted student assessment requests and Statement of Accounts.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
            <span>{query.isFetching ? "Reloading..." : "Reload"}</span>
          </Button>
        </CardHeader>
      </Card>

      {/* Alerts */}
      {successBanner && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium">{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorBanner && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-destructive hover:opacity-80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Controls: Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reference, student name, or email..."
            value={filters.search ?? ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {(filters.status !== "all" ||
              filters.enrolled_under !== "all" ||
              filters.semester !== "all" ||
              filters.date_from ||
              filters.date_to) && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
        </div>
      </div>

      {/* Filter Drawer / Panel */}
      {showFilters && (
        <Card className="p-4 border-dashed">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={filters.status ?? "all"}
                onValueChange={(val) => handleFilterChange("status", val)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="mailed">Mailed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Enrolled Under</Label>
              <Select
                value={filters.enrolled_under ?? "all"}
                onValueChange={(val) => handleFilterChange("enrolled_under", val)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="All Enrollments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                  <SelectItem value="Graduate">Graduate</SelectItem>
                  <SelectItem value="School of Law">School of Law</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Semester</Label>
              <Select
                value={filters.semester ?? "all"}
                onValueChange={(val) => handleFilterChange("semester", val)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="All Semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  <SelectItem value="First Semester">First Semester</SelectItem>
                  <SelectItem value="Second Semester">Second Semester</SelectItem>
                  <SelectItem value="Summer">Summer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Date From</Label>
              <Input
                type="date"
                value={filters.date_from ?? ""}
                onChange={(e) => handleFilterChange("date_from", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Date To</Label>
              <Input
                type="date"
                value={filters.date_to ?? ""}
                onChange={(e) => handleFilterChange("date_to", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs"
            >
              Reset Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Main Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference No.</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Enrolled Under</TableHead>
                <TableHead>SY Last Attended</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isPending ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : assessments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-36 text-center text-muted-foreground">
                    No assessment records found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                assessments.map((item) => {
                  const fullName = [item.first_name, item.middle_name ? `${item.middle_name.charAt(0)}.` : "", item.last_name]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm font-semibold text-primary">
                        {item.reference_number}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{fullName}</div>
                        <div className="text-xs text-muted-foreground">{item.email}</div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 px-2.5 py-0.5 text-xs font-semibold">
                          {item.course?.course_code ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={ENROLLED_UNDER_CLASSES[item.enrolled_under] ?? "bg-slate-100 text-slate-700"}>
                          {item.enrolled_under}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.sy_last_attended}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.semester}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(item.created_at)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={
                            STATUS_BADGE_CLASSES[item.status ?? "pending"] ??
                            STATUS_BADGE_CLASSES.pending
                          }
                        >
                          {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Print SOA */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            title="Print Statement of Account"
                            onClick={() => window.open(getAssessmentPrintSoaUrl(item.id), "_blank")}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>

                          {/* Email SOA */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            title="Email Statement of Account"
                            onClick={() => openEmailModal(item)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>

                          {/* Edit Status */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            title="Edit Status"
                            onClick={() => openStatusModal(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          {/* Delete */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            title="Delete"
                            onClick={() => setDeletingAssessment(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Footer */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Showing Page <span className="font-medium text-foreground">{meta.current_page}</span> of{" "}
            <span className="font-medium text-foreground">{meta.last_page}</span> ({meta.total} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.current_page <= 1}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: Math.max(1, (prev.page ?? 1) - 1),
                }))
              }
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.current_page >= meta.last_page}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: (prev.page ?? 1) + 1,
                }))
              }
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      <Dialog open={Boolean(editingAssessment)} onOpenChange={(open) => !open && setEditingAssessment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Assessment Status</DialogTitle>
            <DialogDescription>
              Change status for request{" "}
              <span className="font-mono font-semibold text-primary">
                {editingAssessment?.reference_number}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(val) => setSelectedStatus(val as AssessmentStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAssessment(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStatus} disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? "Saving..." : "Save Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email SOA Modal */}
      <Dialog open={Boolean(emailingAssessment)} onOpenChange={(open) => !open && setEmailingAssessment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Email Statement of Account</DialogTitle>
            <DialogDescription>
              Send PDF Statement of Account to{" "}
              <span className="font-medium text-foreground">{emailingAssessment?.email}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Recipient Name</Label>
              <Input
                value={emailRecipientName}
                onChange={(e) => setEmailRecipientName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1">
              <Label>Subject Line</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email Subject"
              />
            </div>
            <div className="space-y-1">
              <Label>Note / Instructions (Optional)</Label>
              <Textarea
                rows={3}
                value={emailNote}
                onChange={(e) => setEmailNote(e.target.value)}
                placeholder="Add any specific instructions for the student..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailingAssessment(null)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={emailMutation.isPending}>
              {emailMutation.isPending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deletingAssessment)} onOpenChange={(open) => !open && setDeletingAssessment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assessment Record?</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete assessment record{" "}
              <span className="font-mono font-semibold text-destructive">
                {deletingAssessment?.reference_number}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingAssessment(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
