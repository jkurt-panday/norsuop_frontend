import { describe, expect, it, vi } from "vitest";
import { createMasterRecord, getMasterRecords } from "./api";
import { api } from "../../api/client";
vi.mock("../../api/client", () => ({ api: vi.fn() }));
describe("master data API", () => {
  it("lists resources with filters", async () => {
    vi.mocked(api).mockResolvedValue({ data: [] });
    await getMasterRecords("courses", 2, "law");
    expect(api).toHaveBeenCalledWith(
      "/api/v1/courses?page=2&per_page=20&search=law",
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
});
