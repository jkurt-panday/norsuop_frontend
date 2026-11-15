import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDocument, uploadDocument } from "./api";
export function useUploadDocument() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ formInputId, file }: { formInputId: number; file: File }) =>
      uploadDocument(formInputId, file),
    onSuccess: () => client.invalidateQueries({ queryKey: ["documents"] }),
  });
}
export function useDeleteDocument() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => client.invalidateQueries({ queryKey: ["documents"] }),
  });
}
