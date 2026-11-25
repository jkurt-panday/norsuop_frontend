import * as React from "react";
import { Link, useLocation } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCurrentUser } from "@/features/auth/queries";
import { getAssessment } from "@/features/assessments/api";
import {
  getCashierReferenceNumber,
  getCashierRequest,
} from "@/features/cashier/api";
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
  "/staff/assessments/dashboard": "Assessment Dashboard",
  "/staff/assessments": "Assessment Requests",
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
  const queryClient = useQueryClient();

  // Assessment detail route: /staff/assessments/:id
  const assessmentId = location.pathname.match(/^\/staff\/assessments\/(\d+)(?:\/|$)/)?.[1];
  const cashierRequestId = location.pathname.match(/^\/cashier\/requests\/(\d+)(?:\/|$)/)?.[1];
  const assessmentQuery = useQuery({
    queryKey: ["assessment", assessmentId],
    queryFn: ({ signal }) => getAssessment(assessmentId!, signal),
    enabled: Boolean(assessmentId),
  });
  const cashierRequestQuery = useQuery({
    queryKey: ["cashier", "request", cashierRequestId],
    queryFn: ({ signal }) => getCashierRequest(Number(cashierRequestId), signal),
    enabled: Boolean(cashierRequestId),
  });

  // Staff request detail route: /staff/requests/:id
  const requestIdStr = location.pathname.match(/^\/staff\/requests\/(\d+)(?:\/|$)/)?.[1];
  const requestId = requestIdStr ? Number(requestIdStr) : undefined;

  // Check cache first - StaffRequestDetailPage loads this data with key ["staff", "request", id]
  // API returns StaffRequestDetail { data: StaffRequest, ... }, so cached data is { data: { data: { reference_number } } }
  const cachedRequest = requestId
    ? queryClient.getQueryData<{ data: { data: { reference_number?: string } } }>(["staff", "request", requestId])
    : undefined;

  const requestQuery = useQuery({
    queryKey: ["staff", "request", requestId],
    queryFn: ({ signal }) => getStaffRequest(requestId!, signal),
    enabled: Boolean(requestId),
    initialData: cachedRequest ? { data: cachedRequest.data } : undefined,
  });

  const resolvedBreadcrumbs: BreadcrumbItem[] = React.useMemo(() => {
    if (breadcrumbs && breadcrumbs.length > 0) {
      return breadcrumbs;
    }
    const path = location.pathname.replace(/\/$/, "");
    if (!path || path === "") return [];

    if (cashierRequestId) {
      return [
        {
          title: "Cashier Requests",
          href: "/cashier/requests",
        },
        {
          title: cashierRequestQuery.data?.data
            ? getCashierReferenceNumber(cashierRequestQuery.data.data)
            : cashierRequestId,
        },
      ];
    }

    if (path === "/cashier/requests") {
      return [{ title: "Cashier Requests" }];
    }

    if (path === "/staff/assessments/dashboard") {
      return [
        { title: "Staff Dashboard", href: "/staff" },
        { title: "Assessment Dashboard" },
      ];
    }

    const segments = path.split("/").filter(Boolean);
    const crumbs: BreadcrumbItem[] = [];
    let currentPath = "";
    const requestIdStr = requestId?.toString();

    for (let i = 0; i < segments.length; i++) {
      // The edit route is an implementation detail; the assessment reference
      // is the meaningful final breadcrumb for this page.
      if (assessmentId && segments[i] === "edit") continue;
      // Skip the request ID segment - we'll show reference_number instead
      const hasRequestRef = requestQuery.data?.data?.reference_number;
      if (requestIdStr && segments[i] === requestIdStr) {
        if (hasRequestRef) {
          // Add the reference number as the final crumb
          crumbs.push({
            title: hasRequestRef,
            href: undefined,
          });
        } else {
          // No reference yet - show ID as fallback
          crumbs.push({
            title: segments[i],
            href: undefined,
          });
        }
        continue;
      }

      currentPath += `/${segments[i]}`;
      const isAssessmentId = assessmentId && segments[i] === assessmentId;
      const isCashierRequestId =
        cashierRequestId && segments[i] === cashierRequestId;
      const isRequestId = requestId && segments[i] === requestId;
      const title = isAssessmentId
        ? assessmentQuery.data?.data.reference_number ?? segments[i]
        : isCashierRequestId
          ? cashierRequestQuery.data?.data
            ? getCashierReferenceNumber(cashierRequestQuery.data.data)
            : segments[i]
          : isRequestId
            ? requestQuery.data?.data.reference_number ?? segments[i]
            : routeTitleMap[currentPath] ||
            segments[i].charAt(0).toUpperCase() +
            segments[i].slice(1).replace(/-/g, " ");
      crumbs.push({
        title,
        href: i < segments.length - 1 && !isAssessmentId ? currentPath : undefined,
      });
    }

    return crumbs;
  }, [
    assessmentId,
    assessmentQuery.data,
    breadcrumbs,
    cashierRequestId,
    cashierRequestQuery.data,
    location.pathname,
    requestId,
    requestQuery.data,
  ]);

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
