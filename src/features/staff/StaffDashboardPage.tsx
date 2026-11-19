import { Link } from "react-router";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Activity,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useStaffDashboard } from "./queries";

const STATUS_BADGE_CLASSES: Record<string, string> = {
  unprocessed:
    "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:border dark:border-slate-700/40",
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-800/40",
  processed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/40",
  paid:
    "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:border dark:border-blue-800/40",
  cancelled:
    "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 dark:border dark:border-rose-800/40",
};

function formatDate(value?: string | null) {
  if (!value) return "No activity";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export function StaffDashboardPage() {
  const query = useStaffDashboard();

  if (query.isPending) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const d = query.data?.data;
  const requestsOverTime = d?.requestsOverTime ?? [];
  const statusBreakdown = d?.statusBreakdown ?? [];
  const requestsByMembership = d?.requestsByMembership ?? [];
  const recentRequests = d?.recentRequests ?? [];
  const recentActivity = d?.recentActivity ?? [];

  const maxDailyCount = Math.max(...requestsOverTime.map((r) => r.count), 1);
  const totalRequests = d?.totalRequests ?? 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      {/* Header Banner */}
      <Card className="rounded-2xl bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <div>
            <CardTitle className="font-['Poppins'] text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              Staff Operational Dashboard
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time monitor of student Order of Payment requests, processing bottlenecks, and daily trends.
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

      {/* KPI Cards: Total, Unprocessed, Pending, Processed, Paid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Requests */}
        <Card className="rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Requests
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{d?.totalRequests ?? 0}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Latest: {formatDate(d?.totalRequestsLastDate)}
          </p>
        </Card>

        {/* Unprocessed */}
        <Card className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Unprocessed
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{d?.unprocessedRequests ?? 0}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Awaiting initial review
          </p>
        </Card>

        {/* Pending */}
        <Card className="rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{d?.pendingRequests ?? 0}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Awaiting cashier settlement
          </p>
        </Card>

        {/* Processed */}
        <Card className="rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Processed
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{d?.processedRequests ?? 0}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Ready for payment collection
          </p>
        </Card>

        {/* Paid */}
        <Card className="rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Paid
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{d?.paidRequests ?? 0}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Completed transactions
          </p>
        </Card>
      </div>

      {/* 30-Day Activity Sparkline */}
      {requestsOverTime.length > 0 && (
        <Card className="border border-border p-5">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold text-foreground">
              Order of Payment Request Volume (Last 30 Days)
            </CardTitle>
            <CardDescription>Daily intake across all offices and departments</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex h-36 items-end gap-1.5 pt-4">
              {requestsOverTime.map((item, idx) => {
                const heightPct = Math.round((item.count / maxDailyCount) * 100);
                return (
                  <div
                    key={idx}
                    className="group relative flex-1 flex flex-col items-center h-full justify-end"
                  >
                    <div
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                      className="w-full rounded-t bg-primary/80 transition-all hover:bg-primary"
                    />
                    <div className="absolute -top-7 hidden rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-white shadow group-hover:block z-10 whitespace-nowrap">
                      {item.date}: {item.count}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
              <span>{requestsOverTime[0]?.date}</span>
              <span>{requestsOverTime[requestsOverTime.length - 1]?.date}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Breakdown & Memberships */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Breakdown */}
        <Card className="border border-border p-5">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold text-foreground">
              Status Distribution
            </CardTitle>
            <CardDescription>Breakdown by processing state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            {statusBreakdown.map((item, index) => {
              const pct = totalRequests > 0 ? Math.round((item.count / totalRequests) * 100) : 0;
              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="font-mono text-muted-foreground">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Requests by Membership */}
        <Card className="border border-border p-5">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold text-foreground">
              Requests by Membership Category
            </CardTitle>
            <CardDescription>Distribution across student and client categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            {requestsByMembership.length === 0 ? (
              <p className="text-sm text-muted-foreground">No membership data available.</p>
            ) : (
              requestsByMembership.map((item, index) => {
                const pct = totalRequests > 0 ? Math.round((item.count / totalRequests) * 100) : 0;
                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">{item.name}</span>
                      </div>
                      <span className="font-mono text-muted-foreground">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Requests Table */}
        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Recent OP Requests
              </CardTitle>
              <CardDescription>Latest submissions requiring attention</CardDescription>
            </div>
            <Link
              to="/staff/requests"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No recent requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        {req.reference_number}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {req.full_name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            STATUS_BADGE_CLASSES[req.status] ??
                            STATUS_BADGE_CLASSES.unprocessed
                          }
                        >
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to={`/staff/requests/${req.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Process
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Staff Activity Trail */}
        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Staff Audit Activity
              </CardTitle>
              <CardDescription>Audit actions recorded across the portal</CardDescription>
            </div>
            <Link
              to="/staff/activity-log"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Full Log <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="divide-y divide-border">
              {recentActivity.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No recent staff activity logged yet.
                </p>
              ) : (
                recentActivity.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 py-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground leading-snug">
                        {log.description}
                      </p>
                      <span className="text-[11px] text-muted-foreground">
                        {formatRelativeTime(log.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
