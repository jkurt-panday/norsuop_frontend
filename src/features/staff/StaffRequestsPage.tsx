import { useState, useTransition, useMemo } from "react";
import { Link } from "react-router";
import { Inbox, FileText, Trash2, Eye, Mail } from "lucide-react";
import { ApiError } from "../../api/client";
import { useStaffRequests } from "./queries";
import { useDeleteStaffRequest } from "./mutations";
import type { StaffFilters, StaffRequest } from "./api";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import RequestTable, { type SortOptionDef, type StatusOption } from "@/components/ui/request-table";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import { BulkEmailModal } from "./BulkEmailModal";
import { toast } from "sonner";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatPayorName(req: {
  firstname_or_office: string;
  middlename_or_project?: string | null;
  lastname_or_agency: string;
}) {
  return [
    req.firstname_or_office,
    req.middlename_or_project,
    req.lastname_or_agency,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const statusOptions: StatusOption[] = [
  { value: "unprocessed", label: "Unprocessed" },
  { value: "pending", label: "Pending" },
  { value: "processed", label: "Processed" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

const sortOptions: SortOptionDef[] = [
  { label: "Newest", sort: "created_at", direction: "desc" },
  { label: "Oldest", sort: "created_at", direction: "asc" },
  { label: "Reference A–Z", sort: "reference_number", direction: "asc" },
  { label: "Reference Z–A", sort: "reference_number", direction: "desc" },
  { label: "Amount High–Low", sort: "amount", direction: "desc" },
  { label: "Amount Low–High", sort: "amount", direction: "asc" },
];

export function StaffRequestsPage() {
  const [, startTransition] = useTransition();

  // Filters state
  const [searchInput, setSearchInput] = useState("");
  const [statusInput, setStatusInput] = useState("");
  const [dateFromInput, setDateFromInput] = useState("");
  const [dateToInput, setDateToInput] = useState("");

  const [activeFilters, setActiveFilters] = useState<StaffFilters>({
    page: 1,
    per_page: 10,
    search: "",
    status: "",
    date_from: "",
    date_to: "",
    sort: "created_at",
    direction: "desc",
  });

  const query = useStaffRequests(activeFilters);

  const deleteMutation = useDeleteStaffRequest();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; ref: string } | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const handleDeleteClick = (id: number, referenceNumber: string) => {
    setDeleteTarget({ id, ref: referenceNumber });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`Request ${deleteTarget.ref} deleted successfully`);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to delete request");
      },
    });
  };

  const handleOpenEmailModal = () => {
    setIsEmailModalOpen(true);
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      setActiveFilters((prev) => ({
        ...prev,
        page: 1,
        search: searchInput.trim(),
        status: statusInput,
        date_from: dateFromInput,
        date_to: dateToInput,
      }));
    });
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setStatusInput("");
    setDateFromInput("");
    setDateToInput("");
    startTransition(() => {
      setActiveFilters({
        page: 1,
        per_page: 10,
        search: "",
        status: "",
        date_from: "",
        date_to: "",
        sort: "created_at",
        direction: "desc",
      });
    });
  };

  const handleReload = () => {
    query.refetch();
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleApplyFilters(e);
  };

  const setPage = (pageNumber: number) => {
    startTransition(() => {
      setActiveFilters((prev) => ({ ...prev, page: pageNumber }));
    });
  };

  const handleSortChange = (newSort: string, newDirection: "asc" | "desc") => {
    startTransition(() => {
      setActiveFilters((prev) => ({ ...prev, sort: newSort, direction: newDirection, page: 1 }));
    });
  };

  const columns = useMemo(() => [
    {
      header: "Reference #",
      sortable: "reference_number",
      width: "160px",
      render: (req: StaffRequest) => (
        <Link to={`/staff/requests/${req.id}`} className="font-semibold text-blue-600 hover:underline dark:text-sky-400">
          {req.reference_number}
        </Link>
      ),
    },
    {
      header: "Name",
      sortable: "firstname_or_office",
      width: "180px",
      render: (req: any) => {
        const payorName = formatPayorName(req);
        return (
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{payorName || "—"}</p>
          </div>
        );
      },
    },
    {
      header: "Email",
      sortable: "email",
      width: "220px",
      render: (req: any) => <span className="text-xs text-muted-foreground truncate">{req.email}</span>,
    },
    {
      header: "Amount",
      sortable: "amount",
      width: "110px",
      align: "left" as const,
      className: "tabular-nums",
      render: (req: StaffRequest) => (
        <span className="tabular-nums font-medium text-foreground">
          {currencyFormatter.format(Number(req.amount || 0))}
        </span>
      ),
    },
    {
      header: "Membership",
      width: "130px",
      render: (req: any) => <span className="text-xs text-muted-foreground">{req.membership?.member_code ?? 'N/A'}</span>,
    },
    {
      header: "Status",
      sortable: "status",
      width: "130px",
      align: "left" as const,
      render: (req: any) => {
        const status = req.staff_input?.status ?? "unprocessed";
        return <StatusBadge status={status} />;
      },
    },
    {
      header: "Date Submitted",
      sortable: "created_at",
      width: "200px",
      align: "left" as const,
      render: (req: any) => <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(req.created_at)}</span>,
    },
  ], []);

  const isFiltered = !!searchInput || !!statusInput || !!dateFromInput || !!dateToInput;

  if (query.isPending) {
    return (
      <Card className="border-border shadow-sm">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-md" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (query.isError) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="py-12 text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Inbox className="size-6" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Failed to load staff requests</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {query.error instanceof ApiError ? query.error.message : "A network or server error occurred while retrieving requests."}
          </p>
          <Button variant="outline" size="sm" onClick={() => void query.refetch()} className="text-xs">
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const data = query.data.data;
  const meta = query.data.meta;
  const total = meta?.total ?? 0;
  const lastPage = meta?.last_page ?? 1;
  const page = meta?.current_page ?? 1;

  const paginatedData = {
    data,
    links: [],
    from: ((page - 1) * (meta?.per_page ?? 10)) + 1,
    to: Math.min(page * (meta?.per_page ?? 10), total),
    total,
    current_page: page,
    last_page: lastPage,
  };

  return (
    <div className="space-y-6">
      <RequestTable
        title="Staff Requests"
        description="Manage incoming orders of payment, student verifications, and accounting codes."
        icon={FileText}
        columns={columns}
        resource={paginatedData}
        resourceKey="staff-requests"
        renderActions={(req) => (
          <>
            <Link
              to={`/staff/requests/${req.id}`}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-blue-600 text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-neutral-950"
            >
              <Eye className="h-4 w-4" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-red-600 hover:bg-red-600/10 hover:text-red-600"
              onClick={() => handleDeleteClick(req.id, req.reference_number)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
        emptyIcon={Inbox}
        emptyMessage={isFiltered ? "No order of payment requests matched your active filters. Try adjusting your search query or date range." : "There are currently no staff requests in the queue."}
        onPageChange={setPage}
        search={searchInput}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search reference, name, email..."
        status={statusInput}
        onStatusChange={setStatusInput}
        statusOptions={statusOptions}
        statusPlaceholder="All Statuses"
        dateFrom={dateFromInput}
        onDateFromChange={setDateFromInput}
        dateTo={dateToInput}
        onDateToChange={setDateToInput}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleResetFilters}
        onReload={handleReload}
        customToolbar={
          <Button
            type="button"
            onClick={handleOpenEmailModal}
            className="h-10 gap-2 rounded-lg bg-emerald-700 px-4 text-white hover:bg-emerald-800"
          >
            <Mail className="h-4 w-4" />
            <span>Send Email</span>
          </Button>
        }
        sortOptions={sortOptions}
        enableColumnSorting={true}
        highlightDuration={2000}
        actionsWidth="90px"
        sort={activeFilters.sort}
        direction={activeFilters.direction}
        onSortChange={handleSortChange}
      />
      <DeleteConfirmation
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
        description={`Are you sure you want to delete request ${deleteTarget?.ref}? This action cannot be undone.`}
      />
      <BulkEmailModal open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen} />
    </div>
  );
}