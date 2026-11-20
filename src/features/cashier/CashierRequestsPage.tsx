import { useState, useTransition, type SubmitEvent } from "react";
import { Link } from "react-router";
import { format, parseISO } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarIcon,
  Eye,
  Inbox,
  Pencil,
  RefreshCw,
  Search,
} from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});
const statuses = ["processed", "paid", "cancelled"];
const statusLabel = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

function toDate(value: string) {
  return value ? parseISO(value) : undefined;
}
function toDateInput(value: Date | undefined) {
  return value ? format(value, "yyyy-MM-dd") : "";
}
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

function DateFilter({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: Date;
  max?: Date;
}) {
  const date = toDate(value);
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-10 w-40 justify-start gap-2 rounded-lg font-normal"
            aria-label={label}
          />
        }
      >
        <CalendarIcon className="size-4 text-muted-foreground" />
        {date ? format(date, "MMM d, yyyy") : label}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selected) => onChange(toDateInput(selected))}
          disabled={(day) => Boolean((min && day < min) || (max && day > max))}
        />
      </PopoverContent>
    </Popover>
  );
}

function StatusFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = statuses.find((status) => status === value);
  return (
    <Combobox
      items={statuses}
      value={selected ? statusLabel(selected) : ""}
      onValueChange={(next) =>
        onChange(statuses.find((status) => statusLabel(status) === next) ?? "")
      }
    >
      <ComboboxInput
        placeholder="Status"
        aria-label="Status"
        showClear={Boolean(value)}
        className="h-10 w-44 rounded-lg"
      />
      <ComboboxContent>
        <ComboboxEmpty>No options found.</ComboboxEmpty>
        <ComboboxList>
          {(status) => (
            <ComboboxItem key={status} value={statusLabel(status)}>
              {statusLabel(status)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function getSortIcon(column: string, filters: CashierFilters) {
  if (filters.sort !== column)
    return <ArrowUpDown className="ml-1 size-3.5 opacity-50" />;
  return filters.direction === "asc" ? (
    <ArrowUp className="ml-1 size-3.5 text-primary" />
  ) : (
    <ArrowDown className="ml-1 size-3.5 text-primary" />
  );
}

export function CashierRequestsPage() {
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filters, setFilters] = useState<CashierFilters>({
    page: 1,
    per_page: 10,
    search: "",
    status: "",
    date_from: "",
    date_to: "",
    sort: "created_at",
    direction: "desc",
  });
  const query = useCashierRequests(filters);
  const updateFilters = (next: Partial<CashierFilters>) =>
    startTransition(() => setFilters((current) => ({ ...current, ...next })));
  const applyFilters = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateFilters({
      page: 1,
      search: search.trim(),
      status,
      date_from: dateFrom,
      date_to: dateTo,
    });
  };
  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setFilters({
      page: 1,
      per_page: 10,
      search: "",
      status: "",
      date_from: "",
      date_to: "",
      sort: "created_at",
      direction: "desc",
    });
  };
  const toggleSort = (sort: string) =>
    updateFilters({
      page: 1,
      sort,
      direction:
        filters.sort === sort && filters.direction === "asc" ? "desc" : "asc",
    });
  const isFiltered = Boolean(
    filters.search || filters.status || filters.date_from || filters.date_to,
  );
  const requests = query.data?.data ?? [];

  if (query.isPending) return <CashierRequestSkeleton />;

  return (
    <div className="min-h-screen w-full min-w-0 space-y-4 bg-page-background">
      <title>Cashier Payment Requests</title>
      <Card className="rounded-2xl bg-card px-2! py-2! shadow-sm">
        <CardHeader className="p-3">
          <CardTitle className="bg-[#3399FF] bg-clip-text font-['Poppins'] text-3xl font-black tracking-tight text-transparent sm:text-4xl">
            Cashier Payment Requests
          </CardTitle>
          <CardDescription className="mt-1">
            Review approved orders of payment and record official receipts.
          </CardDescription>
        </CardHeader>
      </Card>
      <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <CardContent className="p-0">
          <form
            onSubmit={applyFilters}
            className="flex items-center justify-between gap-3 px-4 py-4"
          >
            <div className="flex w-full flex-col gap-3">
              <div className="flex w-full items-center gap-2">
                <Input
                  placeholder="Search OR #, reference, or name"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-10 min-w-0 flex-1 rounded-xl px-4 text-sm sm:w-150 sm:flex-none"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  aria-label="Search requests"
                >
                  <Search className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={resetFilters}
                  title="Reset table"
                  className="h-10 w-10 shrink-0 rounded-xl"
                >
                  <RefreshCw className="size-4" />
                </Button>
              </div>
              <div className="flex w-full flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:flex-row sm:items-end">
                <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Date range
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <DateFilter
                        label="From date"
                        value={dateFrom}
                        max={toDate(dateTo)}
                        onChange={setDateFrom}
                      />
                      <span className="text-sm text-muted-foreground">to</span>
                      <DateFilter
                        label="To date"
                        value={dateTo}
                        min={toDate(dateFrom)}
                        onChange={setDateTo}
                      />
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Filters
                    </span>
                    <StatusFilter value={status} onChange={setStatus} />
                  </div>

                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {query.isError ? (
            <div className="space-y-3 py-12 text-center">
              <Inbox className="mx-auto size-10 text-destructive" />
              <p className="text-destructive">
                Failed to load cashier requests
              </p>
              <p className="text-sm text-muted-foreground">
                {query.error instanceof ApiError
                  ? query.error.message
                  : "A network or server error occurred."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void query.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : requests.length === 0 ? (
            <div className="space-y-3 py-14 text-center">
              <Inbox className="mx-auto size-10 text-muted-foreground" />
              <p className="font-medium">No payment requests found</p>
              <p className="text-sm text-muted-foreground">
                {isFiltered
                  ? "No requests match your current filters."
                  : "There are no pending or paid cashier requests at this time."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4!">
                    <button
                      className="inline-flex items-center"
                      onClick={() => toggleSort("reference_number")}
                    >
                      Reference # {getSortIcon("reference_number", filters)}
                    </button>
                  </TableHead>
                  <TableHead>Payor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>OR Number</TableHead>
                  <TableHead>
                    <button
                      className="inline-flex items-center"
                      onClick={() => toggleSort("created_at")}
                    >
                      Processed Date {getSortIcon("created_at", filters)}
                    </button>
                  </TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request: CashierRequest) => {
                  const statusValue = getCashierStatus(request);
                  const paid = statusValue === "paid";
                  return (
                    <TableRow
                      key={request.id}
                      className="even:bg-gray-100 hover:bg-gray-600/20 dark:even:bg-muted/30 dark:hover:bg-muted/50"
                    >
                      <TableCell className="px-3! py-2! pl-4! font-medium text-primary">
                        <Link
                          to={`/cashier/requests/${request.id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {getCashierReferenceNumber(request)}
                        </Link>
                      </TableCell>
                      <TableCell className="py-2!">
                        <div className="min-w-0">
                          <p className="max-w-xs truncate font-medium text-foreground">
                            {getCashierPayorName(request) || "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2! text-right font-medium tabular-nums text-foreground">
                        {currencyFormatter.format(getCashierAmount(request))}
                      </TableCell>
                      <TableCell className="py-2!">
                        <StatusBadge status={statusValue} />
                      </TableCell>
                      <TableCell className="py-2! tabular-nums text-foreground">
                        {getCashierOrNo(request) || "—"}
                      </TableCell>
                      <TableCell className="py-2! text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(request.created_at ?? request.ref_date)}
                      </TableCell>
                      <TableCell className="py-2! text-center">
                        <Link
                          to={`/cashier/requests/${request.id}`}
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
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {query.data && (
          <CardFooter className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              {(query.data.meta.current_page - 1) * query.data.meta.per_page +
                (requests.length ? 1 : 0)}
              –
              {Math.min(
                query.data.meta.current_page * query.data.meta.per_page,
                query.data.meta.total,
              )}{" "}
              of {query.data.meta.total}
            </p>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    disabled={query.data.meta.current_page <= 1}
                    onClick={() =>
                      updateFilters({ page: query.data!.meta.current_page - 1 })
                    }
                  />
                </PaginationItem>
                {Array.from({ length: query.data.meta.last_page }).map(
                  (_, index) => {
                    const page = index + 1;
                    return page === 1 ||
                      page === query.data!.meta.last_page ||
                      Math.abs(page - query.data!.meta.current_page) <= 1 ? (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={page === query.data!.meta.current_page}
                          onClick={() => updateFilters({ page })}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ) : null;
                  },
                )}
                <PaginationItem>
                  <PaginationNext
                    disabled={
                      query.data.meta.current_page >= query.data.meta.last_page
                    }
                    onClick={() =>
                      updateFilters({ page: query.data!.meta.current_page + 1 })
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
