import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLedgerRecord,
  createCohortLedger,
  deleteLedgerRecord,
  exportLedger,
  getLedgerBalance,
  getLedgerEmailRecipients,
  getLedgerPdf,
  getLedgerRecords,
  importLedger,
  searchLedgerStudents,
  sendLedgerEmails,
  updateLedgerRecord,
} from "./api";
import { api, binary } from "../../api/client";
import { latinHonorDiscount } from "./batch-lines";

vi.mock("../../api/client", () => ({ api: vi.fn(), binary: vi.fn() }));

describe("ledger API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads filtered ledger records with number page and search string", async () => {
    vi.mocked(api).mockResolvedValue({ data: [] });
    await getLedgerRecords("graduate", 2, "Ada");
    expect(api).toHaveBeenCalledWith(
      "/api/v1/graduate-ledger?page=2&per_page=20&search=Ada",
      expect.any(Object),
    );
  });

  it("loads ledger records with LedgerFilterParams object", async () => {
    vi.mocked(api).mockResolvedValue({ data: [] });
    await getLedgerRecords("law", {
      page: 3,
      per_page: 15,
      search: "John",
      entry_type: "ar",
      status: "Paid",
      date_from: "2026-01-01",
      date_to: "2026-12-31",
      school_year: "2025-2026",
      semester: "1st Sem",
      course: "JD",
      balance_status: "with_balance",
    });
    expect(api).toHaveBeenCalledWith(
      "/api/v1/law-ledger?page=3&per_page=15&search=John&entry_type=ar&status=Paid&date_from=2026-01-01&date_to=2026-12-31&school_year=2025-2026&semester=1st+Sem&course=JD&balance_status=with_balance",
      expect.any(Object),
    );
  });

  it("searches students for ledger", async () => {
    vi.mocked(api).mockResolvedValue({ data: [{ id: 1, student_number: "2026-001", name: "Alice" }] });
    const result = await searchLedgerStudents("graduate", "Alice", 25);
    expect(api).toHaveBeenCalledWith(
      "/api/v1/graduate-ledger/students/search?q=Alice&limit=25",
      expect.any(Object),
    );
    expect(result).toEqual({ data: [{ id: 1, student_number: "2026-001", name: "Alice" }] });
  });

  it("fetches eligible email recipients", async () => {
    vi.mocked(api).mockResolvedValue({
      data: [{ id: 2, student_number: "2026-002", name: "Bob", email: "bob@example.com" }],
    });
    const result = await getLedgerEmailRecipients("law");
    expect(api).toHaveBeenCalledWith(
      "/api/v1/law-ledger/email-recipients",
      expect.any(Object),
    );
    expect(result.data).toHaveLength(1);
  });

  it("creates a ledger transaction", async () => {
    vi.mocked(api).mockResolvedValue({ message: "Created", data: { id: 10 } });
    const payload = {
      student_id: 1,
      course_id: 2,
      academic_term_id: 3,
      entry_type: "ar" as const,
      transaction_date: "2026-11-18",
      particulars: "Tuition Fee",
      rate: 500,
      amount: 1500,
      status: "posted",
    };
    await createLedgerRecord("graduate", payload);
    expect(api).toHaveBeenCalledWith("/api/v1/graduate-ledger", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("creates a first transaction with an inline student registration", async () => {
    vi.mocked(api).mockResolvedValue({ message: "Created", data: { id: 11 } });
    const payload = {
      new_student: {
        student_number: "2026-NEW",
        email: "new@example.com",
        last_name: "Student",
        first_name: "New",
      },
      course_id: 2,
      academic_term_id: 3,
      entry_type: "ar" as const,
      transaction_date: "2026-11-20",
      particulars: "First Assessment",
      rate: 500,
      amount: 1500,
    };
    await createLedgerRecord("law", payload);
    expect(api).toHaveBeenCalledWith("/api/v1/law-ledger", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("posts Law cohort rows with Latin Honor overrides", async () => {
    vi.mocked(api).mockResolvedValue({ message: "Created", created_count: 2 });
    const payload = {
      course_id: 2,
      academic_term_id: 3,
      entry_type: "ar" as const,
      transaction_date: "2026-11-20",
      particulars: "Law Cohort Tuition",
      cohort_rows: [
        { student_id: 10, amount: 2000, latin_honor: "MAGNA" as const, discount_amount: 1500 },
        { student_id: 11, amount: 2000, latin_honor: null, discount_amount: null },
      ],
    };
    await createCohortLedger("law", payload);
    expect(api).toHaveBeenCalledWith("/api/v1/law-ledger/cohort-store", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("calculates monolith-equivalent Latin Honor discounts", () => {
    expect(latinHonorDiscount(10000, "SUMMA")).toBe(10000);
    expect(latinHonorDiscount(10000, "MAGNA")).toBe(7500);
    expect(latinHonorDiscount(10000, "CUM_LAUDE")).toBe(5000);
    expect(latinHonorDiscount(10000, "")).toBe(0);
  });

  it("updates a ledger transaction", async () => {
    vi.mocked(api).mockResolvedValue({ message: "Updated", data: { id: 10 } });
    const payload = {
      student_id: 1,
      course_id: 2,
      academic_term_id: 3,
      entry_type: "payment" as const,
      transaction_date: "2026-11-18",
      particulars: "Tuition Fee Settlement",
      rate: 500,
      amount: 1500,
      status: "Paid",
    };
    await updateLedgerRecord("law", 10, payload);
    expect(api).toHaveBeenCalledWith("/api/v1/law-ledger/10", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  });

  it("deletes a ledger transaction", async () => {
    vi.mocked(api).mockResolvedValue(undefined);
    await deleteLedgerRecord("graduate", 99);
    expect(api).toHaveBeenCalledWith("/api/v1/graduate-ledger/99", {
      method: "DELETE",
    });
  });

  it("fetches student balance details", async () => {
    vi.mocked(api).mockResolvedValue({
      student: { id: 5, student_number: "2026-005", name: "Carol" },
      summary: { total_charges: 5000, total_payments: 2000, outstanding_balance: 3000 },
      transactions: [],
    });
    const result = await getLedgerBalance("graduate", 5);
    expect(api).toHaveBeenCalledWith(
      "/api/v1/graduate-ledger/students/5/balance",
      expect.any(Object),
    );
    expect(result.summary.outstanding_balance).toBe(3000);
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
    const [, init, timeoutMs] = vi.mocked(api).mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(init?.body).toBeInstanceOf(FormData);
    expect((init?.body as FormData).get("preset_course_id")).toBe("4");
    expect((init?.body as FormData).get("preset_academic_term_id")).toBe("8");
    expect(timeoutMs).toBe(360_000);
  });

  it("downloads ledger exports and PDFs as blobs for both ledgers", async () => {
    const blob = new Blob(["xlsx"]);
    vi.mocked(binary).mockResolvedValue(blob);
    await expect(exportLedger("graduate")).resolves.toBe(blob);
    await expect(exportLedger("law")).resolves.toBe(blob);
    expect(binary).toHaveBeenCalledWith(
      "/api/v1/graduate-ledger/export",
      {},
      360_000,
    );
    expect(binary).toHaveBeenCalledWith(
      "/api/v1/law-ledger/export",
      {},
      360_000,
    );
  });

  it("serializes active filters into the ledger export URL", async () => {
    const blob = new Blob(["xlsx"]);
    vi.mocked(binary).mockResolvedValue(blob);
    await expect(
      exportLedger("graduate", {
        search: "reyes",
        school_year: "2025-2026",
        entry_type: "ar",
        balance_status: "with_balance",
      }),
    ).resolves.toBe(blob);
    expect(binary).toHaveBeenCalledWith(
      "/api/v1/graduate-ledger/export?search=reyes&entry_type=ar&school_year=2025-2026&balance_status=with_balance",
      {},
      360_000,
    );
    await expect(getLedgerPdf("law", 42)).resolves.toBe(blob);
    expect(binary).toHaveBeenCalledWith(
      "/api/v1/law-ledger/pdf?student_id=42",
      {},
      360_000,
    );
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
