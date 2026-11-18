import { describe, expect, it, vi } from "vitest";
import { updateCashierPayment } from "./api";
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
});
