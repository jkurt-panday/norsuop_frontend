import { useState, useTransition, type SubmitEvent } from "react";
import { Link } from "react-router";
import { format, parseISO } from "date-fns";
import { Eye, Inbox, Pencil } from "lucide-react";
import { ApiError } from "../../api/client";
import {
  getCashierAmount,
  getCashierOrNo,
  getCashierPayorName,
  getCashierReferenceNumber,
  getCashierStatus,
  type CashierFilters,
  type CashierRequest,
} from "./api";
import { useCashierRequests } from "./queries";
import { CashierRequestSkeleton } from "./CashierRequestSkeleton";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import RequestTable, { type SortOptionDef, type StatusOption } from "@/components/ui/request-table";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

const statusOptions: StatusOption[] = [
  { value: "processed", label: "Processed" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

const sortOptions: SortOptionDef[] = [
  { label: "Date (Newest)", sort: "created_at", direction: "desc" },
  { label: "Date (Oldest)", sort: "created_at", direction: "asc" },
  { label: "Reference A–Z", sort: "reference_number", direction: "asc" },
  { label: "Reference Z–A", sort: "reference_number", direction: "desc" },
  { label: "Amount High–Low", sort: "amount", direction: "desc" },
  { label: "Amount Low–High", sort: "amount", direction: "asc" },
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

export function CashierRequestsPage() {
  const [, startTransition] = useTransition();

  // Filters state
  const [searchInput, setSearchInput] = useState("");
  const [statusInput, setStatusInput] = useState("");
  const [dateFromInput, setDateFromInput] = useState("");
  const [dateToInput, setDateToInput] = useState("");

  const [activeFilters, setActiveFilters] = useState<CashierFilters>({
    page: 1,
    per_page: 10,
    search: "",
    status: "",
    date_from: "",
    date_to: "",
    sort: "created_at",
    direction: "desc",
  });

  const query = useCashierRequests(activeFilters);

  const handleApplyFilters = (e: SubmitEvent<HTMLFormElement>) => {
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

  const handleSortChange = (sort: string, direction: "asc" | "desc") => {
    startTransition(() => {
      setActiveFilters((prev) => ({
        ...prev,
        page: 1,
        sort,
        direction,
      }));
    });
  };

  const handlePageChange = (page: number) => {
    startTransition(() => {
      setActiveFilters((prev) => ({ ...prev, page }));
    });
  };

  const data = query.data?.data ?? [];
  const meta = query.data?.meta;
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

  const columns = [
    {
      header: "Reference #",
      width: "180px",
      sortable: "reference_number",
      render: (req: CashierRequest) => (
        <Link
          to={`/cashier/requests/${req.id}`}
          className="font-semibold text-primary hover:underline"
        >
          {getCashierReferenceNumber(req)}
        </Link>
      ),
    },
    {
      header: "Payor",
      width: "200px",
      render: (req: CashierRequest) => (
        <div className="min-w-0">
          <p className="max-w-xs truncate font-medium text-foreground">
            {getCashierPayorName(req) || "—"}
          </p>
        </div>
      ),
    },
    {
      header: "Amount",
      width: "140px",
      align: "right",
      render: (req: CashierRequest) => (
        <span className="font-medium tabular-nums text-foreground">
          {currencyFormatter.format(getCashierAmount(req))}
        </span>
      ),
    },
    {
      header: "Status",
      width: "120px",
      render: (req: CashierRequest) => {
        const statusValue = getCashierStatus(req);
        return <StatusBadge status={statusValue} />;
      },
    },
    {
      header: "OR Number",
      width: "140px",
      render: (req: CashierRequest) => (
        <span className="tabular-nums text-foreground">
          {getCashierOrNo(req) || "—"}
        </span>
      ),
    },
    {
      header: "Processed Date",
      width: "150px",
      sortable: "created_at",
      render: (req: CashierRequest) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(req.created_at ?? req.ref_date)}
        </span>
      ),
    },
  ];

  const isFiltered = Boolean(
    activeFilters.search || activeFilters.status || activeFilters.date_from || activeFilters.date_to,
  );

  return (
    <div className="space-y-6">
      <RequestTable
        title="Cashier Payment Requests"
        description="Review approved orders of payment and record official receipts."
        icon={Inbox}
        columns={columns}
        resource={paginatedData}
        resourceKey="cashier-requests"
        renderActions={(req) => {
          const statusValue = getCashierStatus(req);
          const paid = statusValue === "paid";
          return (
            <Link
              to={`/cashier/requests/${req.id}`}
              className={
                paid
                  ? "inline-flex size-8 items-center justify-center rounded-lg bg-blue-500 text-white transition-colors hover:bg-blue-600"
                  : "inline-flex size-8 items-center justify-center rounded-lg bg-amber-500 text-white transition-colors hover:bg-amber-600"
              }
              aria-label={
                paid
                  ? "View payment request"
                  : "Edit payment request"
              }
              title={
                paid
                  ? "View payment request"
                  : "Edit payment request"
              }
            >
              {paid ? (
                <Eye className="size-4" />
              ) : (
                <Pencil className="size-4" />
              )}
            </Link>
          );
        }}
        emptyIcon={Inbox}
        emptyMessage={
          isFiltered
            ? "No payment requests matched your active filters. Try adjusting your search query or date range."
            : "There are no pending or paid cashier requests at this time."
        }
        onPageChange={handlePageChange}
        search={searchInput}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search OR #, reference, or name..."
        status={statusInput}
        onStatusChange={setStatusInput}
        statusOptions={statusOptions}
        statusPlaceholder="All Statuses"
        dateFrom={dateFromInput}
        onDateFromChange={setDateFromInput}
        dateTo={dateToInput}
        onDateToChange={setDateToInput}
        onFilterSubmit={handleApplyFilters}
        onFilterReset={handleResetFilters}
        onReload={handleReload}
        sortOptions={sortOptions}
        sort={activeFilters.sort}
        direction={activeFilters.direction}
        onSortChange={handleSortChange}
      />
    </div>
  );
}
