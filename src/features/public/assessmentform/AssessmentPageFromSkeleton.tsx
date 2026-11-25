import { LightModeWrapper } from "@/components/ui/LightModeWrapper";

export function AssessmentPageFromSkeleton() {
  return (
    <LightModeWrapper>
      <main
        className="min-h-screen bg-linear-to-b from-blue-500 via-slate-200 to-white px-6 py-12"
        aria-busy="true"
        aria-label="Loading assessment form"
      >
      <div className="mx-auto max-w-4xl animate-pulse">
        <header className="mb-6 rounded-2xl border border-blue-100 bg-white px-8 py-8 text-center shadow-md">
          <div className="mx-auto h-20 max-w-md rounded bg-slate-200" />
          <div className="mx-auto mt-6 h-9 max-w-2xl rounded bg-slate-200" />
          <div className="mx-auto mt-3 h-12 max-w-3xl rounded bg-slate-200" />
        </header>

        <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-6">
            <div className="h-7 w-56 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-40 rounded bg-slate-200" />
          </div>
          <div className="space-y-8 p-6 sm:p-8">
            <SkeletonGrid columns="sm:grid-cols-2" />
            <SkeletonGrid columns="sm:grid-cols-3" />
            <SkeletonGrid columns="sm:grid-cols-2" />

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <div className="h-7 w-52 rounded bg-slate-200" />
              <div className="grid gap-4 sm:grid-cols-3">
                <SkeletonChoice />
                <SkeletonChoice />
                <SkeletonChoice />
              </div>
              <div className="h-5 w-64 rounded bg-slate-200" />
              <div className="grid gap-4 sm:grid-cols-3">
                <SkeletonChoice />
                <SkeletonChoice />
                <SkeletonChoice />
              </div>
              <div className="h-5 w-72 rounded bg-slate-200" />
              <div className="h-12 rounded-xl bg-slate-200" />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 p-6">
            <div className="h-11 w-20 rounded-xl bg-slate-200" />
            <div className="h-11 w-40 rounded-xl bg-slate-200" />
          </div>
        </section>
      </div>
    </main>
    </LightModeWrapper>
  );
}

function SkeletonGrid({ columns }: { columns: string }) {
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

function SkeletonChoice() {
  return (
    <div className="h-20 rounded-xl border border-slate-200 bg-slate-200" />
  );
}
