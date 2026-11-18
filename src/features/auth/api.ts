import { api } from "../../api/client";
import type { components } from "../../api/schema";

export type AuthUser = Required<components["schemas"]["User"]>;

type UserResponse = { data: AuthUser };

type MessageResponse = { message: string };

export function getCurrentUser(signal?: AbortSignal): Promise<UserResponse> {
  return api<UserResponse>("/api/v1/auth/user", { signal });
}

export function login(input: {
  email: string;
  password: string;
  remember?: boolean;
}): Promise<UserResponse> {
  return api<UserResponse>("/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout(): Promise<void> {
  return api<void>("/logout", { method: "POST" });
}

export function forgotPassword(email: string): Promise<MessageResponse> {
  return api<MessageResponse>("/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
