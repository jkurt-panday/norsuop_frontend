import { useQuery } from "@tanstack/react-query";
import { getCashierRequest, getCashierRequests, type CashierFilters } from "./api";

export function useCashierRequests(filtersOrPage: CashierFilters | number, search = "") {
  const filters: CashierFilters =
    typeof filtersOrPage === "number"
      ? { page: filtersOrPage, search, per_page: 10 }
      : filtersOrPage;

  return useQuery({
    queryKey: ["cashier", "requests", filters],
    queryFn: ({ signal }) => getCashierRequests(filters, signal),
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
