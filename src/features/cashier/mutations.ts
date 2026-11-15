import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCashierPayment } from "./api";
export function useCashierPayment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { status: string; or_no?: string; or_date?: string };
    }) => updateCashierPayment(id, payload),
    onSuccess: (_, v) => {
      client.invalidateQueries({ queryKey: ["cashier", "requests"] });
      client.invalidateQueries({ queryKey: ["cashier", "request", v.id] });
    },
  });
}
