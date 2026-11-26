import { describe, expect, it, vi } from "vitest";
import {
  getCashierRequest,
  getCashierRequests,
  updateCashierPayment,
  getCashierPayorName,
  getCashierReferenceNumber,
  getCashierAmount,
  getCashierStatus,
  type CashierList,
  type CashierRequest,
} from "./api";
import { api } from "../../api/client";

vi.mock("../../api/client", () => ({ api: vi.fn() }));

describe("cashier API", () => {
  it("updates payment status with OR data", async () => {
    vi.mocked(api).mockResolvedValue({ data: {} });
    await updateCashierPayment(7, {
      status: "paid",
      or_no: "OR-1",
      or_date: "2026-11-13",
    });
    expect(api).toHaveBeenCalledWith(
      "/api/v1/cashier/requests/7/payment",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("fetches cashier requests with query filters and page", async () => {
    vi.mocked(api).mockResolvedValue({ data: [], meta: {}, links: {} } as unknown as CashierList);
    await getCashierRequests({ page: 2, per_page: 10, search: "INV-100", status: "processed" });
    expect(api).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/cashier/requests?page=2&per_page=10&search=INV-100&status=processed"),
      expect.anything(),
    );
  });

  it("fetches single cashier request by ID", async () => {
    vi.mocked(api).mockResolvedValue({ data: { id: 10 } as unknown as CashierRequest });
    await getCashierRequest(10);
    expect(api).toHaveBeenCalledWith("/api/v1/cashier/requests/10", expect.anything());
  });

  it("extracts cashier helper values reliably from both nested and flat shapes", () => {
    const nested = {
      id: 1,
      status: "processed",
      form_input: {
        reference_number: "REF-001",
        firstname_or_office: "Juan",
        lastname_or_agency: "Dela Cruz",
        email: "juan@example.com",
        amount: "1500.50",
      },
    };
    expect(getCashierReferenceNumber(nested)).toBe("REF-001");
    expect(getCashierPayorName(nested)).toBe("Juan Dela Cruz");
    expect(getCashierAmount(nested)).toBe(1500.5);
    expect(getCashierStatus(nested)).toBe("processed");

    const flat = {
      id: 2,
      reference_number: "REF-002",
      firstname_or_office: "Maria",
      lastname_or_agency: "Clara",
      email: "maria@example.com",
      amount: 200,
      staff_input: { status: "paid", or_no: "OR-999" },
    };
    expect(getCashierReferenceNumber(flat)).toBe("REF-002");
    expect(getCashierPayorName(flat)).toBe("Maria Clara");
    expect(getCashierAmount(flat)).toBe(200);
    expect(getCashierStatus(flat)).toBe("paid");
  });
});
