import { useQuery } from "@tanstack/react-query";
import { getDocuments } from "./api";
export function useDocuments(page: number, formInputId?: number) {
  return useQuery({
    queryKey: ["documents", page, formInputId],
    queryFn: ({ signal }) => getDocuments(page, formInputId, signal),
    placeholderData: (previous) => previous,
  });
}
