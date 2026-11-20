import { useQuery } from "@tanstack/react-query";
import {
  getMasterRecords,
  type MasterList,
  type MasterQueryOptions,
  type MasterRecord,
  type MasterResource,
} from "./api";

export function useMasterRecords<T = MasterRecord>(
  resource: MasterResource,
  pageOrOptions: number | MasterQueryOptions = 1,
  searchOrSort = "",
  direction?: "asc" | "desc",
) {
  const options: MasterQueryOptions =
    typeof pageOrOptions === "object" && pageOrOptions !== null
      ? pageOrOptions
      : { page: pageOrOptions, search: searchOrSort, sort: "", direction };

  return useQuery<MasterList<T>>({
    queryKey: ["masterdata", resource, options],
    queryFn: ({ signal }) =>
      getMasterRecords<T>(resource, { ...options, signal }),
    placeholderData: (previous) => previous,
  });
}
