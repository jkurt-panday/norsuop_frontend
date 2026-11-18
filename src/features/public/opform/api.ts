import { api } from "../../../api/client";

export type Option = {
  id: number;
  name?: string;
  member_code?: string;
  member_desc?: string;
  payment_desc?: string;
  course_code?: string;
  course_desc?: string;
  school_year?: string;
  semester?: string;
};
export type OpOptions = {
  data: {
    memberships: Option[];
    paymentOptions: Option[];
    courses: Option[];
    academicTerms: Option[];
    collegeOffices: Option[];
  };
};
export type OpSubmission = {
  data: { reference_number: string; access_token: string };
};

export function getOpOptions(signal?: AbortSignal) {
  return api<OpOptions>("/api/v1/public/opform/options", { signal });
}

export function submitOpForm(
  values: Record<string, string | File | File[] | undefined>,
): Promise<OpSubmission> {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    if (Array.isArray(value))
      value.forEach((file) => form.append(`${key}[]`, file));
    else form.append(key, value);
  }
  return api<OpSubmission>("/api/v1/public/opform", {
    method: "POST",
    body: form,
  });
}
