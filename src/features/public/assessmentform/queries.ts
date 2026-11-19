import { useQuery } from "@tanstack/react-query";
import { getAssessmentOptions } from "./api";

export function useAssessmentOptions() {
  return useQuery({
    queryKey: ["public", "assessmentform", "options"],
    queryFn: ({ signal }) => getAssessmentOptions(signal),
    staleTime: 300_000,
  });
}
