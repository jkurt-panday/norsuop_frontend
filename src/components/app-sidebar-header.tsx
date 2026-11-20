import * as React from "react";
import { Link, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCurrentUser } from "@/features/auth/queries";
import { getAssessment } from "@/features/assessments/api";
import { getStaffRequest } from "@/features/staff/api";

export interface BreadcrumbItem {
  title: string;
  href?: string;
}

const routeTitleMap: Record<string, string> = {
  "/admin": "Admin Dashboard",
  "/admin/dashboard": "Admin Dashboard",
  "/admin/users": "User Management",
  "/admin/master-data": "Master Data",
  "/admin/activity-log": "Activity Log",
  "/staff": "Staff Dashboard",
  "/staff/staffdashboard": "Staff Dashboard",
  "/staff/requests": "Staff Requests",
  "/staff/bank-accounts": "Bank Accounts",
  "/staff/payment-options": "Payment Options",
  "/staff/memberships": "Memberships",
  "/staff/authorized-officials": "Authorized Officials",
  "/staff/uacs": "UACS",
  "/staff/courses": "Courses",
  "/staff/assessments/dashboard": "Assessments Dashboard",
  "/staff/assessments": "Assessments",
  "/staff/activity-log": "Activity Log",
  "/cashier": "Cashier Dashboard",
  "/cashier/requests": "Cashier Requests",
  "/documents": "Supporting Documents",
  "/graduate-ledger": "Graduate Ledger",
  "/graduate-ledger/print-select": "Print Statement",
  "/law-ledger": "Law Ledger",
  "/law-ledger/print-select": "Print Statement",
};

export function AppSidebarHeader({
  breadcrumbs,
}: {
  breadcrumbs?: BreadcrumbItem[];
}) {
  const { data } = useCurrentUser();
  const userName = data?.data?.name ?? "";
  const location = useLocation();

  // Assessment detail route: /staff/assessments/:id
  const assessmentId = location.pathname.match(/^\/staff\/assessments\/(\d+)(?:\/|$)/)?.[1];
  const assessmentQuery = useQuery({
    queryKey: ["assessment", assessmentId],
    queryFn: ({ signal }) => getAssessment(assessmentId!, signal),
    enabled: Boolean(assessmentId),
  });

  // Staff request detail route: /staff/requests/:id
  const requestId = location.pathname.match(/^\/staff\/requests\/(\d+)(?:\/|$)/)?.[1];
  const requestQuery = useQuery({
    queryKey: ["staffRequest", requestId],
    queryFn: ({ signal }) => getStaffRequest(requestId!, signal),
    enabled: Boolean(requestId),
  });

  const resolvedBreadcrumbs: BreadcrumbItem[] = React.useMemo(() => {
    if (breadcrumbs && breadcrumbs.length > 0) {
      return breadcrumbs;
    }
    const path = location.pathname.replace(/\/$/, "");
    if (!path || path === "") return [];

    const segments = path.split("/").filter(Boolean);
    const crumbs: BreadcrumbItem[] = [];
    let currentPath = "";

    for (let i = 0; i < segments.length; i++) {
      // The edit route is an implementation detail; the assessment reference
      // is the meaningful final breadcrumb for this page.
      if (assessmentId && segments[i] === "edit") continue;
      // Skip the request ID segment - we'll show reference_number instead
      if (requestId && segments[i] === requestId) continue;

      currentPath += `/${segments[i]}`;
      const isAssessmentId = assessmentId && segments[i] === assessmentId;
      const isRequestId = requestId && segments[i] === requestId;
      const title = isAssessmentId
        ? assessmentQuery.data?.data.reference_number ?? segments[i]
        : isRequestId
        ? requestQuery.data?.data.reference_number ?? segments[i]
        : routeTitleMap[currentPath] ||
          segments[i].charAt(0).toUpperCase() + segments[i].slice(1).replace(/-/g, " ");
      crumbs.push({
        title,
        href: i < segments.length - 1 && !isAssessmentId && !isRequestId ? currentPath : undefined,
      });
    }

    return crumbs;
  }, [assessmentId, assessmentQuery.data, requestId, requestQuery.data, breadcrumbs, location.pathname]);

  return (
    <div className="flex h-16 items-center gap-4 border-b border-white/20 bg-primary px-6 text-primary-foreground dark:border-sidebar-border dark:bg-sidebar dark:text-sidebar-foreground">
      <SidebarTrigger className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground dark:text-sidebar-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-foreground" />
      {resolvedBreadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-sm">
          {resolvedBreadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-white/90 dark:text-sidebar-foreground/50" />
              )}
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="text-primary-foreground hover:text-primary-foreground/90 dark:text-sidebar-foreground/90 dark:hover:text-sidebar-foreground"
                >
                  {crumb.title}
                </Link>
              ) : (
                <span className="text-primary-foreground/90 dark:text-sidebar-foreground/70">
                  {crumb.title}
                </span>
              )}
            </div>
          ))}
        </nav>
      )}
      {userName && (
        <span
          className="ml-auto hidden truncate text-sm font-medium text-white/90 dark:text-sidebar-foreground/80 sm:block"
          aria-label={`Logged in as ${userName}`}
        >
          Hello, {userName}!
        </span>
      )}
      <ThemeToggle className="ml-1" />
    </div>
  );
}
