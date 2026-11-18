import { useQuery } from "@tanstack/react-query";
import {
  type AssessmentFilterParams,
  getAssessment,
  getAssessmentDashboard,
  getAssessments,
} from "./api";

export function useAssessments(params: AssessmentFilterParams = {}) {
  return useQuery({
    queryKey: ["assessments", "list", params],
    queryFn: ({ signal }) => getAssessments(params, signal),
    placeholderData: (previous) => previous,
  });
}

export function useAssessmentDashboard() {
  return useQuery({
    queryKey: ["assessments", "dashboard"],
    queryFn: ({ signal }) => getAssessmentDashboard(signal),
    staleTime: 60_000,
  });
}

export function useAssessmentDetail(id?: number | string) {
  return useQuery({
    queryKey: ["assessments", "detail", id],
    queryFn: ({ signal }) => getAssessment(id!, signal),
    enabled: Boolean(id),
  });
}
