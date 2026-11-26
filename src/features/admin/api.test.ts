import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminActivityLogs,
  getAdminDashboard,
  getAdminUsers,
  toggleAdminUser,
  updateAdminUser,
} from "./api";
import { api } from "../../api/client";

vi.mock("../../api/client", () => ({ api: vi.fn() }));

const TEST_PASSWORD = "Password123!";
const TEST_NEW_PASSWORD = "NewPassword123!";

describe("admin API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches dashboard stats", async () => {
    vi.mocked(api).mockResolvedValue({
      data: {
        staff_count: 5,
        admin_count: 2,
        cashier_count: 3,
        recent_activity: [],
      },
    });

    await getAdminDashboard();

    expect(api).toHaveBeenCalledWith(
      "/api/v1/admin/dashboard",
      expect.any(Object),
    );
  });

  it("fetches admin users with default page and search", async () => {
    vi.mocked(api).mockResolvedValue({
      data: [],
      meta: { current_page: 1, per_page: 10, total: 0, last_page: 1 },
      links: { next: null, prev: null },
    });

    await getAdminUsers(2, "john");

    expect(api).toHaveBeenCalledWith(
      "/api/v1/admin/users?page=2&per_page=10&search=john",
      expect.any(Object),
    );
  });

  it("fetches admin users with structured filter parameters", async () => {
    vi.mocked(api).mockResolvedValue({
      data: [],
      meta: { current_page: 1, per_page: 15, total: 0, last_page: 1 },
      links: { next: null, prev: null },
    });

    await getAdminUsers({
      page: 3,
      per_page: 15,
      search: "jane",
      role: "cashier",
      sort: "name",
      direction: "asc",
    });

    expect(api).toHaveBeenCalledWith(
      "/api/v1/admin/users?page=3&per_page=15&search=jane&role=cashier&sort=name&direction=asc",
      expect.any(Object),
    );
  });

  it("creates admin users", async () => {
    vi.mocked(api).mockResolvedValue({
      message: "User created successfully.",
      data: {
        id: 1,
        name: "Admin",
        email: "admin@example.com",
        role: "admin",
        email_verified_at: null,
        deleted_at: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    });

    await createAdminUser({
      name: "Admin",
      email: "admin@example.com",
      password: TEST_PASSWORD,
      role: "admin",
    });

    expect(api).toHaveBeenCalledWith(
      "/api/v1/admin/users",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Admin",
          email: "admin@example.com",
          password: TEST_PASSWORD,
          role: "admin",
        }),
      }),
    );
  });

  it("updates admin users", async () => {
    vi.mocked(api).mockResolvedValue({
      message: "User updated successfully.",
      data: {
        id: 4,
        name: "Jane Updated",
        email: "jane.updated@example.com",
        role: "staff",
        email_verified_at: null,
        deleted_at: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
      },
    });

    await updateAdminUser(4, {
      name: "Jane Updated",
      email: "jane.updated@example.com",
      role: "staff",
      password: TEST_NEW_PASSWORD,
    });

    expect(api).toHaveBeenCalledWith(
      "/api/v1/admin/users/4",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          name: "Jane Updated",
          email: "jane.updated@example.com",
          role: "staff",
          password: TEST_NEW_PASSWORD,
        }),
      }),
    );
  });

  it("toggles admin user status", async () => {
    vi.mocked(api).mockResolvedValue({
      message: "User deactivated successfully.",
      data: {
        id: 2,
        name: "Staff User",
        email: "staff@example.com",
        role: "staff",
        email_verified_at: null,
        deleted_at: "2026-01-02T00:00:00Z",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
      },
    });

    await toggleAdminUser(2);

    expect(api).toHaveBeenCalledWith(
      "/api/v1/admin/users/2/toggle",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("deletes admin users", async () => {
    vi.mocked(api).mockResolvedValue(undefined);

    await deleteAdminUser(5);

    expect(api).toHaveBeenCalledWith(
      "/api/v1/admin/users/5",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("fetches admin activity logs with filters", async () => {
    vi.mocked(api).mockResolvedValue({
      data: [],
      meta: { current_page: 1, per_page: 10, total: 0, last_page: 1 },
      links: { next: null, prev: null },
    });

    await getAdminActivityLogs({
      page: 2,
      per_page: 25,
      activity_search: "login",
      activity_action: "created",
      date_from: "2026-01-01",
      date_to: "2026-01-31",
      sort: "created_at",
      direction: "asc",
    });

    expect(api).toHaveBeenCalledWith(
      "/api/v1/admin/activity-log?page=2&per_page=25&activity_search=login&activity_action=created&date_from=2026-01-01&date_to=2026-01-31&sort=created_at&direction=asc",
      expect.any(Object),
    );
  });
});
