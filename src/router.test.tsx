import { describe, expect, it } from "vitest";
import { router } from "./router";
import { AppShellLayout } from "./layouts/AppShellLayout";
import { ProtectedRoute } from "./routes/ProtectedRoute";

describe("SPA routes", () => {
  it("has direct routes for migrated public, ledger, and protected screens", () => {
    const collectPaths = (routes: typeof router.routes): string[] =>
      routes
        .flatMap((route) => [
          route.path,
          ...(route.children ? collectPaths(route.children) : []),
        ])
        .filter((path): path is string => Boolean(path));
    const paths = collectPaths(router.routes);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/opform",
        "/assessmentform",
        "/graduate-ledger",
        "/graduate-ledger/print-select",
        "/law-ledger",
        "/law-ledger/print-select",
        "/staff/staffdashboard",
        "/staff/requests",
        "/staff/bank-accounts",
        "/staff/payment-options",
        "/staff/memberships",
        "/staff/authorized-officials",
        "/staff/uacs",
        "/staff/courses",
        "/staff/assessments",
        "/staff/assessments/dashboard",
        "/cashier/requests",
        "/admin",
      ]),
    );
  });

  it("keeps an explicit not-found catch-all route for unknown URLs", () => {
    const catchAll = router.routes.find((route) => route.path === "*");
    expect(catchAll).toBeDefined();
    expect(catchAll?.element).toBeDefined();
  });

  it("wraps protected routes in ProtectedRoute and AppShellLayout", () => {
    const protectedWrapper = router.routes.find(
      (route) => route.element && typeof route.element === "object" && "type" in route.element && route.element.type === ProtectedRoute,
    );
    expect(protectedWrapper).toBeDefined();
    expect(protectedWrapper?.children).toBeDefined();

    const appShellWrapper = protectedWrapper?.children?.find(
      (child) => child.element && typeof child.element === "object" && "type" in child.element && child.element.type === AppShellLayout,
    );
    expect(appShellWrapper).toBeDefined();
    expect(appShellWrapper?.children?.length).toBeGreaterThan(0);
  });
});
