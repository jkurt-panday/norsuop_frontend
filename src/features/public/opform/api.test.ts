import { describe, expect, it, vi } from "vitest";
import { submitOpForm } from "./api";
import { api } from "../../../api/client";

vi.mock("../../../api/client", () => ({ api: vi.fn() }));

describe("public OP API", () => {
  it("builds multipart submissions", async () => {
    vi.mocked(api).mockResolvedValue({
      data: { reference_number: "OP-1", access_token: "token" },
    });
    await submitOpForm({
      email: "a@example.com",
      amount: "10",
      documents: [new File(["pdf"], "receipt.pdf")],
    });
    const options = vi.mocked(api).mock.calls[0][1];
    expect(options?.method).toBe("POST");
    expect(options?.body).toBeInstanceOf(FormData);
  });
});
