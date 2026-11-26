import { describe, expect, it, vi } from "vitest";
import {
  createAndLinkOpStudent,
  getStaffRequest,
  getStaffRequests,
  linkOpStudent,
  processStaffRequest,
  unlinkOpStudent,
  updateStaffDetails,
  type CreateStudentPayload,
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

  it("unlinks a student through the staff API", async () => {
    vi.mocked(api).mockResolvedValue({ message: "Student unlinked from this Order of Payment." });
    await unlinkOpStudent(4);
    expect(api).toHaveBeenCalledWith(
      "/api/v1/staff/requests/4/student",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("creates and links a student through the staff API", async () => {
    const payload: CreateStudentPayload = {
      student_number: "2024-12345",
      first_name: "Juan",
      middle_name: "Dela",
      last_name: "Cruz",
      email: "juan@example.com",
      contact_num: "09123456789",
    };
    vi.mocked(api).mockResolvedValue({ message: "Student created and matched to this Order of Payment." });
    await createAndLinkOpStudent(4, payload);
    expect(api).toHaveBeenCalledWith(
      "/api/v1/staff/requests/4/student",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      }),
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
