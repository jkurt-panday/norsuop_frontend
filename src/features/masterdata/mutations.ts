import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createMasterRecord,
  deleteMasterRecord,
  importUacs,
  setActiveOfficial,
  updateMasterRecord,
  type MasterResource,
} from "./api";

export function useCreateMasterRecord() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      resource,
      payload,
    }: {
      resource: MasterResource;
      payload: Record<string, unknown>;
    }) => createMasterRecord(resource, payload),
    onSuccess: () => client.invalidateQueries({ queryKey: ["masterdata"] }),
  });
}

export function useUpdateMasterRecord() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      resource,
      id,
      payload,
    }: {
      resource: MasterResource;
      id: number;
      payload: Record<string, unknown>;
    }) => updateMasterRecord(resource, id, payload),
    onSuccess: () => client.invalidateQueries({ queryKey: ["masterdata"] }),
  });
}

export function useDeleteMasterRecord() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ resource, id }: { resource: MasterResource; id: number }) =>
      deleteMasterRecord(resource, id),
    onSuccess: () => client.invalidateQueries({ queryKey: ["masterdata"] }),
  });
}

export function useSetActiveOfficial() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => setActiveOfficial(id),
    onSuccess: () => client.invalidateQueries({ queryKey: ["masterdata"] }),
  });
}

export function useImportUacs() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importUacs(file),
    onSuccess: () => client.invalidateQueries({ queryKey: ["masterdata"] }),
  });
}
