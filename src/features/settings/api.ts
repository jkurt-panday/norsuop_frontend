import { api } from "../../api/client";

export type UpdateProfilePayload = {
  name: string;
  email: string;
};

export type UpdatePasswordPayload = {
  current_password?: string;
  password: string;
  password_confirmation: string;
};

export type UpdatedUserResponse = {
  message: string;
  data: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
};

export function updateProfile(payload: UpdateProfilePayload) {
  return api<UpdatedUserResponse>("/api/v1/settings/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updatePassword(payload: UpdatePasswordPayload) {
  return api<{ message: string }>("/api/v1/settings/password", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
