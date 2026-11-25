import { LightModeWrapper } from "@/components/ui/LightModeWrapper";

export function OpFormSkeleton() {
  return (
    <LightModeWrapper>
      <main
        className="min-h-screen bg-linear-to-b from-blue-500 via-slate-300 to-white px-3 py-6 sm:px-6 sm:py-12"
        aria-busy="true"
        aria-label="Loading order of payment form"
      >
      <div className="mx-auto max-w-4xl animate-pulse">
        <div className="mb-6 rounded-2xl border border-blue-100 bg-white px-4 py-8 shadow-md sm:px-8">
          <div className="mx-auto h-20 max-w-md rounded bg-slate-200" />
          <div className="mx-auto mt-6 h-9 max-w-2xl rounded bg-slate-200" />
          <div className="mx-auto mt-3 h-5 max-w-xl rounded bg-slate-200" />
        </div>

        <div className="mb-2 flex h-14 gap-1 rounded-2xl bg-blue-50 p-1">
          <div className="flex-1 rounded-xl bg-blue-100" />
          <div className="flex-1 rounded-xl bg-blue-100" />
        </div>

        <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-6">
            <div className="h-7 w-56 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-40 rounded bg-slate-200" />
          </div>
          <div className="space-y-8 p-6 sm:p-8">
            <SkeletonSection columns="sm:grid-cols-2" />
            <SkeletonSection columns="sm:grid-cols-3" />
            <SkeletonSection columns="sm:grid-cols-2" />
            <SkeletonSection columns="sm:grid-cols-2" />
            <SkeletonSection columns="sm:grid-cols-2" />
            <div className="space-y-4">
              <div className="h-6 w-48 rounded bg-slate-200" />
              <div className="h-28 rounded-xl border border-dashed border-slate-300 bg-slate-100" />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 p-6">
            <div className="h-11 w-20 rounded-xl bg-slate-200" />
            <div className="h-11 w-36 rounded-xl bg-slate-200" />
          </div>
        </section>
      </div>
    </main>
    </LightModeWrapper>
  );
}

function SkeletonSection({ columns }: { columns: string }) {
  return (
    <div className={`grid gap-4 ${columns}`}>
      <SkeletonField />
      <SkeletonField />
      <SkeletonField />
    </div>
  );
}

function SkeletonField() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-32 rounded bg-slate-200" />
      <div className="h-12 rounded-xl bg-slate-200" />
    </div>
  );
}
