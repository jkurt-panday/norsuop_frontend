import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CashierRequestDetailSkeleton() {
  return (
    <div className="min-h-screen w-full min-w-0 space-y-6 bg-page-background" aria-busy="true" aria-label="Loading cashier payment request">
      <Card className="rounded-2xl border border-border/70 bg-card px-2! py-2! shadow-sm">
        <CardHeader className="flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div><Skeleton className="h-10 w-72 max-w-full rounded-lg" /><Skeleton className="mt-2 h-3 w-48 rounded-lg" /></div>
          <div className="flex gap-3"><Skeleton className="h-7 w-20 rounded-full" /><Skeleton className="h-8 w-16 rounded-lg" /></div>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card><CardHeader className="border-b"><Skeleton className="h-6 w-64" /><Skeleton className="mt-2 h-3 w-72" /></CardHeader><CardContent className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">{Array.from({ length: 6 }, (_, index) => <div key={index} className="space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-6 w-44 max-w-full" /></div>)}</CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4"><Skeleton className="size-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-64 max-w-full" /></div></CardContent></Card>
        </div>
        <Card><CardHeader className="border-b"><Skeleton className="h-6 w-40" /><Skeleton className="mt-2 h-3 w-64 max-w-full" /></CardHeader><CardContent className="space-y-5 p-6"><Skeleton className="h-3 w-28" /><Skeleton className="h-11 w-full rounded-lg" /><Skeleton className="h-3 w-36" /><Skeleton className="h-11 w-full rounded-lg" /><Skeleton className="h-3 w-20" /><Skeleton className="h-11 w-full rounded-lg" /><Skeleton className="h-11 w-full rounded-lg" /></CardContent></Card>
      </div>
    </div>
  );
}
