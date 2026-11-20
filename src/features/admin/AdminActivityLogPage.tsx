import { useState, useEffect, useTransition } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Activity,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ActivityLogFilterParams,
  AdminActivityLogItem,
} from "./api";
import { useAdminActivityLogs } from "./queries";

const EVENT_UI: Record<
  string,
  { label: string; icon: typeof Activity; badgeClass: string }
> = {
  created: {
    label: "Created",
    icon: Plus,
    badgeClass:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border dark:border-emerald-800/40",
  },
  updated: {
    label: "Updated",
    icon: Pencil,
    badgeClass:
      "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-400 dark:border dark:border-amber-800/40",
  },
  deleted: {
    label: "Deleted",
    icon: Trash2,
    badgeClass:
      "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 dark:border dark:border-rose-800/40",
  },
  deactivated: {
    label: "Deactivated",
    icon: Trash2,
    badgeClass:
      "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-400 dark:border dark:border-orange-800/40",
  },
  reactivated: {
    label: "Reactivated",
    icon: RotateCcw,
    badgeClass:
      "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-400 dark:border dark:border-teal-800/40",
  },
  processed: {
    label: "Processed",
    icon: CheckCircle2,
    badgeClass:
      "bg-blue-100 text-blue-800 dark:bg-sky-950/60 dark:text-sky-400 dark:border dark:border-sky-800/40",
  },
};

const ACTION_OPTIONS = [
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "deleted", label: "Deleted" },
  { value: "processed", label: "Processed" },
];

function getEventUi(event: string) {
  return (
    EVENT_UI[event.toLowerCase()] ?? {
      label: event ? event.charAt(0).toUpperCase() + event.slice(1) : "Activity",
      icon: Activity,
      badgeClass:
        "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:border dark:border-slate-700/40",
    }
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function roleTextColorClass(role?: string | null) {
  switch ((role ?? "").toLowerCase()) {
    case "admin":
      return "text-emerald-700 dark:text-emerald-400 font-bold";
    case "staff":
      return "text-blue-700 dark:text-sky-400 font-bold";
    case "cashier":
      return "text-amber-700 dark:text-amber-400 font-bold";
    default:
      return "text-muted-foreground font-medium";
  }
}

export function AdminActivityLogPage() {
  const [, startTransition] = useTransition();

  // Filter inputs
  const [searchInput, setSearchInput] = useState("");
  const [actionInput, setActionInput] = useState("");
  const [dateFromInput, setDateFromInput] = useState("");
  const [dateToInput, setDateToInput] = useState("");

  const [activeFilters, setActiveFilters] = useState<ActivityLogFilterParams>({
    page: 1,
    per_page: 10,
    activity_search: "",
    activity_action: "",
    date_from: "",
    date_to: "",
    sort: "created_at",
    direction: "desc",
  });

  // Reset cooldown
  const [resetCooldown, setResetCooldown] = useState(0);

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setInterval(() => {
      setResetCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resetCooldown]);

  const canReset = resetCooldown === 0;

  const query = useAdminActivityLogs(activeFilters);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      setActiveFilters((prev) => ({
        ...prev,
        page: 1,
        activity_search: searchInput.trim(),
        activity_action: actionInput === "All" ? "" : actionInput,
        date_from: dateFromInput,
        date_to: dateToInput,
      }));
    });
  };

  const handleActionChange = (value: string) => {
    setActionInput(value);
    startTransition(() => {
      if (value === "Oldest") {
        setActiveFilters((prev) => ({
          ...prev,
          page: 1,
          sort: "created_at",
          direction: "asc",
        }));
      } else if (value === "Newest") {
        setActiveFilters((prev) => ({
          ...prev,
          page: 1,
          sort: "created_at",
          direction: "desc",
        }));
      } else {
        setActiveFilters((prev) => ({
          ...prev,
          page: 1,
          activity_action: value === "All" ? "" : value,
        }));
      }
    });
  };

  const handleReset = () => {
    if (!canReset) return;
    setSearchInput("");
    setActionInput("");
    setDateFromInput("");
    setDateToInput("");
    startTransition(() => {
      setActiveFilters({
        page: 1,
        per_page: 10,
        activity_search: "",
        activity_action: "",
        date_from: "",
        date_to: "",
        sort: "created_at",
        direction: "desc",
      });
    });
    query.refetch();
    setResetCooldown(5);
  };

  const hasFilters =
    activeFilters.activity_search ||
    activeFilters.activity_action ||
    activeFilters.date_from ||
    activeFilters.date_to;

  const handleSortClick = (columnKey: string) => {
    startTransition(() => {
      setActiveFilters((prev) => {
        const isActive = prev.sort === columnKey;
        const nextDir = isActive && prev.direction === "asc" ? "desc" : "asc";
        return {
          ...prev,
          page: 1,
          sort: columnKey,
          direction: nextDir,
        };
      });
    });
  };

  const setPage = (pageNumber: number) => {
    startTransition(() => {
      setActiveFilters((prev) => ({ ...prev, page: pageNumber }));
    });
  };

  const COLUMNS = [
    { label: "Event", width: "w-[130px]", sortable: "action" },
    { label: "Description", width: "min-w-[260px]" },
    { label: "Actor", width: "w-[220px]", sortable: "actor_name" },
    { label: "Type", width: "w-[150px]", sortable: "subject_type" },
    { label: "Date", width: "w-[180px]", sortable: "created_at" },
  ];

  const logs = query.data?.data ?? [];
  const meta = query.data?.meta ?? {
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  };

  const fromCount = (meta.current_page - 1) * meta.per_page + (logs.length > 0 ? 1 : 0);
  const toCount = (meta.current_page - 1) * meta.per_page + logs.length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="bg-gradient-to-r from-[#3399FF] to-[#1677d2] bg-clip-text font-['Poppins'] text-3xl font-black tracking-tight text-transparent sm:text-4xl dark:from-sky-400 dark:to-cyan-300">
            Activity Log
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            System-wide activity log — all user actions including logins,
            account creation, and modifications.
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border border-border bg-card shadow-sm">
        {/* Loading Bar */}
        <div className="relative h-0.5 w-full overflow-hidden bg-transparent">
          {query.isFetching && (
            <div className="absolute inset-0 animate-[table-loading-bar_1s_ease-in-out_infinite] bg-primary" />
          )}
        </div>
        <style>{`
          @keyframes table-loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>

        {/* Filter Toolbar */}
        <CardHeader className="border-b border-border px-6 py-3.5">
          <form
            onSubmit={handleSearchSubmit}
            className="flex w-full flex-wrap items-center gap-2"
          >
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search action, name, role, description..."
                className="h-9 pl-8 pr-8 text-xs"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchInput("")}
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Action / Sort Filter Select */}
            <div className="relative w-full sm:w-40">
              <select
                aria-label="Activity filter"
                className="h-9 w-full rounded-md border border-input bg-background px-3 pr-8 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={
                  actionInput ||
                  (activeFilters.sort === "created_at" &&
                  activeFilters.direction === "asc"
                    ? "Oldest"
                    : activeFilters.sort === "created_at" &&
                      activeFilters.direction === "desc"
                    ? "Newest"
                    : "All")
                }
                onChange={(e) => handleActionChange(e.target.value)}
              >
                <optgroup label="Activity filter">
                  <option value="All">All actions</option>
                  {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Sort by date">
                  <option value="Oldest">Oldest first</option>
                  <option value="Newest">Newest first</option>
                </optgroup>
              </select>
              {activeFilters.activity_action && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setActionInput("");
                    handleActionChange("All");
                  }}
                  aria-label="Clear action filter"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Date Range Inputs */}
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                aria-label="Date from"
                className="h-9 w-36 text-xs"
                value={dateFromInput}
                onChange={(e) => setDateFromInput(e.target.value)}
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                aria-label="Date to"
                className="h-9 w-36 text-xs"
                value={dateToInput}
                onChange={(e) => setDateToInput(e.target.value)}
              />
              {(activeFilters.date_from || activeFilters.date_to) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="h-9 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setDateFromInput("");
                    setDateToInput("");
                    startTransition(() => {
                      setActiveFilters((prev) => ({ ...prev, date_from: "", date_to: "", page: 1 }));
                    });
                  }}
                  aria-label="Clear date range"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <Button
              type="submit"
              size="sm"
              className="h-9 bg-primary text-xs text-primary-foreground hover:bg-primary/90"
            >
              <Search className="mr-1.5 h-3.5 w-3.5" />
              Search
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs"
              onClick={handleReset}
              disabled={query.isFetching || !canReset}
            >
              <RotateCcw className={`h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`} />
              <span>
                {query.isFetching
                  ? "Resetting..."
                  : !canReset
                    ? `Reset (${resetCooldown}s)`
                    : "Reset"}
              </span>
            </Button>
          </form>
        </CardHeader>

        {/* Audit Log Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table
              className={`transition-opacity duration-150 ${
                query.isFetching ? "opacity-60" : "opacity-100"
              }`}
            >
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/50 hover:bg-muted/50">
                  {COLUMNS.map((col) => {
                    const sortKeyName = col.sortable;
                    const isActive = sortKeyName
                      ? activeFilters.sort === sortKeyName
                      : false;

                    return (
                      <TableHead
                        key={col.label}
                        className={`${col.width} ${
                          col.label === "Event" ? "pl-6" : ""
                        } ${col.label === "Date" ? "pr-6" : ""} ${
                          sortKeyName
                            ? "cursor-pointer transition-colors select-none"
                            : ""
                        } ${
                          isActive
                            ? "bg-primary/10 font-bold text-primary"
                            : "hover:text-foreground"
                        }`}
                        onClick={
                          sortKeyName
                            ? () => handleSortClick(sortKeyName)
                            : undefined
                        }
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {col.label}
                          {sortKeyName &&
                            (isActive ? (
                              activeFilters.direction === "asc" ? (
                                <ArrowUp className="h-4 w-4 stroke-[2.5] text-primary" />
                              ) : (
                                <ArrowDown className="h-4 w-4 stroke-[2.5] text-primary" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />
                            ))}
                        </span>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>

              <TableBody>
                {query.isPending ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="py-4">
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No activity found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log: AdminActivityLogItem) => {
                    const eventName = log.event || log.action || "activity";
                    const ui = getEventUi(eventName);
                    const Icon = ui.icon;
                    const actorName = log.actor_name ?? "System";
                    const actorRole = log.actor_role ?? "—";

                    return (
                      <TableRow
                        key={log.id}
                        className="border-b border-border hover:bg-muted/50"
                      >
                        <TableCell className="pl-6">
                          <Badge
                            variant="secondary"
                            className={`gap-1 ${ui.badgeClass}`}
                          >
                            <Icon className="h-3 w-3" />
                            {ui.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          <div>{log.description}</div>
                          {log.changes && log.changes.length > 0 && (
                            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                              {log.changes.map((c, i) => (
                                <li
                                  key={i}
                                  className="flex flex-wrap items-center gap-1"
                                >
                                  <span className="font-medium text-foreground">
                                    {c.field}:
                                  </span>
                                  {c.old ? (
                                    <>
                                      <span className="line-through decoration-muted-foreground/60">
                                        {c.old}
                                      </span>
                                      <span className="text-muted-foreground">
                                        →
                                      </span>
                                    </>
                                  ) : null}
                                  <span className="text-foreground">
                                    {c.new ?? "—"}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          <span className="font-semibold text-foreground">
                            ({actorName})
                          </span>
                          {actorRole && actorRole !== "—" && (
                            <span
                              className={`ml-1.5 ${roleTextColorClass(actorRole)}`}
                            >
                              - {actorRole}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.type}
                        </TableCell>
                        <TableCell className="pr-6 text-sm text-muted-foreground whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {meta.total > 0 && (
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
              <p className="shrink-0 text-xs text-muted-foreground sm:text-sm">
                Showing {fromCount}-{toCount} of {meta.total} results
              </p>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  disabled={meta.current_page <= 1 || query.isFetching}
                  onClick={() => setPage(meta.current_page - 1)}
                  aria-label="Previous page"
                  className="h-8 w-8 shrink-0 rounded-md text-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  Page {meta.current_page} of {meta.last_page}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  disabled={
                    meta.current_page >= meta.last_page || query.isFetching
                  }
                  onClick={() => setPage(meta.current_page + 1)}
                  aria-label="Next page"
                  className="h-8 w-8 shrink-0 rounded-md text-sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
