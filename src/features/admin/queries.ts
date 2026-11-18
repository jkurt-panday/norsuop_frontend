import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard, getAdminUsers } from "./api";
export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: ({ signal }) => getAdminDashboard(signal),
    staleTime: 60_000,
  });
}
export function useAdminUsers(page: number, search: string) {
  return useQuery({
    queryKey: ["admin", "users", page, search],
    queryFn: ({ signal }) => getAdminUsers(page, search, signal),
    placeholderData: (previous) => previous,
  });
}
