import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ChartSkeleton({ className = "" }: { className?: string }) {
  return (
    <Card className={`rounded-2xl border border-border bg-card shadow-sm ${className}`}>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-52 w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}

export function AssessmentDashboardSkeleton() {
  return (
    <div
      className="min-h-screen w-full min-w-0 space-y-4 bg-page-background"
      aria-busy="true"
      aria-label="Loading assessments dashboard"
    >
      <Card className="rounded-2xl border border-border bg-card px-2! py-2! shadow-sm">
        <CardHeader className="p-3">
          <Skeleton className="h-10 w-80 rounded-lg" />
          <Skeleton className="mt-2 h-4 w-[34rem] max-w-full rounded-lg" />
        </CardHeader>
      </Card>

      <ChartSkeleton />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartSkeleton className="min-h-[360px]" />
        <ChartSkeleton className="min-h-[360px]" />
        <ChartSkeleton className="lg:col-span-2" />
        <ChartSkeleton className="lg:col-span-2" />
      </div>
    </div>
  );
}
