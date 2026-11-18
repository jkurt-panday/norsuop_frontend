import { describe, expect, it, vi } from "vitest";
import { createAdminUser, getAdminDashboard } from "./api";
import { api } from "../../api/client";
vi.mock("../../api/client", () => ({ api: vi.fn() }));
describe("admin API", () => {
  it("fetches dashboard stats", async () => {
    vi.mocked(api).mockResolvedValue({ data: { staff_count: 1 } });
    await getAdminDashboard();
    expect(api).toHaveBeenCalledWith(
      "/api/v1/admin/dashboard",
      expect.any(Object),
    );
  });
  it("creates admin users", async () => {
    vi.mocked(api).mockResolvedValue({ data: {} });
    await createAdminUser({
      name: "Admin",
      email: "admin@example.com",
      password: "Password123!",
      role: "admin",
    });
    expect(api).toHaveBeenCalledWith(
      "/api/v1/admin/users",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
