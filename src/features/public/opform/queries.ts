import { useQuery } from "@tanstack/react-query";
import { getOpOptions } from "./api";

export const opFormKeys = { options: ["public", "opform", "options"] as const };

export function useOpOptions() {
  return useQuery({
    queryKey: opFormKeys.options,
    queryFn: ({ signal }) => getOpOptions(signal),
    staleTime: 300_000,
  });
}
