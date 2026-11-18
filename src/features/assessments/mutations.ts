import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type AssessmentStatus,
  type EmailAssessmentSoaPayload,
  deleteAssessment,
  emailAssessmentSoa,
  updateAssessmentStatus,
} from "./api";

export function useUpdateAssessmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number | string;
      status: AssessmentStatus;
    }) => updateAssessmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

export function useDeleteAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteAssessment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

export function useEmailAssessmentSoa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload?: EmailAssessmentSoaPayload;
    }) => emailAssessmentSoa(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}
