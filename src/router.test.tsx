import { describe, expect, it } from "vitest";
import { router } from "./router";

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
        "/assessment",
        "/graduate-ledger",
        "/law-ledger",
        "/staff/requests",
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
});
