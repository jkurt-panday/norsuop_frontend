import { useMutation, useQueryClient } from "@tanstack/react-query";
import { linkOpStudent, updateStaffDetails } from "./api";

export function useUpdateStaffDetails() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Record<string, unknown>;
    }) => updateStaffDetails(id, payload),
    onSuccess: (_, v) => {
      client.invalidateQueries({ queryKey: ["staff", "requests"] });
      client.invalidateQueries({ queryKey: ["staff", "request", v.id] });
    },
  });
}
export function useLinkOpStudent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, studentId }: { id: number; studentId: number }) =>
      linkOpStudent(id, studentId),
    onSuccess: (_, v) =>
      client.invalidateQueries({ queryKey: ["staff", "request", v.id] }),
  });
}
