import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  processStaffRequest,
  updateStaffProcessing,
  updateStaffDetails,
  searchOpStudents,
  linkOpStudent,
  emailOpRequest,
  getOpPdfUrl,
} from "./api";

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

export function useUpdateStaffProcessing() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Record<string, unknown>;
    }) => updateStaffProcessing(id, payload),
    onSuccess: (_, variables) => {
      client.invalidateQueries({ queryKey: ["staff", "requests"] });
      client.invalidateQueries({
        queryKey: ["staff", "request", variables.id],
      });
    },
  });
}

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
    onSuccess: (_, variables) => {
      client.invalidateQueries({ queryKey: ["staff", "requests"] });
      client.invalidateQueries({
        queryKey: ["staff", "request", variables.id],
      });
    },
  });
}

export function useSearchOpStudents() {
  return useMutation({
    mutationFn: ({ q }: { q: string }) => searchOpStudents(q),
  });
}

export function useLinkOpStudent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      student_id,
    }: {
      id: number;
      student_id: number;
    }) => linkOpStudent(id, student_id),
    onSuccess: (_, variables) => {
      client.invalidateQueries({ queryKey: ["staff", "request", variables.id] });
    },
  });
}

export function useEmailOpRequest() {
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { subject: string; recipient_name: string; note?: string };
    }) => emailOpRequest(id, payload),
  });
}

export { getOpPdfUrl };
