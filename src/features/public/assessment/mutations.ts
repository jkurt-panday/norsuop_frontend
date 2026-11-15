import { useMutation } from "@tanstack/react-query";
import { submitAssessment } from "./api";

export function useSubmitAssessment() {
  return useMutation({ mutationFn: submitAssessment });
}
