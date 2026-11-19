import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAssessments,
  getAssessmentDashboard,
  getAssessment,
  updateAssessmentStatus,
  deleteAssessment,
  emailAssessmentSoa,
  getAssessmentPrintSoaUrl,
} from "./api";
import { api } from "../../api/client";

vi.mock("../../api/client", () => ({ api: vi.fn() }));

describe("assessments API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches assessments with structured filter parameters", async () => {
    vi.mocked(api).mockResolvedValue({
      data: [],
      meta: { current_page: 2, per_page: 25, total: 0, last_page: 1 },
      links: { next: null, prev: null },
    });

    await getAssessments({
      page: 2,
      per_page: 25,
      search: "Doe",
      status: "pending",
      enrolled_under: "Graduate",
    });

    expect(api).toHaveBeenCalledWith(
      "/api/v1/assessments?page=2&per_page=25&search=Doe&enrolled_under=Graduate&status=pending",
      expect.any(Object),
    );
  });

  it("fetches assessment dashboard data", async () => {
    vi.mocked(api).mockResolvedValue({
      data: {
        by_course: [],
        by_semester: [],
        by_enrolled_under: [],
        monthly_trend: [],
        daily_requests: [],
        requests_trend: { value: 0, recent: 0, previous: 0 },
      },
    });

    const res = await getAssessmentDashboard();
    expect(api).toHaveBeenCalledWith(
      "/api/v1/assessments/dashboard",
      expect.any(Object),
    );
    expect(res.data.requests_trend.value).toBe(0);
  });

  it("fetches single assessment detail", async () => {
    vi.mocked(api).mockResolvedValue({
      data: {
        id: 5,
        reference_number: "ASM-005",
      },
    });

    await getAssessment(5);
    expect(api).toHaveBeenCalledWith(
      "/api/v1/assessments/5",
      expect.any(Object),
    );
  });

  it("updates assessment status via PATCH", async () => {
    vi.mocked(api).mockResolvedValue({
      message: "Assessment status updated.",
      data: { id: 12, status: "completed" },
    });

    await updateAssessmentStatus(12, "completed");
    expect(api).toHaveBeenCalledWith(
      "/api/v1/assessments/12",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "completed" }),
      }),
    );
  });

  it("deletes assessment via DELETE", async () => {
    vi.mocked(api).mockResolvedValue(undefined);

    await deleteAssessment(7);
    expect(api).toHaveBeenCalledWith(
      "/api/v1/assessments/7",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });

  it("sends email SOA via POST", async () => {
    vi.mocked(api).mockResolvedValue({
      message: "Assessment Statement of Account emailed successfully.",
    });

    await emailAssessmentSoa(9, {
      subject: "Your SOA",
      recipient_name: "Jane",
      note: "Please review",
    });

    expect(api).toHaveBeenCalledWith(
      "/api/v1/assessments/9/email-soa",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          subject: "Your SOA",
          recipient_name: "Jane",
          note: "Please review",
        }),
      }),
    );
  });

  it("generates correct print SOA URL", () => {
    const urlWithoutStudent = getAssessmentPrintSoaUrl(42);
    expect(urlWithoutStudent).toContain("/api/v1/assessments/42/print-soa");

    const urlWithStudent = getAssessmentPrintSoaUrl(42, "candidate-123");
    expect(urlWithStudent).toContain("ledger_student=candidate-123");
  });
});
