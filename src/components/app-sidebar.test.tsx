import { describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppSidebar } from "./app-sidebar";
import { AppSidebarHeader } from "./app-sidebar-header";
import { SidebarProvider } from "./ui/sidebar";

const createTestClient = (userData?: { name: string; role: string }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  if (userData) {
    queryClient.setQueryData(["auth", "current-user"], {
      data: { id: 1, ...userData },
    });
  }
  return queryClient;
};

describe("AppSidebar and AppSidebarHeader", () => {
  it("renders admin sidebar navigation links for an admin user", async () => {
    const queryClient = createTestClient({ name: "Admin Jane", role: "admin" });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={["/admin"]}>
            <SidebarProvider>
              <AppSidebar />
            </SidebarProvider>
          </MemoryRouter>
        </QueryClientProvider>,
      );
    });

    expect(container.textContent).toContain("Admin Portal");
    expect(container.textContent).toContain("Admin");
    expect(container.textContent).toContain("Admin Dashboard");
    expect(container.textContent).toContain("User Management");
    expect(container.textContent).toContain("Activity Log");
    expect(container.textContent).toContain("Staff");
    expect(container.textContent).toContain("Dashboard");
    expect(container.textContent).toContain("Order of Payment");
    expect(container.textContent).toContain("Assessments");
    expect(container.textContent).toContain("Graduate Ledger");
    expect(container.textContent).toContain("Law Ledger");
    expect(container.textContent).toContain("Logout");

    act(() => root.unmount());
    container.remove();
  });

  it("renders staff sidebar navigation links and collapsible groups for a staff user", async () => {
    const queryClient = createTestClient({ name: "Staff Sarah", role: "staff" });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={["/staff/staffdashboard"]}>
            <SidebarProvider>
              <AppSidebar />
            </SidebarProvider>
          </MemoryRouter>
        </QueryClientProvider>,
      );
    });

    expect(container.textContent).toContain("Staff Portal");
    expect(container.textContent).toContain("Dashboard");
    expect(container.textContent).toContain("Order of Payment");
    expect(container.textContent).toContain("Assessments");
    expect(container.textContent).toContain("Graduate Ledger");
    expect(container.textContent).toContain("Law Ledger");
    expect(container.textContent).not.toContain("Admin Dashboard");

    act(() => root.unmount());
    container.remove();
  });

  it("renders cashier sidebar navigation links for a cashier user", async () => {
    const queryClient = createTestClient({ name: "Cashier Bob", role: "cashier" });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={["/cashier/requests"]}>
            <SidebarProvider>
              <AppSidebar />
            </SidebarProvider>
          </MemoryRouter>
        </QueryClientProvider>,
      );
    });

    expect(container.textContent).toContain("Cashier Portal");
    expect(container.textContent).toContain("Requests");
    expect(container.textContent).not.toContain("Admin Dashboard");

    act(() => root.unmount());
    container.remove();
  });

  it("renders header with username and breadcrumbs", async () => {
    const queryClient = createTestClient({ name: "Officer John", role: "staff" });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={["/staff/requests"]}>
            <SidebarProvider>
              <AppSidebarHeader />
            </SidebarProvider>
          </MemoryRouter>
        </QueryClientProvider>,
      );
    });

    expect(container.textContent).toContain("Hello, Officer John!");
    expect(container.textContent).toContain("Staff Requests");

    act(() => root.unmount());
    container.remove();
  });
});
