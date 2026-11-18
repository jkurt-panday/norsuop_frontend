import { RefreshCw, TrendingUp, TrendingDown, BookOpen, GraduationCap, Calendar, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssessmentDashboard } from "./queries";

export function AssessmentDashboardPage() {
  const query = useAssessmentDashboard();

  if (query.isPending) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const data = query.data?.data;
  const byCourse = data?.by_course ?? [];
  const bySemester = data?.by_semester ?? [];
  const byEnrolledUnder = data?.by_enrolled_under ?? [];
  const monthlyTrend = data?.monthly_trend ?? [];
  const dailyRequests = data?.daily_requests ?? [];
  const requestsTrend = data?.requests_trend ?? { value: 0, recent: 0, previous: 0 };

  const totalAssessments = byEnrolledUnder.reduce((sum, item) => sum + (item.total || 0), 0);
  const maxCourseTotal = Math.max(...byCourse.map((c) => c.total), 1);
  const maxMonthTotal = Math.max(...monthlyTrend.map((m) => m.total), 1);
  const maxDailyTotal = Math.max(...dailyRequests.map((d) => d.total), 1);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      {/* Header Banner */}
      <Card className="rounded-2xl bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <div>
            <CardTitle className="font-['Poppins'] text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              Assessments Analytics Dashboard
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time summary, enrollment demographics, and request trends.
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

      {/* KPI Trend Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Assessments
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-foreground">{totalAssessments}</div>
          <p className="mt-1 text-xs text-muted-foreground">Cumulative assessment requests logged</p>
        </Card>

        <Card className="border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              30-Day Trend
            </span>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                requestsTrend.value >= 0
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
              }`}
            >
              {requestsTrend.value >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-foreground">
            {requestsTrend.value > 0 ? `+${requestsTrend.value}%` : `${requestsTrend.value}%`}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {requestsTrend.recent} requests (last 15d) vs {requestsTrend.previous} (prior 15d)
          </p>
        </Card>

        <Card className="border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Semesters
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-foreground">{bySemester.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">Academic terms with student submissions</p>
        </Card>
      </div>

      {/* 30-Day Daily Activity Sparkline / Histogram */}
      {dailyRequests.length > 0 && (
        <Card className="border border-border p-5">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold text-foreground">
              Daily Assessment Volume (Last 30 Days)
            </CardTitle>
            <CardDescription>Visual distribution of daily requests</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex h-32 items-end gap-1 pt-4">
              {dailyRequests.map((d, index) => {
                const heightPct = Math.round((d.total / maxDailyTotal) * 100);
                return (
                  <div
                    key={index}
                    className="group relative flex-1 flex flex-col items-center h-full justify-end"
                  >
                    <div
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                      className="w-full rounded-t bg-primary/80 transition-all hover:bg-primary"
                    />
                    <div className="absolute -top-7 hidden rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-white shadow group-hover:block z-10 whitespace-nowrap">
                      {d.date}: {d.total}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
              <span>{dailyRequests[0]?.date}</span>
              <span>{dailyRequests[dailyRequests.length - 1]?.date}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two Column Grid: Semester Breakdown & Enrollment Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* By Semester */}
        <Card className="border border-border p-5">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold text-foreground">
              Assessments by Semester
            </CardTitle>
            <CardDescription>Volume distribution across semesters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            {bySemester.length === 0 ? (
              <p className="text-sm text-muted-foreground">No semester data available.</p>
            ) : (
              bySemester.map((item, index) => {
                const pct = totalAssessments > 0 ? Math.round((item.total / totalAssessments) * 100) : 0;
                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{item.semester}</span>
                      <span className="font-mono text-muted-foreground">
                        {item.total} ({pct}%)
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
              })
            )}
          </CardContent>
        </Card>

        {/* By Enrollment Type */}
        <Card className="border border-border p-5">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold text-foreground">
              Assessments by Enrollment Type
            </CardTitle>
            <CardDescription>Undergraduate, Graduate, and Law breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            {byEnrolledUnder.length === 0 ? (
              <p className="text-sm text-muted-foreground">No enrollment data available.</p>
            ) : (
              byEnrolledUnder.map((item, index) => {
                const pct = totalAssessments > 0 ? Math.round((item.total / totalAssessments) * 100) : 0;
                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">{item.enrolled_under}</span>
                      </div>
                      <span className="font-mono text-muted-foreground">
                        {item.total} ({pct}%)
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

      {/* Monthly Trend & Course Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Trend */}
        <Card className="border border-border p-5">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold text-foreground">
              Monthly Trend (Last 6 Months)
            </CardTitle>
            <CardDescription>Month-over-month submission count</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-0">
            {monthlyTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground">No monthly records yet.</p>
            ) : (
              monthlyTrend.map((item, index) => {
                const widthPct = Math.round((item.total / maxMonthTotal) * 100);
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">{item.month}</span>
                      <span className="font-mono text-muted-foreground">{item.total}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${Math.max(widthPct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Top Courses */}
        <Card className="border border-border p-5">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold text-foreground">
              Assessments by Course
            </CardTitle>
            <CardDescription>Breakdown by academic program</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-0">
            {byCourse.length === 0 ? (
              <p className="text-sm text-muted-foreground">No course data available.</p>
            ) : (
              byCourse.map((item, index) => {
                const widthPct = Math.round((item.total / maxCourseTotal) * 100);
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground truncate max-w-[280px]">
                        {item.course}
                      </span>
                      <span className="font-mono text-muted-foreground">{item.total}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${Math.max(widthPct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
