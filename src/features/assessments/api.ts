import { api } from "../../api/client";

export type AssessmentStatus = "pending" | "mailed" | "rejected" | "completed";

export type AssessmentCourse = {
  id: number;
  course_code: string;
  course_desc: string;
};

export type AssessmentItem = {
  id: number;
  reference_number: string;
  email: string;
  contact_num: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  student_id?: string | null;
  address: string;
  enrolled_under: string;
  sy_last_attended: string;
  semester: string;
  status: AssessmentStatus | null;
  created_at: string;
  course: AssessmentCourse;
};

export type AssessmentsResponse = {
  data: AssessmentItem[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  links: { next: string | null; prev: string | null };
};

export type AssessmentDashboardData = {
  by_course: Array<{ course: string; total: number }>;
  by_semester: Array<{ semester: string; total: number }>;
  by_enrolled_under: Array<{ enrolled_under: string; total: number }>;
  monthly_trend: Array<{ month: string; total: number }>;
  daily_requests: Array<{ date: string; total: number }>;
  requests_trend: { value: number; recent: number; previous: number };
};

export type AssessmentFilterParams = {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: string;
  direction?: "asc" | "desc";
  date_from?: string;
  date_to?: string;
  course_id?: string;
  enrolled_under?: string;
  sy_last_attended?: string;
  semester?: string;
  status?: string;
};

export function getAssessments(
  params: AssessmentFilterParams = {},
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("per_page", String(params.per_page ?? 10));

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.sort?.trim()) query.set("sort", params.sort.trim());
  if (params.direction?.trim()) query.set("direction", params.direction.trim());
  if (params.date_from?.trim()) query.set("date_from", params.date_from.trim());
  if (params.date_to?.trim()) query.set("date_to", params.date_to.trim());
  if (params.course_id?.trim() && params.course_id !== "all") {
    query.set("course_id", params.course_id.trim());
  }
  if (params.enrolled_under?.trim() && params.enrolled_under !== "all") {
    query.set("enrolled_under", params.enrolled_under.trim());
  }
  if (params.sy_last_attended?.trim() && params.sy_last_attended !== "all") {
    query.set("sy_last_attended", params.sy_last_attended.trim());
  }
  if (params.semester?.trim() && params.semester !== "all") {
    query.set("semester", params.semester.trim());
  }
  if (params.status?.trim() && params.status !== "all") {
    query.set("status", params.status.trim());
  }

  const qs = query.toString();
  return api<AssessmentsResponse>(`/api/v1/assessments${qs ? `?${qs}` : ""}`, {
    signal,
  });
}

export function getAssessmentCourses(signal?: AbortSignal) {
  return api<{ data: AssessmentCourse[] }>("/api/v1/courses?per_page=100", { signal });
}

export function getAssessmentDashboard(signal?: AbortSignal) {
  return api<{ data: AssessmentDashboardData }>("/api/v1/assessments/dashboard", {
    signal,
  });
}

export function getAssessment(id: number | string, signal?: AbortSignal) {
  return api<{ data: AssessmentItem }>(`/api/v1/assessments/${id}`, {
    signal,
  });
}

export function updateAssessmentStatus(
  id: number | string,
  status: AssessmentStatus,
) {
  return api<{ message: string; data: AssessmentItem }>(
    `/api/v1/assessments/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}

export function deleteAssessment(id: number | string) {
  return api<void>(`/api/v1/assessments/${id}`, {
    method: "DELETE",
  });
}

export type EmailAssessmentSoaPayload = {
  subject?: string;
  recipient_name?: string;
  note?: string;
};

export function emailAssessmentSoa(
  id: number | string,
  payload: EmailAssessmentSoaPayload = {},
) {
  return api<{ message: string }>(`/api/v1/assessments/${id}/email-soa`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAssessmentPrintSoaUrl(
  id: number | string,
  ledgerStudent?: string,
) {
  const baseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  const query = ledgerStudent
    ? `?ledger_student=${encodeURIComponent(ledgerStudent)}`
    : "";
  return `${baseUrl}/api/v1/assessments/${id}/print-soa${query}`;
}
