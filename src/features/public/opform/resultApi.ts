import { api, apiUrl } from "../../../api/client";

export type OpResult = {
  data: {
    reference_number: string;
    email?: string;
    contact_num?: string;
    firstname_or_office?: string;
    middlename_or_project?: string;
    lastname_or_agency?: string;
    office_or_college?: string;
    position_or_designation?: string;
    address?: string;
    amount?: string | number;
    request_type?: string;
    status?: string;
    submitted_student_number?: string;
    academic_term?: { school_year?: string; semester?: string };
    membership?: { member_code?: string; member_desc?: string };
    payment_detail_option?: { payment_desc?: string };
    course?: { id?: number; course_code?: string; course_desc?: string };
     supporting_documents?: Array<{
       id?: number;
       original_filename: string;
       mime_type: string;
       file_size?: number;
       uploaded_at?: string;
     }>;
    created_at?: string;
  };
};

export function getOpResult(
  reference: string,
  token: string,
  signal?: AbortSignal,
) {
  return api<OpResult>(
    `/api/v1/public/opform/${encodeURIComponent(reference)}?token=${encodeURIComponent(token)}`,
    { signal },
  );
}

export function opReceiptUrl(
  reference: string,
  token: string,
  download = false,
) {
  return apiUrl(
    `/api/v1/public/opform/${encodeURIComponent(reference)}/${download ? "download" : "print"}?token=${encodeURIComponent(token)}`,
  );
}
