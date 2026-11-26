import { useMutation, useQueryClient } from "@tanstack/react-query";
import { processStaffRequest, deleteStaffRequest, bulkEmailOp } from "./api";

export function useProcessStaffRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Record<string, unknown>;
    }) => processStaffRequest(id, payload),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["staff", "requests"] }),
  });
}

export function useDeleteStaffRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteStaffRequest(id),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["staff", "requests"] }),
  });
}

export function useBulkEmailOp() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      form_input_ids: number[];
      subject?: string;
      recipient_name?: string;
      note?: string;
    }) => bulkEmailOp(payload),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["staff", "requests"] }),
  });
}
