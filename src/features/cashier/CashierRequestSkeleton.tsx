import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CashierRequestSkeleton() {
  return (
    <div className="min-h-screen w-full min-w-0 space-y-4 bg-page-background" aria-busy="true" aria-label="Loading cashier payment requests">
      <Card className="rounded-2xl bg-card px-2! py-2! shadow-sm">
        <CardHeader className="p-3">
          <Skeleton className="h-10 w-80 max-w-full rounded-lg" />
          <Skeleton className="mt-2 h-4 w-96 max-w-full rounded-lg" />
        </CardHeader>
      </Card>
      <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 min-w-0 flex-1 rounded-xl" />
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="size-10 rounded-xl" />
          </div>
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/70 bg-muted/20 p-3">
            <div className="space-y-2"><Skeleton className="h-3 w-20" /><div className="flex gap-2"><Skeleton className="h-10 w-40 rounded-lg" /><Skeleton className="h-10 w-40 rounded-lg" /></div></div>
            <div className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-10 w-44 rounded-lg" /></div>
          </div>
        </CardContent>
      </Card>
      <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <CardContent className="overflow-hidden p-0">
          <div className="flex h-11 items-center gap-4 border-b px-4">{Array.from({ length: 7 }, (_, index) => <Skeleton key={index} className="h-4 flex-1" />)}</div>
          {Array.from({ length: 8 }, (_, row) => <div key={row} className="flex h-14 items-center gap-4 border-b px-4">{Array.from({ length: 7 }, (_, column) => <Skeleton key={column} className={`h-4 flex-1 ${column === 6 ? "max-w-24" : ""}`} />)}</div>)}
        </CardContent>
        <CardFooter className="flex items-center justify-between px-4 py-3"><Skeleton className="h-4 w-44" /><div className="flex gap-2"><Skeleton className="h-8 w-20 rounded-lg" /><Skeleton className="size-8 rounded-lg" /><Skeleton className="size-8 rounded-lg" /></div></CardFooter>
      </Card>
    </div>
  );
}
