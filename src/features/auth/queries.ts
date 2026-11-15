import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/client";
import { getCurrentUser } from "./api";

export const authKeys = {
  currentUser: ["auth", "current-user"] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser,
    queryFn: ({ signal }) => getCurrentUser(signal),
    retry: (failureCount, error) =>
      error instanceof ApiError && error.status >= 500 && failureCount < 2,
    staleTime: 60_000,
  });
}
