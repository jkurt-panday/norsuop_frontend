import { useQuery } from "@tanstack/react-query";
import { getAssessmentResult } from "./resultApi";

export function useAssessmentResult(
  reference: string | undefined,
  token: string | undefined,
) {
  return useQuery({
    queryKey: ["public", "assessmentform", "result", reference, token],
    queryFn: ({ signal }) => getAssessmentResult(reference!, token!, signal),
    enabled: Boolean(reference && token),
    retry: false,
  });
}
