import { Link } from "react-router";
import { Users, Shield, CreditCard, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "../../api/client";
import { useAdminDashboard } from "./queries";

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

function eventBadgeClass(event: string) {
  switch ((event ?? "").toLowerCase()) {
    case "created":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/40";
    case "updated":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-800/40";
    case "deleted":
    case "deactivated":
      return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 dark:border dark:border-rose-800/40";
    case "reactivated":
      return "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 dark:border dark:border-teal-800/40";
    default:
      return "bg-blue-100 text-blue-800 dark:bg-sky-950/60 dark:text-sky-300 dark:border dark:border-sky-800/40";
  }
}

export function AdminDashboardPage() {
  const query = useAdminDashboard();

  if (query.isPending) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-xl font-bold text-destructive">
          Unable to load dashboard
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {query.error instanceof ApiError
            ? query.error.message
            : "Dashboard loading failed."}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => void query.refetch()}
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Try again
        </Button>
      </Card>
    );
  }

  const stats = query.data?.data ?? {
    staff_count: 0,
    admin_count: 0,
    cashier_count: 0,
    recent_activity: [],
  };

  const recentActivity = stats.recent_activity ?? [];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="bg-[#3399FF] bg-clip-text font-['Poppins'] text-3xl font-black tracking-tight text-transparent sm:text-4xl">
            Admin Dashboard
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            System overview and user statistics.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Staff Users
            </CardTitle>
            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats.staff_count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active staff accounts
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cashiers
            </CardTitle>
            <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats.cashier_count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active cashier accounts
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Administrators
            </CardTitle>
            <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats.admin_count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              System administrators
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
          <CardTitle className="text-lg font-semibold text-foreground">
            Recent System Activity
          </CardTitle>
          <Button variant="outline" size="sm">
            <Link to="/admin/activity-log" className="gap-1.5 text-xs font-medium">
              View all activity
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/50 hover:bg-muted/50">
                  <TableHead className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Action
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Description
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Actor
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Type
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="px-6 py-10 text-center text-sm text-muted-foreground"
                    >
                      No recent activity.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentActivity.slice(0, 10).map((log) => {
                    const eventName = log.event || log.action || "activity";
                    return (
                      <TableRow key={log.id} className="hover:bg-muted/50">
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${eventBadgeClass(
                              eventName,
                            )}`}
                          >
                            {eventName.charAt(0).toUpperCase() +
                              eventName.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-md truncate px-6 py-4 text-sm text-foreground">
                          {log.description}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {log.actor_name ?? "System"}
                            </span>
                            {log.actor_role && (
                              <Badge
                                variant="secondary"
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadgeClass(
                                  log.actor_role,
                                )}`}
                              >
                                {log.actor_role}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">
                          {log.type}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">
                          {formatDateTime(log.created_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
