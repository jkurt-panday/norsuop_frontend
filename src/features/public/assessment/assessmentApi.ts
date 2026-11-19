import { api } from "../../../api/client";

export type AssessmentStatus = "pending" | "mailed" | "rejected" | "completed";

export type Assessment = {
  id: number;
  reference_number: string;
  email: string;
  contact_num?: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  student_id?: string | null;
  address?: string;
  enrolled_under: string;
  sy_last_attended: string;
  semester: string;
  created_at: string;
  course: { id: number; course_code: string; course_desc: string };
  status: AssessmentStatus | null;
};

export type AssessmentFilters = {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: "reference_number" | "last_name" | "created_at";
  direction?: "asc" | "desc";
  date_from?: string;
  date_to?: string;
  course_id?: string;
  enrolled_under?: string;
  sy_last_attended?: string;
  semester?: string;
  status?: string;
};

export type AssessmentList = {
  data: Assessment[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
  links: { next: string | null; prev: string | null };
};

export type AssessmentFilterOptions = {
  courses: { id: number; course_code: string }[];
  enrolledUnder: string[];
  syLastAttended: string[];
  semesters: string[];
  statuses: AssessmentStatus[];
};

export function getAssessments(filters: AssessmentFilters, signal?: AbortSignal) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  return api<AssessmentList>(`/api/v1/assessments?${query.toString()}`, { signal });
}

export function getAssessmentFilterOptions(signal?: AbortSignal) {
  return api<{ data: AssessmentFilterOptions }>("/api/v1/assessments/filter-options", { signal });
}

export function getAssessmentCourses(signal?: AbortSignal) {
  return api<{ data: { id: number; course_code: string; course_desc: string }[] }>(
    "/api/v1/courses?per_page=100",
    { signal },
  );
}

export function getAssessment(id: string | number, signal?: AbortSignal) {
  return api<{ data: Assessment }>(`/api/v1/assessments/${id}`, { signal });
}

export function updateAssessmentStatus(id: string | number, status: AssessmentStatus) {
  return api<{ data: Assessment }>(`/api/v1/assessments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function emailAssessmentStatement(
  id: string | number,
  payload: { subject?: string; recipient_name?: string; note?: string },
) {
  return api<{ message: string }>(`/api/v1/assessments/${id}/email-soa`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function assessmentStatementUrl(id: string | number) {
  return `/api/v1/assessments/${id}/print-soa`;
}

export function deleteAssessment(id: number) {
  return api<void>(`/api/v1/assessments/${id}`, { method: "DELETE" });
}
