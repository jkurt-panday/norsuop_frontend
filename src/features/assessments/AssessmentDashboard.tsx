import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChartCard,
  BarChartCard,
  DonutChartCard,
  LineChartCard,
} from "@/components/charts";
import { api } from "../../api/client";
import { AssessmentDashboardSkeleton } from "./AssessmentDashboardSkeleton";

type DashboardData = {
  by_course: { course: string; total: number }[];
  by_semester: { semester: string; total: number }[];
  by_enrolled_under: { enrolled_under: string; total: number }[];
  monthly_trend: { month: string; total: number }[];
  daily_requests: { date: string; total: number }[];
  requests_trend: { value: number; recent: number; previous: number };
};

function useAssessmentDashboard() {
  return useQuery({
    queryKey: ["assessments", "dashboard"],
    queryFn: () =>
      api<{ data: DashboardData }>("/api/v1/assessments/dashboard"),
  });
}

export function AssessmentDashboard() {
  const dashboard = useAssessmentDashboard();

  if (dashboard.isPending) return <AssessmentDashboardSkeleton />;
  if (dashboard.isError)
    return (
      <main className="p-6 text-destructive">
        Unable to load assessments dashboard: {dashboard.error.message}
      </main>
    );

  const {
    by_course,
    by_semester,
    by_enrolled_under,
    monthly_trend,
    daily_requests,
    requests_trend,
  } = dashboard.data.data;
  return (
    <div className="min-h-screen w-full min-w-0 space-y-4 bg-page-background">
      <title>Dashboard Assessment</title>
      <Card className="rounded-2xl border border-border bg-card px-2! py-2! text-card-foreground shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between p-3">
          <CardTitle className="bg-[#3399FF] bg-clip-text font-['Poppins'] text-3xl font-black tracking-tight text-transparent sm:text-4xl">
            Assessments Dashboard
          </CardTitle>
        </CardHeader>
      </Card>
      <AreaChartCard
        title="Assessment Requests"
        description="Assessment requests over the last 30 days"
        data={daily_requests}
        xAxisKey="date"
        series={[{ key: "total", label: "Requests", color: "#007FFF" }]}
        height={200}
        xAxisInterval={4}
        footer={`${daily_requests[0]?.date ?? ""} – ${daily_requests[daily_requests.length - 1]?.date ?? ""}`}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DonutChartCard
          title="Assessments by Semester"
          data={by_semester.map((item) => ({
            category: item.semester,
            value: item.total,
            color:
              item.semester === "First Semester"
                ? "#1A8CFF"
                : item.semester === "Second Semester"
                  ? "#4DA5FF"
                  : "#99CCFF",
          }))}
        />
        <DonutChartCard
          title="Assessments by Enrollment Type"
          data={by_enrolled_under.map((item) => ({
            category: item.enrolled_under,
            value: item.total,
            color:
              item.enrolled_under === "Graduate"
                ? "#1A8CFF"
                : item.enrolled_under === "School of Law"
                  ? "#4DA5FF"
                  : "#99CCFF",
          }))}
        />
        <LineChartCard
          title="Monthly Trend"
          description="Last 6 months"
          data={monthly_trend}
          xAxisKey="month"
          series={[{ key: "total", label: "Assessments", color: "#007FFF" }]}
          height={200}
          className="lg:col-span-2"
        />
        <BarChartCard
          title="Assessments by Course"
          data={by_course}
          xAxisKey="course"
          series={[{ key: "total", label: "Assessments", color: "#007FFF" }]}
          height={200}
          className="lg:col-span-2"
        />
      </div>
      <p className="sr-only">
        Requests trend: {requests_trend.value}% compared with the prior 15 days.
      </p>
    </div>
  );
}
