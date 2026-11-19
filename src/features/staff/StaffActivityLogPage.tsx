import { useState, useTransition } from "react";
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
import type { StaffActivityLogFilterParams, StaffActivityLogItem } from "./api";
import { useStaffActivityLogs } from "./queries";

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

function roleBadgeClass(role: string | null) {
  switch ((role ?? "").toLowerCase()) {
    case "admin":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/40";
    case "staff":
      return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 dark:border dark:border-purple-800/40";
    case "cashier":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-800/40";
    default:
      return "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:border dark:border-slate-700/40";
  }
}

export function StaffActivityLogPage() {
  const [, startTransition] = useTransition();

  const [filters, setFilters] = useState<StaffActivityLogFilterParams>({
    page: 1,
    per_page: 10,
    activity_search: "",
    activity_action: "",
    date_from: "",
    date_to: "",
    sort: "created_at",
    direction: "desc",
  });

  const query = useStaffActivityLogs(filters);

  const handleSearchChange = (val: string) => {
    startTransition(() => {
      setFilters((prev) => ({ ...prev, activity_search: val, page: 1 }));
    });
  };

  const handleActionChange = (actionVal: string) => {
    startTransition(() => {
      setFilters((prev) => ({
        ...prev,
        activity_action: prev.activity_action === actionVal ? "" : actionVal,
        page: 1,
      }));
    });
  };

  const handleDateChange = (field: "date_from" | "date_to", val: string) => {
    startTransition(() => {
      setFilters((prev) => ({ ...prev, [field]: val, page: 1 }));
    });
  };

  const toggleSort = (col: string) => {
    startTransition(() => {
      setFilters((prev) => ({
        ...prev,
        sort: col,
        direction: prev.sort === col && prev.direction === "asc" ? "desc" : "asc",
        page: 1,
      }));
    });
  };

  const getSortIcon = (col: string) => {
    if (filters.sort !== col) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/60" />;
    }
    return filters.direction === "asc" ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary" />
    );
  };

  const logs = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <Card className="rounded-2xl bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <div>
            <CardTitle className="font-['Poppins'] text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              Staff Activity Log
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Audit trail of requests processed, student linkings, and ledger modifications.
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

      {/* Filter and Search Bar */}
      <Card className="rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search audit trail, actor, or description..."
                value={filters.activity_search ?? ""}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Action:
              </span>
              {ACTION_OPTIONS.map((opt) => {
                const isSelected = filters.activity_action === opt.value;
                return (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleActionChange(opt.value)}
                  >
                    {opt.label}
                  </Button>
                );
              })}
              {filters.activity_action && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground"
                  onClick={() => handleActionChange("")}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Date range row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">From:</span>
              <Input
                type="date"
                value={filters.date_from ?? ""}
                onChange={(e) => handleDateChange("date_from", e.target.value)}
                className="h-8 w-38 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">To:</span>
              <Input
                type="date"
                value={filters.date_to ?? ""}
                onChange={(e) => handleDateChange("date_to", e.target.value)}
                className="h-8 w-38 text-xs"
              />
            </div>
            {(filters.date_from || filters.date_to) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => {
                  setFilters((prev) => ({ ...prev, date_from: "", date_to: "", page: 1 }));
                }}
              >
                Reset Dates
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Activity Table */}
      <Card className="overflow-hidden rounded-2xl shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("action")}
                >
                  <div className="flex items-center">
                    Action {getSortIcon("action")}
                  </div>
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("subject_type")}
                >
                  <div className="flex items-center">
                    Entity {getSortIcon("subject_type")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("actor_name")}
                >
                  <div className="flex items-center">
                    Actor {getSortIcon("actor_name")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right"
                  onClick={() => toggleSort("created_at")}
                >
                  <div className="flex items-center justify-end">
                    Timestamp {getSortIcon("created_at")}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isPending ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No activity logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const ui = getEventUi(log.event);
                  const Icon = ui.icon;
                  return (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Badge className={`gap-1.5 font-medium ${ui.badgeClass}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {ui.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm font-medium text-foreground leading-snug">
                          {log.description}
                        </p>
                        {log.changes && log.changes.length > 0 && (
                          <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                            {log.changes.map((change, cIdx) => (
                              <div key={cIdx} className="font-mono">
                                <span className="font-semibold text-foreground">{change.field}:</span>{" "}
                                <span className="line-through text-destructive">{change.old ?? "none"}</span>{" "}
                                &rarr; <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{change.new}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {log.type}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm text-foreground">
                          {log.actor_name || "System"}
                        </div>
                        {log.actor_role && (
                          <Badge className={`mt-0.5 text-[10px] ${roleBadgeClass(log.actor_role)}`}>
                            {log.actor_role.toUpperCase()}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatDateTime(log.created_at)}
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
            Page <span className="font-medium text-foreground">{meta.current_page}</span> of{" "}
            <span className="font-medium text-foreground">{meta.last_page}</span> ({meta.total} events)
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
    </div>
  );
}
