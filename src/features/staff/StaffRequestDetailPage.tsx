import { useParams, Link } from "react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Mail,
  Search,
  UserPlus,
  Download,
  Trash2,
  Edit2,
  Unlink,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { api, binary } from "../../api/client";
import {
  getStaffRequest,
  processStaffRequest,
  updateStaffProcessing,
  updateStaffDetails,
  searchOpStudents,
  linkOpStudent,
  unlinkOpStudent,
  emailOpRequest,
  getOpPdfUrl,
  type BankAccount,
  type UacsItem,
  type PaymentDetailOption,
  type AcademicTerm,
  type SupportingDocument,
  type StaffStudent,
} from "./api";
import { toast } from "sonner";

interface FormInput {
  id: number;
  reference_number: string;
  firstname_or_office: string;
  middlename_or_project: string | null;
  lastname_or_agency: string;
  office_or_college: string;
  position_or_designation: string;
  email: string;
  contact_num: string;
  address: string;
  request_type: string;
  amount: number;
  created_at: string;
  membership: { id: number; member_code: string; member_desc: string } | null;
  payment_detail_option: PaymentDetailOption | null;
  staff_input: StaffInputData | null;
  staffInput: StaffInputData | null;
  supporting_documents: SupportingDocument[];
  supportingDocuments: SupportingDocument[];
  student_num: number | null;
  submitted_student_number: string | null;
  student: StaffStudent | null;
  course: { id: number; course_code: string; course_desc: string; course_college: string } | null;
  academic_term: number | null;
}

interface StaffInputData {
  id: number;
  status: "pending" | "processed" | "paid" | "cancelled" | "unprocessed";
  ref_date: string | null;
  bank_account: BankAccount | null;
  uacs: UacsItem | null;
  reference_document: SupportingDocument | null;
  created_at: string;
  purpose: string | null;
  or_no: string | null;
  or_date: string | null;
  emailed_at: string | null;
}

interface PageData {
  data: FormInput;
  bankAccounts: BankAccount[];
  uacsList: UacsItem[];
  paymentOptions: PaymentDetailOption[];
  academicTerms: AcademicTerm[];
  courses: Array<{ id: number; course_code: string; course_desc: string; course_college: string }>;
  memberships: Array<{ id: number; member_code: string; member_desc: string }>;
}

const statusBadgeClass = (status: string) => {
  switch (status) {
    case "processed":
      return "bg-green-900/20 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    case "paid":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    case "cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    case "unprocessed":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800/30 dark:text-slate-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800/30 dark:text-slate-300";
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateOnly = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const todayIso = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return "N/A";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(2)} ${units[index]}`;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const buildEmailPreviewHtml = (
  formInput: FormInput,
  recipientName: string,
  note: string
) => {
  const noteHtml = note.trim()
    ? `<p>${escapeHtml(note).replace(/\n/g, "<br>")}</p>`
    : "";

  return `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #1e293b; margin:0; padding:24px;">
    <div style="width: 100%; background: white; padding: 32px; border-radius: 8px; border: 1px solid #e2e8f0; box-sizing: border-box;">
        <p style="margin: 0 0 16px;">Dear ${escapeHtml(recipientName || "\u2014")},</p>
        <p style="margin: 0 0 16px; line-height: 1.6;">
            Please find attached your Order of Payment
            (Reference No. <strong>${formInput.reference_number}</strong>)
            for the amount of <strong>${formatCurrency(formInput.amount)}</strong>.
        </p>
        ${noteHtml}
        <p style="margin: 16px 0 8px; line-height: 1.6;">Two copies are attached:</p>
        <ul style="margin: 0 0 16px; padding-left: 20px; line-height: 1.8;">
            <li>A5 portrait \u2014 for individual filing</li>
            <li>Legal landscape \u2014 3-up copies (Payor's / Cash Unit's / Accounting Unit's)</li>
        </ul>
        <p style="margin: 0 0 24px; line-height: 1.6;">Please present this at the Cash / Treasury Unit to complete payment.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="margin: 0; line-height: 1.6;">Regards,<br>NORSU Accounting Office</p>
    </div>
</body>
</html>`;
};

const SearchableSelect = ({
  value,
  placeholder,
  searchPlaceholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  searchPlaceholder: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) => {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? "";

  return (
    <Combobox
      items={options}
      value={selectedLabel}
      onValueChange={(label) => {
        onChange(options.find((option) => option.label === label)?.value ?? "");
      }}
    >
      <ComboboxInput
        placeholder={searchPlaceholder || placeholder}
        aria-label={placeholder}
        showClear={Boolean(value)}
        className="h-9 w-full"
      />
      <ComboboxContent>
        <ComboboxEmpty>No matches found.</ComboboxEmpty>
        <ComboboxList>
          {(option) => (
            <ComboboxItem key={option.value} value={option.label}>
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

const ReadOnlyRow = ({
  label,
  value,
  valueClass = "text-foreground",
  stacked = false,
}: {
  label: string;
  value: string | number | null;
  valueClass?: string;
  stacked?: boolean;
}) => {
  const stringValue = value == null ? "" : String(value);
  const valueContent = (
    <p className={`min-w-0 flex-1 text-sm ${valueClass} wrap-break-word whitespace-pre-wrap`}>
      {stringValue || "\u2014"}
    </p>
  );

  return stacked ? (
    <div className="border-b border-border py-2 last:border-0">
      <label className="mb-1 block text-sm font-medium text-muted-foreground">{label}</label>
      {valueContent}
    </div>
  ) : (
    <div className="flex min-w-0 items-start gap-6 border-b border-border py-2 last:border-0">
      <label className="w-40 shrink-0 text-sm font-medium text-muted-foreground">{label}</label>
      {valueContent}
    </div>
  );
};

export function StaffRequestDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["staff", "request", id],
    queryFn: ({ signal }) => getStaffRequest(id, signal),
    enabled: Number.isFinite(id),
  });

  const pageData = data as PageData | undefined;
  const formInput = pageData?.data;
  const bankAccounts = pageData?.bankAccounts ?? [];
  const uacsList = pageData?.uacsList ?? [];
  const paymentOptions = pageData?.paymentOptions ?? [];
  const courses = pageData?.courses ?? [];
  const memberships = pageData?.memberships ?? [];
  const supportingDocuments = formInput?.supporting_documents ?? formInput?.supportingDocuments ?? [];
  const rawStatus = formInput?.staff_input?.status ?? formInput?.staffInput?.status ?? "unprocessed";
  const staffInput = formInput?.staff_input ?? formInput?.staffInput;
  const isProcessedOrPaid = rawStatus === "processed" || rawStatus === "paid";

  // --- State ---
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isEditingStaffInput, setIsEditingStaffInput] = useState(false);
  const [isEditingOr, setIsEditingOr] = useState(false);
  const [isEditingPaymentInfo, setIsEditingPaymentInfo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState(false);
  const [isStudentMatchOpen, setIsStudentMatchOpen] = useState(false);
  const [isUnlinkConfirmOpen, setIsUnlinkConfirmOpen] = useState(false);
  const [studentMatchMode, setStudentMatchMode] = useState<"existing" | "create">("existing");
  const [studentSearch, setStudentSearch] = useState(formInput?.submitted_student_number ?? "");
  const [studentCandidates, setStudentCandidates] = useState<StaffStudent[]>([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [documentAction, setDocumentAction] = useState<{ id: number; type: "view" | "download" } | null>(null);

  const [emailSubject, setEmailSubject] = useState("");
  const [emailRecipientName, setEmailRecipientName] = useState("");
  const [emailNote, setEmailNote] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // --- Forms state ---
  const [detailsData, setDetailsData] = useState<{
    firstname_or_office: string;
    middlename_or_project: string;
    lastname_or_agency: string;
    office_or_college: string;
    position_or_designation: string;
    email: string;
    contact_num: string;
    address: string;
    amount: string;
    payment_detail_option_id: string;
    course_id: string;
    new_payment_option: string;
  }>({
    firstname_or_office: formInput?.firstname_or_office ?? "",
    middlename_or_project: formInput?.middlename_or_project ?? "",
    lastname_or_agency: formInput?.lastname_or_agency ?? "",
    office_or_college: formInput?.office_or_college ?? "",
    position_or_designation: formInput?.position_or_designation ?? "",
    email: formInput?.email ?? "",
    contact_num: formInput?.contact_num ?? "",
    address: formInput?.address ?? "",
    amount: String(formInput?.amount ?? ""),
    payment_detail_option_id: formInput?.payment_detail_option?.id
      ? String(formInput.payment_detail_option.id)
      : "",
    course_id: formInput?.course?.id ? String(formInput.course.id) : "",
    new_payment_option: "",
  });

  const [paymentInfoData, setPaymentInfoData] = useState<{
    membership_id: string;
    payment_detail_option_id: string;
    submission_date: string;
  }>({
    membership_id: formInput?.membership?.id ? String(formInput.membership.id) : "",
    payment_detail_option_id: formInput?.payment_detail_option?.id
      ? String(formInput.payment_detail_option.id)
      : "",
    submission_date: formInput?.created_at ? formInput.created_at.split("T")[0] : "",
  });

  // Sync form state when formInput loads
  useEffect(() => {
    if (formInput) {
      setDetailsData({
        firstname_or_office: formInput.firstname_or_office ?? "",
        middlename_or_project: formInput.middlename_or_project ?? "",
        lastname_or_agency: formInput.lastname_or_agency ?? "",
        office_or_college: formInput.office_or_college ?? "",
        position_or_designation: formInput.position_or_designation ?? "",
        email: formInput.email ?? "",
        contact_num: formInput.contact_num ?? "",
        address: formInput.address ?? "",
        amount: String(formInput.amount ?? ""),
        payment_detail_option_id: formInput.payment_detail_option?.id
          ? String(formInput.payment_detail_option.id)
          : "",
        course_id: formInput.course?.id ? String(formInput.course.id) : "",
        new_payment_option: "",
      });
    }
  }, [formInput]);

  // Sync payment info form state when formInput loads
  useEffect(() => {
    if (formInput) {
      setPaymentInfoData({
        membership_id: formInput.membership?.id ? String(formInput.membership.id) : "",
        payment_detail_option_id: formInput.payment_detail_option?.id
          ? String(formInput.payment_detail_option.id)
          : "",
        submission_date: formInput.created_at ? formInput.created_at.split("T")[0] : "",
      });
    }
  }, [formInput]);

  const [staffInputData, setStaffInputData] = useState<{
    fundcluster_id: string;
    ref_document_id: string;
    ref_date: string;
    uacs_id: string;
    status: "pending" | "processed" | "paid" | "cancelled" | "unprocessed";
    purpose: string;
  }>({
    fundcluster_id: staffInput?.bank_account ? String(staffInput.bank_account.id) : "",
    ref_document_id: staffInput?.reference_document ? String(staffInput.reference_document.id) : "",
    ref_date: staffInput?.ref_date ? staffInput.ref_date.split("T")[0] : "",
    uacs_id: staffInput?.uacs ? String(staffInput.uacs.id) : "",
    status: rawStatus,
    purpose: staffInput?.purpose ?? "",
  });

  // Sync staff input form state when staffInput loads
  useEffect(() => {
    if (staffInput) {
      setStaffInputData({
        fundcluster_id: staffInput.bank_account ? String(staffInput.bank_account.id) : "",
        ref_document_id: staffInput.reference_document ? String(staffInput.reference_document.id) : "",
        ref_date: staffInput.ref_date ? staffInput.ref_date.split("T")[0] : "",
        uacs_id: staffInput.uacs ? String(staffInput.uacs.id) : "",
        status: rawStatus,
        purpose: staffInput.purpose ?? "",
      });
    }
  }, [staffInput, rawStatus]);

  const [orData, setOrData] = useState<{
    or_no: string;
    or_date: string;
  }>({
    or_no: staffInput?.or_no ?? "",
    or_date: staffInput?.or_date ? staffInput.or_date.split("T")[0] : "",
  });

  // Sync OR form state when staffInput loads
  useEffect(() => {
    if (staffInput) {
      setOrData({
        or_no: staffInput.or_no ?? "",
        or_date: staffInput.or_date ? staffInput.or_date.split("T")[0] : "",
      });
    }
  }, [staffInput]);

  const [processData, setProcessData] = useState<{
    form_input_id: number;
    fundcluster_id: string;
    ref_document_id: string;
    ref_date: string;
    uacs_id: string;
    status: "processed" | "pending" | "paid" | "cancelled";
    purpose: string;
  }>({
    form_input_id: id,
    fundcluster_id: "",
    ref_document_id: "",
    ref_date: todayIso(),
    uacs_id: "",
    status: "processed",
    purpose: "",
  });

  // --- Mutations ---
  const processMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      processStaffRequest(id, payload),
    onSuccess: () => {
      refetch();
      setIsProcessing(false);
      toast.success('Request processed successfully.');
    },
  });

  const updateProcessingMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      updateStaffProcessing(id, payload),
    onSuccess: () => {
      refetch();
      setIsEditingStaffInput(false);
      toast.success('Processing record updated successfully.');
    },
  });

  const updateDetailsMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      updateStaffDetails(id, payload),
    onSuccess: () => {
      refetch();
      setIsEditingDetails(false);
      setIsEditingPaymentInfo(false);
      toast.success('Request details saved successfully.');
    },
    onError: (error) => {
      console.error('Update details failed:', error);
      toast.error('Failed to save changes: ' + (error as Error).message);
    },
  });

  const updateOrMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      api(`/api/v1/staff/requests/${id}/or`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      refetch();
      setIsEditingOr(false);
      toast.success('OR number updated successfully.');
    },
  });

  const searchStudentsMutation = useMutation({
    mutationFn: ({ q }: { q: string }) => searchOpStudents(q),
  });
  const { mutateAsync: searchStudentsAsync } = searchStudentsMutation;

  const linkStudentMutation = useMutation({
    mutationFn: ({ id, student_id }: { id: number; student_id: number }) =>
      linkOpStudent(id, student_id),
    onSuccess: () => {
      refetch();
      setIsStudentMatchOpen(false);
      toast.success('Student linked successfully.');
    },
  });

  const unlinkStudentMutation = useMutation({
    mutationFn: () => {
      if (!formInput?.id) throw new Error('Request ID missing');
      return unlinkOpStudent(formInput.id);
    },
    onSuccess: () => {
      refetch();
      setIsUnlinkConfirmOpen(false);
      toast.success('Student unlinked successfully.');
    },
    onError: (error) => {
      console.error('Unlink student failed:', error);
      toast.error('Failed to unlink student: ' + (error as Error).message);
    },
  });

  const emailMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { subject: string; recipient_name: string; note?: string };
    }) => emailOpRequest(id, payload),
    onSuccess: () => {
      refetch();
      setIsEmailPreviewOpen(false);
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: number) =>
      api(`/api/v1/staff/documents/${documentId}`, { method: "DELETE" }),
    onSuccess: () => {
      refetch();
      setDeleteTargetId(null);
      toast.success('Document deleted successfully.');
    },
  });

  // --- Student search effect ---
  useEffect(() => {
    if (!isStudentMatchOpen || studentMatchMode !== "existing") return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsSearchingStudents(true);
      try {
        const result = await searchStudentsAsync({ q: studentSearch });
        setStudentCandidates(result.students ?? []);
      } catch {
        setStudentCandidates([]);
      } finally {
        setIsSearchingStudents(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [isStudentMatchOpen, studentMatchMode, studentSearch, searchStudentsAsync]);

  // --- Handlers ---
  const openStudentMatch = () => {
    setStudentSearch(formInput?.submitted_student_number ?? "");
    setStudentMatchMode("existing");
    setStudentCandidates([]);
    setIsStudentMatchOpen(true);
  };

  const buildDefaultEmailSubject = () => `Order of Payment - ${formInput?.reference_number}`;
  const buildDefaultRecipientName = () =>
    `${formInput?.firstname_or_office} ${formInput?.lastname_or_agency}`;

  const openEmailPreview = () => {
    setEmailSubject(buildDefaultEmailSubject());
    setEmailRecipientName(buildDefaultRecipientName());
    setEmailNote("");
    setIsEmailPreviewOpen(true);
  };

  const handleConfirmSendEmail = () => {
    if (!formInput) return;
    setIsSendingEmail(true);
    emailMutation.mutate(
      { id: formInput.id, payload: { subject: emailSubject, recipient_name: emailRecipientName, note: emailNote } },
      {
        onSuccess: () => {
          toast.success("Order of Payment emailed successfully.");
          setIsEmailPreviewOpen(false);
        },
        onError: (error) => toast.error("Failed to send email: " + (error as Error).message),
        onSettled: () => setIsSendingEmail(false),
      }
    );
  };

  const confirmDelete = (documentId: number) => setDeleteTargetId(documentId);

  const handleDocumentAction = async (documentId: number, type: "view" | "download") => {
    setDocumentAction({ id: documentId, type });
    try {
      const blob = await binary(`/api/v1/documents/${documentId}/${type}`);
      const objectUrl = URL.createObjectURL(blob);

      if (type === "view") {
        window.open(objectUrl, "_blank", "noopener,noreferrer");
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      } else {
        const document = supportingDocuments.find((item) => item.id === documentId);
        const anchor = window.document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = document?.original_filename ?? "supporting-document";
        anchor.click();
        URL.revokeObjectURL(objectUrl);
      }
    } catch (error) {
      toast.error(`Unable to ${type} document: ${error instanceof Error ? error.message : "Please try again."}`);
    } finally {
      setDocumentAction(null);
    }
  };

  const handleDelete = () => {
    if (deleteTargetId !== null) deleteDocumentMutation.mutate(deleteTargetId);
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInput) return;
    updateDetailsMutation.mutate({ id: formInput.id, payload: detailsData });
  };

  const cancelDetailsEdit = () => {
    setDetailsData({
      firstname_or_office: formInput?.firstname_or_office ?? "",
      middlename_or_project: formInput?.middlename_or_project ?? "",
      lastname_or_agency: formInput?.lastname_or_agency ?? "",
      office_or_college: formInput?.office_or_college ?? "",
      position_or_designation: formInput?.position_or_designation ?? "",
      email: formInput?.email ?? "",
      contact_num: formInput?.contact_num ?? "",
      address: formInput?.address ?? "",
      amount: String(formInput?.amount ?? ""),
      payment_detail_option_id: formInput?.payment_detail_option?.id
        ? String(formInput.payment_detail_option.id)
        : "",
      course_id: formInput?.course?.id ? String(formInput.course.id) : "",
      new_payment_option: "",
    });
    setIsEditingDetails(false);
  };

  const handleStaffInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffInput) return;
    updateProcessingMutation.mutate({ id: staffInput.id, payload: staffInputData });
  };

  const cancelStaffInputEdit = () => {
    setStaffInputData({
      fundcluster_id: staffInput?.bank_account ? String(staffInput.bank_account.id) : "",
      ref_document_id: staffInput?.reference_document ? String(staffInput.reference_document.id) : "",
      ref_date: staffInput?.ref_date ? staffInput.ref_date.split("T")[0] : "",
      uacs_id: staffInput?.uacs ? String(staffInput.uacs.id) : "",
      status: rawStatus,
      purpose: staffInput?.purpose ?? "",
    });
    setIsEditingStaffInput(false);
  };

  const handleOrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInput) return;
    updateOrMutation.mutate({ id: formInput.id, payload: orData });
  };

  const handlePaymentInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInput) return;
    // Merge payment info with required fields from details to satisfy validation
    const payload = {
      ...detailsData,
      ...paymentInfoData,
    };
    updateDetailsMutation.mutate({ id: formInput.id, payload });
  };

  const cancelOrEdit = () => {
    setOrData({
      or_no: staffInput?.or_no ?? "",
      or_date: staffInput?.or_date ? staffInput.or_date.split("T")[0] : "",
    });
    setIsEditingOr(false);
  };

  const cancelPaymentInfoEdit = () => {
    setPaymentInfoData({
      membership_id: formInput?.membership?.id ? String(formInput.membership.id) : "",
      payment_detail_option_id: formInput?.payment_detail_option?.id
        ? String(formInput.payment_detail_option.id)
        : "",
      submission_date: formInput?.created_at ? formInput.created_at.split("T")[0] : "",
    });
    setIsEditingPaymentInfo(false);
  };

  const handleProcessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processMutation.mutate({ id, payload: processData });
  };

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-24" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !formInput) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 my-8">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Unable to load order of payment</h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {error instanceof Error ? error.message : "The requested order of payment record could not be loaded."}
            </p>
          </div>
          <Link
            to="/staff/requests"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            Back to requests
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="w-full min-w-0">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-blue-600 bg-clip-text text-transparent">
              Request Details: {formInput.reference_number}
            </h2>
            <p className="text-sm text-muted-foreground">
              Reference: <span className="font-semibold text-blue-600">{formInput.reference_number}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/staff/requests"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            {/* Personal Information */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div>
                  <CardTitle className="text-base font-semibold">Personal / Office Information</CardTitle>
                  <CardDescription className="text-xs">Client contact and billing classification</CardDescription>
                </div>
                {!isEditingDetails && formInput && (
                  <Button variant="ghost" size="icon" onClick={() => setIsEditingDetails(true)} aria-label="Edit payor details">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                {isEditingDetails ? (
                  <form onSubmit={handleDetailsSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">First Name / Office <span className="text-red-500">*</span></label>
                        <Input
                          value={detailsData.firstname_or_office}
                          onChange={(e) => setDetailsData({ ...detailsData, firstname_or_office: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Middle Name / Project</label>
                        <Input
                          value={detailsData.middlename_or_project}
                          onChange={(e) => setDetailsData({ ...detailsData, middlename_or_project: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Last Name / Agency <span className="text-red-500">*</span></label>
                        <Input
                          value={detailsData.lastname_or_agency}
                          onChange={(e) => setDetailsData({ ...detailsData, lastname_or_agency: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Office / College</label>
                        <Input
                          value={detailsData.office_or_college}
                          onChange={(e) => setDetailsData({ ...detailsData, office_or_college: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Position / Designation</label>
                        <Input
                          value={detailsData.position_or_designation}
                          onChange={(e) => setDetailsData({ ...detailsData, position_or_designation: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Email</label>
                        <Input
                          type="email"
                          value={detailsData.email}
                          onChange={(e) => setDetailsData({ ...detailsData, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Contact Number</label>
                        <Input
                          value={detailsData.contact_num}
                          onChange={(e) => setDetailsData({ ...detailsData, contact_num: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Address</label>
                        <Input
                          value={detailsData.address}
                          onChange={(e) => setDetailsData({ ...detailsData, address: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Course Program</label>
                        <Select
                          value={detailsData.course_id}
                          onValueChange={(value) => setDetailsData({ ...detailsData, course_id: value ?? "" })}
                        >
                          <SelectTrigger>
                            {detailsData.course_id ? (
                              <span className="flex flex-1 text-left line-clamp-1">
                                {(() => {
                                  const selected = courses.find((c: { id: number; course_code: string; course_desc: string; course_college: string }) => String(c.id) === detailsData.course_id);
                                  return selected ? `${selected.course_code} — ${selected.course_desc}` : "Select Course Program";
                                })()}
                              </span>
                            ) : (
                              <SelectValue placeholder="Select Course Program" />
                            )}
                          </SelectTrigger>
<SelectContent>
                             {courses.map((course: { id: number; course_code: string; course_desc: string; course_college: string }) => (
                               <SelectItem key={course.id} value={String(course.id)}>
                                 {course.course_code} — {course.course_desc}
                               </SelectItem>
                             ))}
                           </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Amount <span className="text-red-500">*</span></label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={detailsData.amount}
                        onChange={(e) => setDetailsData({ ...detailsData, amount: e.target.value })}
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={cancelDetailsEdit}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateDetailsMutation.isPending}>
                        {updateDetailsMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <ReadOnlyRow label="First Name / Office" value={formInput.firstname_or_office} valueClass="font-medium" />
                    <ReadOnlyRow label="Middle Name / Project" value={formInput.middlename_or_project} />
                    <ReadOnlyRow label="Last Name / Agency" value={formInput.lastname_or_agency} valueClass="font-medium" />
                    <ReadOnlyRow label="Office / College" value={formInput.office_or_college} />
                    <ReadOnlyRow label="Position / Designation" value={formInput.position_or_designation} />
                    <ReadOnlyRow label="Email" value={formInput.email} valueClass="text-blue-600" />
                    <ReadOnlyRow label="Contact Number" value={formInput.contact_num} valueClass="text-blue-600" />
                    <ReadOnlyRow label="Address" value={formInput.address} />
                    <ReadOnlyRow label="Amount" value={formatCurrency(formInput.amount)} valueClass="font-bold text-blue-600" />
                    {formInput.course && (
                      <ReadOnlyRow
                        label="Course Program"
                        value={`${formInput.course.course_code} \u2014 ${formInput.course.course_desc}`}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div>
                  <CardTitle className="text-base font-semibold">Payment Information</CardTitle>
                  <CardDescription className="text-xs">Request type, membership, and payment option</CardDescription>
                </div>
                {!isEditingPaymentInfo && formInput && (
                  <Button variant="ghost" size="icon" onClick={() => setIsEditingPaymentInfo(true)} aria-label="Edit payment info">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                {isEditingPaymentInfo ? (
                  <form onSubmit={handlePaymentInfoSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Membership</label>
                        <Select
                          value={paymentInfoData.membership_id}
                          onValueChange={(value) => setPaymentInfoData({ ...paymentInfoData, membership_id: value ?? "" })}
                        >
                          <SelectTrigger>
                            {paymentInfoData.membership_id ? (
                              <span className="flex flex-1 text-left line-clamp-1">
                                {(() => {
                                  const selected = memberships.find((m: { id: number; member_code: string; member_desc: string }) => String(m.id) === paymentInfoData.membership_id);
                                  return selected ? `${selected.member_code} - ${selected.member_desc}` : "Select Membership";
                                })()}
                              </span>
                            ) : (
                              <SelectValue placeholder="Select Membership" />
                            )}
                          </SelectTrigger>
<SelectContent>
                             <SelectItem value="">None</SelectItem>
                             {memberships.map((m: { id: number; member_code: string; member_desc: string }) => (
                               <SelectItem key={m.id} value={String(m.id)}>
                                 {m.member_code} - {m.member_desc}
                               </SelectItem>
                             ))}
                           </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Payment Option <span className="text-red-500">*</span></label>
                        <SearchableSelect
                          value={paymentInfoData.payment_detail_option_id}
                          placeholder="Select Payment Option"
                          searchPlaceholder="Search payment option..."
                          options={paymentOptions.map((option) => ({
                            value: String(option.id),
                            label: option.payment_desc,
                          }))}
                          onChange={(value) =>
                            setPaymentInfoData({
                              ...paymentInfoData,
                              payment_detail_option_id: value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Submission Date <span className="text-red-500">*</span></label>
                        <Input
                          type="date"
                          value={paymentInfoData.submission_date}
                          onChange={(e) => setPaymentInfoData({ ...paymentInfoData, submission_date: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={cancelPaymentInfoEdit}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateDetailsMutation.isPending}>
                        {updateDetailsMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <ReadOnlyRow
                      label="Membership"
                      value={formInput.membership ? `${formInput.membership.member_code} - ${formInput.membership.member_desc}` : "N/A"}
                    />
                    <ReadOnlyRow
                      label="Payment Option"
                      value={formInput.payment_detail_option?.payment_desc ?? "N/A"}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Supporting Documents */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div>
                  <CardTitle className="text-base font-semibold">Supporting Documents</CardTitle>
                  <CardDescription className="text-xs">Uploaded verification requirements and attachments</CardDescription>
                </div>
                <Badge variant="secondary">{supportingDocuments.length} file(s)</Badge>
              </CardHeader>
              <CardContent className="pt-4">
                {supportingDocuments.length > 0 ? (
                  <div className="divide-y divide-border">
                    {supportingDocuments.map((document) => (
                      <div key={document.id} className="flex items-center justify-between px-2 py-3">
                        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className={`h-4 w-4 ${document.file_extension === "pdf" ? "text-red-500" : "text-blue-500"}`}
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                          </svg>
                          <TooltipProvider delay={150}>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <a
                                     href="#download-document"
                                     onClick={(event) => {
                                       event.preventDefault();
                                       void handleDocumentAction(document.id, "download");
                                     }}
                                     className="block max-w-65 min-w-0 truncate text-blue-600 hover:underline"
                                   >
                                     {document.original_filename}
                                   </a>
                                }
                              >
                                {document.original_filename}
                              </TooltipTrigger>
                              <TooltipContent side="top" align="start" className="max-w-sm break-all">
                                {document.original_filename}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Badge variant="secondary" className="text-[10px]">
                            {document.file_extension?.toUpperCase() ?? "FILE"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {document.formatted_file_size ?? formatFileSize(document.file_size)}
                          </span>
                           <button
                             type="button"
                             onClick={() => void handleDocumentAction(document.id, "view")}
                             disabled={documentAction?.id === document.id}
                             className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                             title="View"
                           >
                             <Eye className="h-4 w-4" />
                           </button>
                           <button
                             type="button"
                             onClick={() => void handleDocumentAction(document.id, "download")}
                             disabled={documentAction?.id === document.id}
                             className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted disabled:opacity-50"
                             title="Download"
                           >
                             <Download className="h-4 w-4" />
                           </button>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger render={
                                <button
                                  onClick={() => confirmDelete(document.id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 text-red-500 hover:bg-red-50"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              }>
                                <TooltipContent>Delete this document</TooltipContent>
                              </TooltipTrigger>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">No supporting documents uploaded.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Staff Processing Information */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div>
                  <CardTitle className="text-base font-semibold">Staff Processing</CardTitle>
                  <CardDescription className="text-xs">Processing record and cashier details</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {staffInput && (
                    <Badge className={statusBadgeClass(rawStatus)}>{rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1)}</Badge>
                  )}
                  {staffInput?.emailed_at && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-400">
                      <Mail className="h-3 w-3 mr-1" /> Sent email
                    </Badge>
                  )}
                  {!staffInput && !isProcessing && (
                    <Button variant="outline" size="sm" onClick={() => setIsProcessing(true)}>
                      Process Now
                    </Button>
                  )}
                  {staffInput && !isEditingStaffInput && (
                    <Button variant="ghost" size="icon" onClick={() => setIsEditingStaffInput(true)} aria-label="Edit processing">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {isProcessing ? (
                  <form onSubmit={handleProcessSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Bank Account <span className="text-red-500">*</span></label>
                      <SearchableSelect
                        value={processData.fundcluster_id}
                        placeholder="Select Bank Account"
                        searchPlaceholder="Search bank account..."
                        options={bankAccounts.map((acc) => ({
                          value: String(acc.id),
                          label: `${acc.fund_cluster} - ${acc.account_name} - ${acc.bank_name} (${acc.account_num})`,
                        }))}
                        onChange={(value) => setProcessData({ ...processData, fundcluster_id: value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Reference Document</label>
                      <Select value={processData.ref_document_id} onValueChange={(v) => setProcessData({ ...processData, ref_document_id: v ?? "" })}>
                        <SelectTrigger><SelectValue placeholder="Select Reference Document (Optional)" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {supportingDocuments.map((doc) => (
                            <SelectItem key={doc.id} value={String(doc.id)}>{doc.original_filename}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Reference Date <span className="text-red-500">*</span></label>
                      <Input
                        type="date"
                        value={processData.ref_date}
                        onChange={(e) => setProcessData({ ...processData, ref_date: e.target.value })}
                        max={todayIso()}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">UACS <span className="text-red-500">*</span></label>
                      <SearchableSelect
                        value={processData.uacs_id}
                        placeholder="Select UACS"
                        searchPlaceholder="Search UACS code or account title..."
                        options={uacsList.map((u) => ({
                          value: String(u.id),
                          label: `${u.uacs_sub_object_code ? `${u.uacs_object_code}-${u.uacs_sub_object_code}` : u.uacs_object_code} - ${u.account_title}`,
                        }))}
                        onChange={(value) => setProcessData({ ...processData, uacs_id: value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Status</label>
                      <Select value={processData.status} onValueChange={(v) => setProcessData({ ...processData, status: (v ?? "processed") as "processed" | "pending" | "paid" | "cancelled" })}>
                        <SelectTrigger>
                          <span className="truncate capitalize">{processData.status}</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="processed">Processed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Purpose</label>
                      <Textarea
                        value={processData.purpose}
                        onChange={(e) => setProcessData({ ...processData, purpose: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => setIsProcessing(false)}>Cancel</Button>
                      <Button type="submit" disabled={processMutation.isPending}>
                        {processMutation.isPending ? "Processing..." : "Process"}
                      </Button>
                    </div>
                  </form>
                ) : staffInput ? (
                  isEditingStaffInput ? (
                    <form onSubmit={handleStaffInputSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Bank Account <span className="text-red-500">*</span></label>
                        <SearchableSelect
                          value={staffInputData.fundcluster_id}
                          placeholder="Select Bank Account"
                          searchPlaceholder="Search bank account..."
                          options={bankAccounts.map((acc) => ({
                            value: String(acc.id),
                            label: `${acc.fund_cluster} - ${acc.account_name} - ${acc.bank_name} (${acc.account_num})`,
                          }))}
                          onChange={(value) => setStaffInputData({ ...staffInputData, fundcluster_id: value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Reference Document</label>
                        <Select value={staffInputData.ref_document_id} onValueChange={(v) => setStaffInputData({ ...staffInputData, ref_document_id: v ?? "" })}>
                          <SelectTrigger><SelectValue placeholder="Select Reference Document (Optional)" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {supportingDocuments.map((doc) => (
                              <SelectItem key={doc.id} value={String(doc.id)}>{doc.original_filename}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Reference Date <span className="text-red-500">*</span></label>
                        <Input
                          type="date"
                          value={staffInputData.ref_date}
                          onChange={(e) => setStaffInputData({ ...staffInputData, ref_date: e.target.value })}
                          max={todayIso()}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">UACS <span className="text-red-500">*</span></label>
                        <SearchableSelect
                          value={staffInputData.uacs_id}
                          placeholder="Select UACS"
                          searchPlaceholder="Search UACS code or account title..."
                          options={uacsList.map((u) => ({
                            value: String(u.id),
                            label: `${u.uacs_sub_object_code ? `${u.uacs_object_code}-${u.uacs_sub_object_code}` : u.uacs_object_code} - ${u.account_title}`,
                          }))}
                          onChange={(value) => setStaffInputData({ ...staffInputData, uacs_id: value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Status</label>
                        <Select value={staffInputData.status} onValueChange={(v) => setStaffInputData({ ...staffInputData, status: (v ?? "unprocessed") as "pending" | "processed" | "paid" | "cancelled" | "unprocessed" })}>
                          <SelectTrigger>
                            <span className="truncate capitalize">{staffInputData.status}</span>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="processed">Processed</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Purpose</label>
                        <Textarea
                          value={staffInputData.purpose}
                          onChange={(e) => setStaffInputData({ ...staffInputData, purpose: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={cancelStaffInputEdit}>Cancel</Button>
                        <Button type="submit" disabled={updateProcessingMutation.isPending}>
                          {updateProcessingMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      <ReadOnlyRow label="Bank Account" value={staffInput.bank_account ? `${staffInput.bank_account.fund_cluster} - ${staffInput.bank_account.account_name} - ${staffInput.bank_account.bank_name} (${staffInput.bank_account.account_num})` : "N/A"} />
                      <ReadOnlyRow label="Reference Document" value={staffInput.reference_document?.original_filename ?? "N/A"} />
                      <ReadOnlyRow label="Reference Date" value={staffInput.ref_date ? formatDateOnly(staffInput.ref_date) : "N/A"} />
                      <ReadOnlyRow label="UACS" value={staffInput.uacs ? `${staffInput.uacs.uacs_sub_object_code ? `${staffInput.uacs.uacs_object_code}-${staffInput.uacs.uacs_sub_object_code}` : staffInput.uacs.uacs_object_code} - ${staffInput.uacs.account_title}` : "N/A"} />
                      <ReadOnlyRow label="Status" value={rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1)} valueClass="font-medium" />
                      <ReadOnlyRow label="Purpose" value={staffInput.purpose ?? "N/A"} stacked />
                      <ReadOnlyRow label="Processed By" value="Staff User" />
                      <ReadOnlyRow label="Processed Date" value={staffInput.created_at ? formatDateTime(staffInput.created_at) : "N/A"} />
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No processing record yet.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setIsProcessing(true)}>
                      Process Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* OR Information (Cashier) */}
            {(staffInput && (isProcessedOrPaid || true)) && (
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                  <div>
                    <CardTitle className="text-base font-semibold">Official Receipt</CardTitle>
                    <CardDescription className="text-xs">Official receipt details</CardDescription>
                  </div>
                  {!isEditingOr && staffInput && (
                    <Button variant="ghost" size="icon" onClick={() => setIsEditingOr(true)} aria-label="Edit OR">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-4">
                  {isEditingOr ? (
                    <form onSubmit={handleOrSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">OR Number <span className="text-red-500">*</span></label>
                          <Input
                            value={orData.or_no}
                            onChange={(e) => setOrData({ ...orData, or_no: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">OR Date <span className="text-red-500">*</span></label>
                          <Input
                            type="date"
                            value={orData.or_date}
                            onChange={(e) => setOrData({ ...orData, or_date: e.target.value })}
                            max={todayIso()}
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={cancelOrEdit}>Cancel</Button>
                        <Button type="submit" disabled={updateOrMutation.isPending}>
                          {updateOrMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      <ReadOnlyRow label="OR Number" value={staffInput.or_no ?? "Not issued"} valueClass={staffInput.or_no ? "font-mono font-medium" : "text-muted-foreground"} />
                      <ReadOnlyRow label="OR Date" value={staffInput.or_date ? formatDateOnly(staffInput.or_date) : "Not issued"} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Student Verification */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div>
                  <CardTitle className="text-base font-semibold">Student Verification</CardTitle>
                  <CardDescription className="text-xs">Link to university student master ledger</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {formInput.student ? (
                  <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900/50 dark:bg-green-950/20">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-900">{formInput.student.full_name}</p>
                        <p className="text-xs text-green-700 font-mono">Student ID: {formInput.student.student_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-700">Linked</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setIsUnlinkConfirmOpen(true)}
                      >
                        <Unlink className="h-3.5 w-3.5 mr-1" />
                        Unlink
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-800 flex-1">
                        <p className="font-medium">No student linked to this request</p>
                        {formInput.submitted_student_number && (
                          <p className="mt-0.5">Submitted student ID: <span className="font-mono font-semibold">{formInput.submitted_student_number}</span></p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" onClick={openStudentMatch}>
                      <UserPlus className="h-4 w-4 mr-2" /> Match Student
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PDF Actions */}
            <Card className="shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-base font-semibold">PDF Copies</CardTitle>
                <CardDescription className="text-xs">View or download generated PDF receipts</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex items-center gap-2">
                <Popover>
                  <PopoverTrigger>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" /> View OP
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3.5 w-3.5 ml-2"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" side="bottom" className="w-52 p-1">
                    <button
                      onClick={() => window.open(getOpPdfUrl(formInput.id, "portrait"), "_blank")}
                      className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent"
                    >
                      Portrait (A5, 3 Pages)
                    </button>
                    <button
                      onClick={() => window.open(getOpPdfUrl(formInput.id, "landscape"), "_blank")}
                      className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent"
                    >
                      Landscape (Legal, 1 Page)
                    </button>
                  </PopoverContent>
                </Popover>
                <Button
                  variant="outline"
                  onClick={openEmailPreview}
                >
                  <Mail className="h-4 w-4 mr-2" /> Email OP
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Email Preview Dialog */}
        <Dialog open={isEmailPreviewOpen} onOpenChange={setIsEmailPreviewOpen}>
          <DialogContent className="sm:max-w-screen max-h-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview Email</DialogTitle>
              <DialogDescription>
                Review before sending to <span className="font-medium">{formInput.email}</span>. Two PDF copies (A5 + Legal) will be attached automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-6 md:grid-cols-1 lg:grid-cols-[3fr_5fr]">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Subject</label>
                  <Input
                    value={emailSubject}
                    onChange={(event) => setEmailSubject(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Recipient Name</label>
                  <Input
                    value={emailRecipientName}
                    onChange={(event) => setEmailRecipientName(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">How they're greeted — edit if the name needs correcting.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Additional Note (Optional)</label>
                  <Textarea
                    value={emailNote}
                    onChange={(event) => setEmailNote(event.target.value)}
                    rows={4}
                    placeholder="Add a personal note to the email..."
                  />
                </div>
              </div>
              <div className="max-h-[60vh] overflow-auto rounded-lg border bg-muted p-4">
                <div dangerouslySetInnerHTML={{
                  __html: buildEmailPreviewHtml(formInput, emailRecipientName, emailNote),
                }} />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEmailPreviewOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmSendEmail} disabled={isSendingEmail}>
                {isSendingEmail ? "Sending..." : "Send Email"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Student Match Dialog */}
        <Dialog open={isStudentMatchOpen} onOpenChange={setIsStudentMatchOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Match Student</DialogTitle>
              <DialogDescription>Link this request to a student in the university ledger</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex gap-2 border-b pb-4">
                <Button
                  variant={studentMatchMode === "existing" ? "default" : "outline"}
                  onClick={() => setStudentMatchMode("existing")}
                >
                  Existing Student
                </Button>
                <Button
                  variant={studentMatchMode === "create" ? "default" : "outline"}
                  onClick={() => setStudentMatchMode("create")}
                >
                  Create New
                </Button>
              </div>

              {studentMatchMode === "existing" ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Search Student</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or student number..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  {isSearchingStudents && <div className="text-center text-sm text-muted-foreground">Searching...</div>}
                  {!isSearchingStudents && studentCandidates.length === 0 && studentSearch && (
                    <div className="text-center text-sm text-muted-foreground">No students found.</div>
                  )}
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {studentCandidates.map((student) => (
                      <Button
                        key={student.id}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => linkStudentMutation.mutate({ id: formInput.id, student_id: student.id })}
                        disabled={linkStudentMutation.isPending}
                      >
                        {student.full_name} \u2014 <span className="font-mono">{student.student_number}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Create a new student record and link it to this request.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Student Number *</label>
                      <Input value={formInput.submitted_student_number ?? ""} readOnly />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">First Name *</label>
                      <Input defaultValue={formInput.firstname_or_office} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Middle Name</label>
                      <Input defaultValue={formInput.middlename_or_project ?? ""} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Last Name *</label>
                      <Input defaultValue={formInput.lastname_or_agency} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Email *</label>
                      <Input type="email" defaultValue={formInput.email} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Contact Number</label>
                      <Input defaultValue={formInput.contact_num} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStudentMatchOpen(false)}>Cancel</Button>
              <Button
                onClick={
                  studentMatchMode === "existing"
                    ? () => { } // linkStudentMutation.mutate({ id: formInput.id, student_id: selectedId })
                    : () => { } // createAndLinkStudent mutation not implemented yet
                }
                disabled={
                  studentMatchMode === "existing"
                    ? false // !selectedId || linkStudentMutation.isPending
                    : false // createStudentForm.processing
                }
              >
                {studentMatchMode === "existing"
                  ? linkStudentMutation.isPending
                    ? "Linking..."
                    : "Confirm Match"
                  : "Create and Match"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Document Confirmation Dialog */}
        <Dialog open={deleteTargetId !== null} onOpenChange={() => setDeleteTargetId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Document</DialogTitle>
              <DialogDescription>Are you sure you want to delete this document? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTargetId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteDocumentMutation.isPending}>
                {deleteDocumentMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unlink Student Confirmation Dialog */}
        <Dialog open={isUnlinkConfirmOpen} onOpenChange={setIsUnlinkConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unlink Student</DialogTitle>
              <DialogDescription>
                Are you sure you want to unlink this student from the Order of Payment? This only detaches the student record from this request and does not delete the student record or any ledger transactions.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUnlinkConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => unlinkStudentMutation.mutate()}
                disabled={unlinkStudentMutation.isPending}
              >
                {unlinkStudentMutation.isPending ? "Unlinking..." : "Unlink Student"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}