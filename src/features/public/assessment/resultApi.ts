import { api, apiUrl } from "../../../api/client";

export type AssessmentResult = {
  data: {
    reference_number: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    status?: string;
    course?: { course_code?: string; course_desc?: string };
  };
};

export function getAssessmentResult(
  reference: string,
  token: string,
  signal?: AbortSignal,
) {
  return api<AssessmentResult>(
    `/api/v1/public/assessmentform/${encodeURIComponent(reference)}?token=${encodeURIComponent(token)}`,
    { signal },
  );
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
