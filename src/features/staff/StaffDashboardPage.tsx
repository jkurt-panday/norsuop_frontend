import { useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ActivityLogList,
  ChartCard,
  StatCard,
  getDayLabel,
  useReloadCooldown,
} from "./dashboard-components";
import type { StaffDashboardData } from "./api";
import { useStaffDashboard } from "./queries";

const statusBadgeClass = (status?: string) => {
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

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

export function StaffDashboardPage() {
  const query = useStaffDashboard();

  const refetch = query.refetch;

  const handleReload = useCallback(() => refetch(), [refetch]);

  const {
    reload: handleDashboardReload,
    isReloading: isDashboardReloading,
    cooldown: reloadCooldown,
    canReload,
  } = useReloadCooldown(handleReload);

  if (query.isPending) {
    return (
      <div className="w-full space-y-5">
          <Skeleton className="h-28 w-full rounded-3xl" />
          <div className="grid gap-5 md:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-3xl" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl lg:col-span-2" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
    );
  }

  const d = query.data?.data;

  const {
    totalRequests = 0,
    pendingRequests = 0,
    processedRequests = 0,
    paidRequests = 0,
    cancelledRequests = 0,
    unprocessedRequests = 0,
    totalRequestsLastDate = null,
    pendingLastDate = null,
    processedLastDate = null,
    paidLastDate = null,
    cancelledLastDate = null,
    unprocessedLastDate = null,
    statusBreakdown = [],
    requestsOverTime = [],
    requestsByMembership = [],
    recentRequests: allRecentRequests = [],
    recentActivity = [],
  } = d ?? ({} as Partial<StaffDashboardData>);

  // Only show requests created today — anything before or after today is excluded.
  const todayStr = new Date().toDateString();
  const recentRequests = allRecentRequests.filter(
    (request) =>
      request.created_at &&
      new Date(request.created_at).toDateString() === todayStr,
  );

  return (
    <div className="w-full">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="bg-[#3399FF] bg-clip-text font-['Poppins'] text-3xl font-black tracking-tight text-transparent sm:text-4xl">
              Dashboard
            </div>
            <p className="text-sm text-muted-foreground">
              Staff dashboard overview for requests and activity.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-right text-sm text-muted-foreground md:text-base">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleDashboardReload}
              disabled={!canReload}
              title={
                reloadCooldown > 0
                  ? `Wait ${reloadCooldown}s to reload`
                  : "Reload dashboard"
              }
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isDashboardReloading ? "animate-spin" : ""
                }`}
              />
              <span>
                {isDashboardReloading
                  ? "Reloading..."
                  : reloadCooldown > 0
                    ? `Reload (${reloadCooldown}s)`
                    : "Reload"}
              </span>
            </Button>
            <p>
              Total Requests:{" "}
              <span className="font-semibold text-foreground">
                {totalRequests}
              </span>
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid gap-5 md:grid-cols-6">
          <StatCard
            label="Total Requests"
            value={totalRequests}
            bgClass="bg-card border border-border"
            textClass="text-foreground"
            subtitle={getDayLabel(totalRequestsLastDate)}
          />
          <StatCard
            label="Pending"
            value={pendingRequests}
            bgClass="bg-amber-500/10 border border-amber-500/20"
            textClass="text-amber-600 dark:text-amber-400"
            subtitle={getDayLabel(pendingLastDate)}
          />
          <StatCard
            label="Processed"
            value={processedRequests}
            bgClass="bg-green-900/10 border border-green-700/30 dark:bg-green-900/20 dark:border-green-600/30"
            textClass="text-green-700 dark:text-green-300"
            subtitle={getDayLabel(processedLastDate)}
          />
          <StatCard
            label="Paid"
            value={paidRequests}
            bgClass="bg-green-100/30 border border-green-300/40 dark:bg-green-900/30 dark:border-green-700/40"
            textClass="text-green-700 dark:text-green-300"
            subtitle={getDayLabel(paidLastDate)}
          />
          <StatCard
            label="Cancelled"
            value={cancelledRequests}
            bgClass="bg-rose-500/10 border border-rose-500/20"
            textClass="text-rose-600 dark:text-rose-400"
            subtitle={getDayLabel(cancelledLastDate)}
          />
          <StatCard
            label="Unprocessed"
            value={unprocessedRequests}
            bgClass="bg-slate-500/10 border border-slate-500/20"
            textClass="text-slate-600 dark:text-slate-300"
            subtitle={getDayLabel(unprocessedLastDate)}
          />
        </div>

        {/* Charts */}
        <div className="mt-2 grid gap-4 lg:grid-cols-3">
          <ChartCard
            title="OP Requests by Status"
            description="Current breakdown of all requests"
            type="pie"
            data={statusBreakdown}
            xKey="name"
            yKey="count"
            pieColors={["#94a3b8", "#f59e0b", "#3b82f6", "#ef4444", "#22c55e"]}
          />
          <div className="lg:col-span-2">
            <ChartCard
              title="OP Requests Over the Last 30 Days"
              description="Daily request volume, rolling window"
              type="line"
              data={requestsOverTime}
              xKey="date"
              yKey="count"
            />
          </div>
        </div>

        <div className="mt-4">
          <ChartCard
            title="OP Requests by Membership"
            description="Total requests submitted per membership type"
            type="bar"
            data={requestsByMembership}
            xKey="name"
            yKey="count"
            height={240}
          />
        </div>

        {/* Recent Requests + Activity Log */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">
                Recent Requests
              </h2>
            </div>
            <div className="p-4">
              {recentRequests.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full table-fixed text-left text-sm text-foreground">
                    <thead className="sticky top-0 z-10 border-b border-border bg-card">
                      <tr>
                        <th className="w-[25%] pb-3 font-medium text-muted-foreground">
                          Reference
                        </th>
                        <th className="w-[25%] pb-3 font-medium text-muted-foreground">
                          Name
                        </th>
                        <th className="w-[20%] pb-3 font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="w-[20%] pb-3 font-medium text-muted-foreground">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentRequests.map((request) => (
                        <tr key={request.id}>
                          <td className="py-3">
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium whitespace-nowrap text-slate-700 dark:border dark:border-slate-700/40 dark:bg-slate-800/60 dark:text-slate-300">
                              {request.reference_number}
                            </span>
                          </td>
                          <td className="py-3 text-foreground">
                            {request.full_name}
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                                request.status,
                              )}`}
                            >
                              {request.status
                                ? request.status.charAt(0).toUpperCase() +
                                  request.status.slice(1)
                                : "Unprocessed"}
                            </span>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {formatDate(request.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  No recent requests
                </p>
              )}
            </div>
          </section>

          <ActivityLogList
            title="Recent OP Activity"
            logs={recentActivity}
            limit={20}
            maxVisible={10}
          />
        </div>
    </div>
  );
}
