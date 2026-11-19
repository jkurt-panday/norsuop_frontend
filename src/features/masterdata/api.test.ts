import { describe, expect, it, vi } from "vitest";
import {
  createMasterRecord,
  deleteMasterRecord,
  exportUacs,
  getMasterRecords,
  importUacs,
  setActiveOfficial,
  updateMasterRecord,
} from "./api";
import { api, binary } from "../../api/client";

vi.mock("../../api/client", () => ({
  api: vi.fn(),
  binary: vi.fn(),
}));

describe("master data API", () => {
  it("lists resources with basic page and search", async () => {
    vi.mocked(api).mockResolvedValue({ data: [] });
    await getMasterRecords("courses", 2, "law");
    expect(api).toHaveBeenCalledWith(
      "/api/v1/courses?page=2&per_page=20&search=law",
      expect.any(Object),
    );
  });

  it("lists resources with sort, direction, and custom filters", async () => {
    vi.mocked(api).mockResolvedValue({ data: [] });
    await getMasterRecords("courses", {
      page: 3,
      perPage: 15,
      search: "cs",
      sort: "course_code",
      direction: "desc",
      filters: { college: "Graduate School" },
    });
    expect(api).toHaveBeenCalledWith(
      "/api/v1/courses?page=3&per_page=15&search=cs&sort=course_code&direction=desc&college=Graduate+School",
      expect.any(Object),
    );
  });

  it("creates a resource", async () => {
    vi.mocked(api).mockResolvedValue({ data: {} });
    await createMasterRecord("memberships", {
      member_code: "M",
      member_desc: "Member",
    });
    expect(api).toHaveBeenCalledWith(
      "/api/v1/memberships",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("updates a resource", async () => {
    vi.mocked(api).mockResolvedValue({ data: {} });
    await updateMasterRecord("bank-accounts", 5, {
      account_name: "General Fund",
    });
    expect(api).toHaveBeenCalledWith(
      "/api/v1/bank-accounts/5",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ account_name: "General Fund" }),
      }),
    );
  });

  it("deletes a resource", async () => {
    vi.mocked(api).mockResolvedValue(undefined);
    await deleteMasterRecord("payment-options", 10);
    expect(api).toHaveBeenCalledWith("/api/v1/payment-options/10", {
      method: "DELETE",
    });
  });

  it("sets active authorized official", async () => {
    vi.mocked(api).mockResolvedValue({
      message: "Activated",
      data: { id: 2, is_active: true },
    });
    await setActiveOfficial(2);
    expect(api).toHaveBeenCalledWith(
      "/api/v1/authorized-officials/2/set-active",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("imports uacs file with formData", async () => {
    vi.mocked(api).mockResolvedValue({ message: "Imported", count: 12 });
    const file = new File(["test content"], "uacs.csv", { type: "text/csv" });
    const result = await importUacs(file);
    expect(result.count).toBe(12);
    expect(api).toHaveBeenCalledWith(
      "/api/v1/uacs/import",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("exports uacs file via binary helper", async () => {
    const mockBlob = new Blob(["dummy content"], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    vi.mocked(binary).mockResolvedValue(mockBlob);
    const result = await exportUacs();
    expect(binary).toHaveBeenCalledWith("/api/v1/uacs/export");
    expect(result).toBe(mockBlob);
  });
});
