import { api, apiUrl } from "../../../api/client";

export type AssessmentOptions = {
  data: {
    courses: Array<{ id: number; course_code: string; course_desc: string }>;
  };
};
export type AssessmentSubmission = {
  data: { reference_number: string; access_token: string };
};

export function getAssessmentOptions(signal?: AbortSignal) {
  return api<AssessmentOptions>("/api/v1/public/assessmentform/options", {
    signal,
  });
}
export function submitAssessment(values: Record<string, string>) {
  return api<AssessmentSubmission>("/api/v1/public/assessmentform", {
    method: "POST",
    body: JSON.stringify(values),
  });
}
export function assessmentReceiptUrl(
  reference: string,
  token: string,
  download = false,
) {
  return apiUrl(
    `/api/v1/public/assessmentform/${encodeURIComponent(reference)}/${download ? "download" : "print"}?token=${encodeURIComponent(token)}`,
  );
}
