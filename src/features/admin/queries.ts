import { useQuery } from "@tanstack/react-query";
import {
  type ActivityLogFilterParams,
  type AdminUsersFilterParams,
  getAdminActivityLogs,
  getAdminDashboard,
  getAdminUsers,
} from "./api";

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: ({ signal }) => getAdminDashboard(signal),
    staleTime: 60_000,
  });
}

export function useAdminUsers(
  paramsOrPage: number | AdminUsersFilterParams = 1,
  search = "",
) {
  const queryKey =
    typeof paramsOrPage === "object"
      ? ["admin", "users", paramsOrPage]
      : ["admin", "users", { page: paramsOrPage, search }];

  return useQuery({
    queryKey,
    queryFn: ({ signal }) => getAdminUsers(paramsOrPage, search, signal),
    placeholderData: (previous) => previous,
  });
}

export function useAdminActivityLogs(params?: ActivityLogFilterParams) {
  return useQuery({
    queryKey: ["admin", "activity-logs", params],
    queryFn: ({ signal }) => getAdminActivityLogs(params, signal),
    placeholderData: (previous) => previous,
  });
}
