import { api, apiUrl } from "../../../api/client";

export type OpResult = {
  data: {
    reference_number: string;
    email?: string;
    firstname_or_office?: string;
    lastname_or_agency?: string;
    amount?: string | number;
    status?: string;
    membership?: { member_desc?: string };
    payment_detail_option?: { payment_desc?: string };
    course?: { course_code?: string; course_desc?: string };
    supporting_documents?: Array<{
      original_filename: string;
      mime_type: string;
    }>;
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
