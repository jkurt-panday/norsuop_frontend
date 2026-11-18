import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAdminUser, deleteAdminUser, toggleAdminUser } from "./api";
export function useCreateAdminUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}
export function useToggleAdminUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: toggleAdminUser,
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin"] }),
  });
}
export function useDeleteAdminUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}
