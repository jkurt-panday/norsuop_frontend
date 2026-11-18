import { useQuery } from "@tanstack/react-query";
import { getStaffRequest } from "./api";

export function useStaffRequest(id: number | undefined) {
  return useQuery({
    queryKey: ["staff", "request", id],
    queryFn: ({ signal }) => getStaffRequest(id!, signal),
    enabled: id !== undefined,
  });
}
