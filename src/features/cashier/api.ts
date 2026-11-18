import { api } from "../../api/client";

export type CashierFormInput = {
  id?: number;
  reference_number: string;
  firstname_or_office: string;
  middlename_or_project?: string | null;
  lastname_or_agency: string;
  email: string;
  amount: string | number;
  contact_num?: string;
  office_or_college?: string;
  membership?: { member_desc?: string; member_code?: string };
  payment_detail_option?: { payment_desc?: string };
  course?: { course_code?: string; course_desc?: string };
};

export type CashierRequest = {
  id: number;
  status?: "processed" | "paid" | "cancelled" | "pending" | string;
  or_no?: string | null;
  or_date?: string | null;
  ref_date?: string | null;
  created_at?: string;
  updated_at?: string;
  form_input_id?: number;

  // Form input relationship (from StaffInput in API)
  form_input?: CashierFormInput | null;
  formInput?: CashierFormInput | null;

  // Direct properties (fallback / mock shapes)
  reference_number?: string;
  firstname_or_office?: string;
  middlename_or_project?: string | null;
  lastname_or_agency?: string;
  email?: string;
  amount?: string | number;
  contact_num?: string;
  office_or_college?: string;
  staff_input?: { status?: string; or_no?: string; or_date?: string };
  membership?: { member_desc?: string };
  payment_detail_option?: { payment_desc?: string };
  course?: { course_code?: string; course_desc?: string };
};

export function getCashierReferenceNumber(request: CashierRequest): string {
  return (
    request.form_input?.reference_number ??
    request.formInput?.reference_number ??
    request.reference_number ??
    "—"
  );
}

export function getCashierPayorName(request: CashierRequest): string {
  const fi = request.form_input ?? request.formInput;
  if (fi) {
    return [fi.firstname_or_office, fi.middlename_or_project, fi.lastname_or_agency]
      .filter(Boolean)
      .join(" ")
      .trim();
  }
  return [request.firstname_or_office, request.middlename_or_project, request.lastname_or_agency]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function getCashierEmail(request: CashierRequest): string {
  return request.form_input?.email ?? request.formInput?.email ?? request.email ?? "—";
}

export function getCashierAmount(request: CashierRequest): number {
  const val = request.form_input?.amount ?? request.formInput?.amount ?? request.amount;
  return Number(val ?? 0);
}

export function getCashierStatus(request: CashierRequest): string {
  return request.status ?? request.staff_input?.status ?? "unprocessed";
}

export function getCashierOrNo(request: CashierRequest): string | null {
  return request.or_no ?? request.staff_input?.or_no ?? null;
}

export function getCashierOrDate(request: CashierRequest): string | null {
  return request.or_date ?? request.staff_input?.or_date ?? null;
}

export type CashierList = {
  data: CashierRequest[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  links: { next: string | null; prev: string | null };
};

export type CashierFilters = {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  direction?: "asc" | "desc";
};

export function getCashierRequests(
  filtersOrPage: CashierFilters | number = 1,
  searchOrSignal?: string | AbortSignal,
  optionalSignal?: AbortSignal,
) {
  let filters: CashierFilters = {};
  let signal: AbortSignal | undefined;

  if (typeof filtersOrPage === "number") {
    filters = {
      page: filtersOrPage,
      per_page: 10,
      search: typeof searchOrSignal === "string" ? searchOrSignal : "",
    };
    signal = optionalSignal;
  } else {
    filters = filtersOrPage;
    signal = searchOrSignal instanceof AbortSignal ? searchOrSignal : optionalSignal;
  }

  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value).trim());
    }
  });

  return api<CashierList>(`/api/v1/cashier/requests?${query}`, { signal });
}

export function getCashierRequest(id: number, signal?: AbortSignal) {
  return api<{ data: CashierRequest }>(`/api/v1/cashier/requests/${id}`, {
    signal,
  });
}

export function updateCashierPayment(
  id: number,
  payload: { status: string; or_no?: string; or_date?: string },
) {
  return api(`/api/v1/cashier/requests/${id}/payment`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
