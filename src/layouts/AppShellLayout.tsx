import React from "react";
import { Outlet } from "react-router";
import { AppSidebar } from "@/components/app-sidebar";
import {
  AppSidebarHeader,
  type BreadcrumbItem,
} from "@/components/app-sidebar-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

export interface AppShellLayoutProps {
  children?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export function AppShellLayout({
  children,
  breadcrumbs,
}: AppShellLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="overflow-hidden bg-background">
          <AppSidebarHeader breadcrumbs={breadcrumbs} />
          <main className="min-h-0 flex-1 overflow-auto bg-page-background p-4 md:p-8">
            {children ?? <Outlet />}
          </main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}

export default AppShellLayout;
