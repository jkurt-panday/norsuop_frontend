import { Outlet } from "react-router";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export function AppShell() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="min-w-0 flex-1 overflow-auto bg-slate-50">
        <SidebarTrigger className="m-4" />
        <div className="px-4 pb-4 md:px-8 md:pb-8">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}
