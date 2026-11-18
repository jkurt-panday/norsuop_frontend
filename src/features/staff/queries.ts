import { useQuery } from "@tanstack/react-query";
import {
  type StaffActivityLogFilterParams,
  type StaffFilters,
  getStaffActivityLogs,
  getStaffDashboard,
  getStaffRequests,
} from "./api";

export function useStaffRequests(filters: StaffFilters) {
  return useQuery({
    queryKey: ["staff", "requests", filters],
    queryFn: ({ signal }) => getStaffRequests(filters, signal),
    placeholderData: (previous) => previous,
  });
}

export function useStaffDashboard() {
  return useQuery({
    queryKey: ["staff", "dashboard"],
    queryFn: ({ signal }) => getStaffDashboard(signal),
    staleTime: 60_000,
  });
}

export function useStaffActivityLogs(params: StaffActivityLogFilterParams = {}) {
  return useQuery({
    queryKey: ["staff", "activityLogs", params],
    queryFn: ({ signal }) => getStaffActivityLogs(params, signal),
    placeholderData: (previous) => previous,
  });
}
