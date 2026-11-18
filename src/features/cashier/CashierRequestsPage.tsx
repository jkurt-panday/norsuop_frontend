import { useState, useTransition } from "react";
import { Link } from "react-router";
import {
  Search,
  Filter,
  RotateCcw,
  Calendar,
  CreditCard,
  Inbox,
  CheckCircle2,
  Receipt,
  Eye,
} from "lucide-react";
import { ApiError } from "../../api/client";
import {
  getCashierAmount,
  getCashierEmail,
  getCashierOrDate,
  getCashierOrNo,
  getCashierPayorName,
  getCashierReferenceNumber,
  getCashierStatus,
  type CashierFilters,
  type CashierRequest,
} from "./api";
import { useCashierRequests } from "./queries";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

function formatDate(dateStr?: string | null) {
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

export function CashierRequestsPage() {
  const [, startTransition] = useTransition();

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
  });

  const query = useCashierRequests(activeFilters);

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
      });
    });
  };

  const setPage = (pageNumber: number) => {
    startTransition(() => {
      setActiveFilters((prev) => ({ ...prev, page: pageNumber }));
    });
  };

  const isFiltered =
    !!activeFilters.search ||
    !!activeFilters.status ||
    !!activeFilters.date_from ||
    !!activeFilters.date_to;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Cashier Payment Requests
          </h1>
          <p className="text-sm text-muted-foreground">
            Review approved orders of payment and record official receipts.
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="border-border shadow-sm">
        <CardContent className="pt-4">
          <form onSubmit={handleApplyFilters} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8 text-sm"
                  placeholder="Search OR #, reference, name, email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search requests"
                />
              </div>

              {/* Status Select */}
              <div>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                  aria-label="Filter by status"
                  className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">All Statuses</option>
                  <option value="processed">Ready for Payment (Processed)</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Date From */}
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-8 text-sm"
                  placeholder="Date From"
                  value={dateFromInput}
                  onChange={(e) => setDateFromInput(e.target.value)}
                  aria-label="Date from"
                />
              </div>

              {/* Date To */}
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-8 text-sm"
                  placeholder="Date To"
                  value={dateToInput}
                  onChange={(e) => setDateToInput(e.target.value)}
                  aria-label="Date to"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              {isFiltered && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="gap-1 text-xs text-muted-foreground"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Reset</span>
                </Button>
              )}
              <Button type="submit" size="sm" className="gap-1 text-xs">
                <Filter className="size-3.5" />
                <span>Apply Filters</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="border-border shadow-sm">
        {query.isPending ? (
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
        ) : query.isError ? (
          <div className="py-12 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Inbox className="size-6" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              Failed to load cashier requests
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {query.error instanceof ApiError
                ? query.error.message
                : "A network or server error occurred while retrieving payment requests."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void query.refetch()}
              className="text-xs"
            >
              Try again
            </Button>
          </div>
        ) : query.data.data.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Receipt className="size-6" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              No payment requests found
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isFiltered
                ? "No requests match your current filters. Try adjusting your search query or date range."
                : "There are no pending or paid cashier requests at this time."}
            </p>
            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs gap-1"
              >
                <RotateCcw className="size-3" />
                <span>Clear filters</span>
              </Button>
            )}
          </div>
        ) : (
          <div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[180px]">Reference #</TableHead>
                  <TableHead>Payor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>OR Number</TableHead>
                  <TableHead>Processed Date</TableHead>
                  <TableHead className="text-right pr-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.data.map((request: CashierRequest) => {
                  const refNum = getCashierReferenceNumber(request);
                  const payorName = getCashierPayorName(request);
                  const email = getCashierEmail(request);
                  const amount = getCashierAmount(request);
                  const status = getCashierStatus(request);
                  const orNo = getCashierOrNo(request);

                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        <Link
                          to={`/cashier/requests/${request.id}`}
                          className="font-semibold text-primary hover:underline font-mono"
                        >
                          {refNum}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-xs">
                            {payorName || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-foreground">
                        {currencyFormatter.format(amount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={status} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {orNo ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {orNo}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(request.created_at ?? request.ref_date)}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Button
                          variant={status === "paid" ? "ghost" : "default"}
                          size="sm"
                          asChild
                          className="h-7 text-xs gap-1"
                        >
                          <Link to={`/cashier/requests/${request.id}`}>
                            {status === "paid" ? (
                              <>
                                <Eye className="size-3.5" />
                                <span>View</span>
                              </>
                            ) : (
                              <>
                                <CreditCard className="size-3.5" />
                                <span>Record Payment</span>
                              </>
                            )}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            {query.data.meta && query.data.meta.last_page > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t px-4 py-3 bg-muted/20">
                <div className="text-xs text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {(query.data.meta.current_page - 1) * query.data.meta.per_page + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-foreground">
                    {Math.min(
                      query.data.meta.current_page * query.data.meta.per_page,
                      query.data.meta.total
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {query.data.meta.total}
                  </span>{" "}
                  entries
                </div>

                <Pagination className="mx-0 w-auto justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        disabled={query.data.meta.current_page <= 1}
                        onClick={() => setPage(query.data.meta.current_page - 1)}
                      />
                    </PaginationItem>

                    {Array.from({ length: query.data.meta.last_page }).map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === query.data.meta.last_page ||
                        Math.abs(pageNum - query.data.meta.current_page) <= 1
                      ) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              isActive={pageNum === query.data.meta.current_page}
                              onClick={() => setPage(pageNum)}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext
                        disabled={query.data.meta.current_page >= query.data.meta.last_page}
                        onClick={() => setPage(query.data.meta.current_page + 1)}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
