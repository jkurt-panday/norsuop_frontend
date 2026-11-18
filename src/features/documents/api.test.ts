import { describe, expect, it, vi } from "vitest";
import { uploadDocument } from "./api";
import { api } from "../../api/client";
vi.mock("../../api/client", () => ({ api: vi.fn() }));
describe("documents API", () => {
  it("uploads a document as multipart form data", async () => {
    vi.mocked(api).mockResolvedValue({ data: {} });
    await uploadDocument(
      3,
      new File(["content"], "doc.pdf", { type: "application/pdf" }),
    );
    expect(api).toHaveBeenCalledWith(
      "/api/v1/documents",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
  });
});
