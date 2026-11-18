import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type UpdatePasswordPayload,
  type UpdateProfilePayload,
  updatePassword,
  updateProfile,
} from "./api";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (payload: UpdatePasswordPayload) => updatePassword(payload),
  });
}
