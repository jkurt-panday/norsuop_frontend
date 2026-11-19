import { api, apiUrl } from "../../../api/client";

export type AssessmentResult = {
  data: {
    reference_number: string;
    email?: string;
    contact_num?: string;
    first_name?: string;
    middle_name?: string | null;
    last_name?: string;
    student_id?: string;
    address?: string;
    enrolled_under?: string;
    sy_last_attended?: string;
    semester?: string;
    created_at?: string;
    status?: string;
    course?: { id?: number | string; course_code?: string; course_desc?: string };
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
