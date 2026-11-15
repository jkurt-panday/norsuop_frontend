import { api, apiUrl } from "../../api/client";
export type DocumentRecord = {
  id: number;
  form_input_id: number;
  original_filename: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string | null;
};
export type DocumentList = {
  data: DocumentRecord[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  links: { next: string | null; prev: string | null };
};
export function getDocuments(
  page = 1,
  formInputId?: number,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ page: String(page), per_page: "20" });
  if (formInputId) query.set("form_input_id", String(formInputId));
  return api<DocumentList>(`/api/v1/documents?${query}`, { signal });
}
export function uploadDocument(formInputId: number, file: File) {
  const body = new FormData();
  body.append("form_input_id", String(formInputId));
  body.append("document", file);
  return api<{ data: DocumentRecord }>("/api/v1/documents", {
    method: "POST",
    body,
  });
}
export function documentUrl(id: number, download = false) {
  return apiUrl(`/api/v1/documents/${id}/${download ? "download" : "view"}`);
}
export function deleteDocument(id: number) {
  return api<void>(`/api/v1/documents/${id}`, { method: "DELETE" });
}
