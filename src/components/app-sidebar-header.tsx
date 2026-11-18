import * as React from "react";
import { Link, useLocation } from "react-router";
import { ChevronRight, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCurrentUser } from "@/features/auth/queries";

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
  "/settings": "Settings",
  "/settings/profile": "Profile Settings",
  "/settings/security": "Security Settings",
  "/settings/appearance": "Appearance Settings",
};

export function AppSidebarHeader({
  breadcrumbs,
}: {
  breadcrumbs?: BreadcrumbItem[];
}) {
  const { data } = useCurrentUser();
  const userName = data?.data?.name ?? "";
  const location = useLocation();

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
      currentPath += `/${segments[i]}`;
      const title =
        routeTitleMap[currentPath] ||
        segments[i].charAt(0).toUpperCase() + segments[i].slice(1).replace(/-/g, " ");
      crumbs.push({
        title,
        href: i < segments.length - 1 ? currentPath : undefined,
      });
    }

    return crumbs;
  }, [breadcrumbs, location.pathname]);

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
      <Link
        to="/settings/profile"
        className={`rounded-lg p-2 text-primary-foreground hover:bg-white/10 dark:text-sidebar-foreground dark:hover:bg-sidebar-accent ${userName ? "sm:ml-2" : "ml-auto"}`}
        title="Settings"
      >
        <Settings className="h-4 w-4" />
      </Link>
      <ThemeToggle className="ml-1" />
    </div>
  );
}
