import { useQuery } from "@tanstack/react-query";
import { getCashierRequest, getCashierRequests } from "./api";
export function useCashierRequests(page: number, search: string) {
  return useQuery({
    queryKey: ["cashier", "requests", page, search],
    queryFn: ({ signal }) => getCashierRequests(page, search, signal),
    placeholderData: (previous) => previous,
  });
}
export function useCashierRequest(id: number | undefined) {
  return useQuery({
    queryKey: ["cashier", "request", id],
    queryFn: ({ signal }) => getCashierRequest(id!, signal),
    enabled: id !== undefined,
  });
}
