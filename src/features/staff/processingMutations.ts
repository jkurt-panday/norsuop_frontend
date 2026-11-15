import { useMutation, useQueryClient } from "@tanstack/react-query";
import { processStaffRequest } from "./api";

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
    onSuccess: (_, variables) => {
      client.invalidateQueries({ queryKey: ["staff", "requests"] });
      client.invalidateQueries({
        queryKey: ["staff", "request", variables.id],
      });
    },
  });
}
