import { describe, expect, it, vi } from "vitest";
import { getStaffRequest, linkOpStudent, updateStaffDetails } from "./api";
import { api } from "../../api/client";

vi.mock("../../api/client", () => ({ api: vi.fn() }));

describe("staff request API", () => {
  it("updates details and links a student through the staff API", async () => {
    vi.mocked(api).mockResolvedValue({ data: {} });
    await updateStaffDetails(4, { amount: 100 });
    await linkOpStudent(4, 9);
    expect(api).toHaveBeenNthCalledWith(
      1,
      "/api/v1/staff/requests/4/details",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(api).toHaveBeenNthCalledWith(
      2,
      "/api/v1/staff/requests/4/student",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("requests a detail record with an abort signal", async () => {
    vi.mocked(api).mockResolvedValue({ data: { id: 4 } });
    const signal = new AbortController().signal;
    await getStaffRequest(4, signal);
    expect(api).toHaveBeenCalledWith("/api/v1/staff/requests/4", { signal });
  });
});
