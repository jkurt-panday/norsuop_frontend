import { describe, expect, it, vi } from "vitest";
import {
  exportLedger,
  getLedgerPdf,
  getLedgerRecords,
  importLedger,
  sendLedgerEmails,
} from "./api";
import { api, binary } from "../../api/client";

vi.mock("../../api/client", () => ({ api: vi.fn(), binary: vi.fn() }));

describe("ledger API", () => {
  it("loads filtered ledger records", async () => {
    vi.mocked(api).mockResolvedValue({ data: [] });
    await getLedgerRecords("graduate", 2, "Ada");
    expect(api).toHaveBeenCalledWith(
      "/api/v1/graduate-ledger?page=2&per_page=20&search=Ada",
      expect.any(Object),
    );
  });

  it("builds multipart import requests", async () => {
    vi.mocked(api).mockResolvedValue({
      message: "ok",
      imported: 2,
      skipped: 1,
      duplicates: 0,
      warnings: {},
      detail_available: true,
    });
    await importLedger(
      "law",
      new File(["x"], "ledger.csv", { type: "text/csv" }),
      4,
      8,
    );
    const [, init] = vi.mocked(api).mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(init?.body).toBeInstanceOf(FormData);
    expect((init?.body as FormData).get("preset_course_id")).toBe("4");
  });

  it("downloads ledger exports and PDFs as blobs for both ledgers", async () => {
    const blob = new Blob(["xlsx"]);
    vi.mocked(binary).mockResolvedValue(blob);
    await expect(exportLedger("graduate")).resolves.toBe(blob);
    await expect(exportLedger("law")).resolves.toBe(blob);
    await expect(getLedgerPdf("law", 42)).resolves.toBe(blob);
    expect(binary).toHaveBeenCalledWith("/api/v1/law-ledger/pdf?student_id=42");
  });

  it("queues ledger statement emails", async () => {
    vi.mocked(api).mockResolvedValue({ message: "queued", queued_count: 1 });
    await expect(
      sendLedgerEmails("law", { student_ids: [42] }),
    ).resolves.toEqual({ message: "queued", queued_count: 1 });
    expect(api).toHaveBeenCalledWith(
      "/api/v1/law-ledger/send-emails",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
