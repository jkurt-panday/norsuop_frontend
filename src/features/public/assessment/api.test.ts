import { describe, expect, it, vi } from "vitest";
import { submitAssessment } from "./api";
import { api } from "../../../api/client";

vi.mock("../../../api/client", () => ({ api: vi.fn() }));

describe("assessment API", () => {
  it("submits the JSON payload through the API client", async () => {
    vi.mocked(api).mockResolvedValue({
      data: { reference_number: "AS-1", access_token: "token" },
    });
    await submitAssessment({ first_name: "Ada", course_id: "1" });
    expect(api).toHaveBeenCalledWith(
      "/api/v1/public/assessmentform",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ first_name: "Ada", course_id: "1" }),
      }),
    );
  });
});
