import { useQuery } from "@tanstack/react-query";
import { getStaffRequests, type StaffFilters } from "./api";

export function useStaffRequests(filters: StaffFilters) {
  return useQuery({
    queryKey: ["staff", "requests", filters],
    queryFn: ({ signal }) => getStaffRequests(filters, signal),
    placeholderData: (previous) => previous,
  });
}
