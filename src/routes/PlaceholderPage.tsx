import React from "react";
import { Link } from "react-router";

interface PlaceholderPageProps {
  title: string;
  description?: string;
  backHref?: string;
}

export function PlaceholderPage({
  title,
  description = "This module is being prepared and will be available soon.",
  backHref = "/staff/requests",
}: PlaceholderPageProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6">
          <Link
            to={backHref}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
