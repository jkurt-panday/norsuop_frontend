import { useQuery } from "@tanstack/react-query";
import { getOpResult } from "./resultApi";

export function useOpResult(
  reference: string | undefined,
  token: string | undefined,
) {
  return useQuery({
    queryKey: ["public", "opform", "result", reference, token],
    queryFn: ({ signal }) => getOpResult(reference!, token!, signal),
    enabled: Boolean(reference && token),
    retry: false,
  });
}
