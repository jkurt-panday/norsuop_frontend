import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type CreateAdminUserPayload,
  type UpdateAdminUserPayload,
  createAdminUser,
  deleteAdminUser,
  toggleAdminUser,
  updateAdminUser,
} from "./api";

export function useCreateAdminUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAdminUserPayload) => createAdminUser(payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin", "users"] });
      client.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      client.invalidateQueries({ queryKey: ["admin", "activity-logs"] });
    },
  });
}

export function useUpdateAdminUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateAdminUserPayload;
    }) => updateAdminUser(id, payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin", "users"] });
      client.invalidateQueries({ queryKey: ["admin", "activity-logs"] });
    },
  });
}

export function useToggleAdminUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => toggleAdminUser(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin", "users"] });
      client.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      client.invalidateQueries({ queryKey: ["admin", "activity-logs"] });
    },
  });
}

export function useDeleteAdminUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAdminUser(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin", "users"] });
      client.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      client.invalidateQueries({ queryKey: ["admin", "activity-logs"] });
    },
  });
}
