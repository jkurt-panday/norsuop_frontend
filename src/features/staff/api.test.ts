import { describe, expect, it, vi } from "vitest";
import {
  getStaffRequest,
  getStaffRequests,
  linkOpStudent,
  processStaffRequest,
  updateStaffDetails,
  type StaffRequestDetail,
  type StaffRequestList,
} from "./api";
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
    vi.mocked(api).mockResolvedValue({ data: { id: 4 } } as unknown as StaffRequestDetail);
    const signal = new AbortController().signal;
    await getStaffRequest(4, signal);
    expect(api).toHaveBeenCalledWith("/api/v1/staff/requests/4", { signal });
  });

  it("fetches staff requests with serialized filter params", async () => {
    vi.mocked(api).mockResolvedValue({ data: [], meta: {}, links: {} } as unknown as StaffRequestList);
    await getStaffRequests({
      page: 1,
      status: "unprocessed",
      search: "Doe",
      sort: "created_at",
      direction: "desc",
    });
    expect(api).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/v1/staff/requests?page=1&status=unprocessed&search=Doe&sort=created_at&direction=desc",
      ),
      expect.anything(),
    );
  });

  it("submits processing payload to process endpoint", async () => {
    vi.mocked(api).mockResolvedValue({ message: "Processed" });
    await processStaffRequest(5, {
      form_input_id: 5,
      fundcluster_id: 1,
      uacs_id: 2,
      ref_date: "2026-11-18",
      status: "processed",
    });
    expect(api).toHaveBeenCalledWith(
      "/api/v1/staff/requests/5/process",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
