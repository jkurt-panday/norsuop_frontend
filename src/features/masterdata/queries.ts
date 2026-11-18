import { useQuery } from "@tanstack/react-query";
import { getMasterRecords, type MasterResource } from "./api";
export function useMasterRecords(
  resource: MasterResource,
  page: number,
  search: string,
) {
  return useQuery({
    queryKey: ["masterdata", resource, page, search],
    queryFn: ({ signal }) => getMasterRecords(resource, page, search, signal),
    placeholderData: (previous) => previous,
  });
}
