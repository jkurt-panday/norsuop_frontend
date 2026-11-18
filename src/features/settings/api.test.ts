import { beforeEach, describe, expect, it, vi } from "vitest";
import { updatePassword, updateProfile } from "./api";
import { api } from "../../api/client";

vi.mock("../../api/client", () => ({ api: vi.fn() }));

describe("settings API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates user profile with PATCH /api/v1/settings/profile", async () => {
    vi.mocked(api).mockResolvedValue({
      message: "Profile updated successfully.",
      data: {
        id: 1,
        name: "New Name",
        email: "new@example.com",
        role: "staff",
      },
    });

    const res = await updateProfile({
      name: "New Name",
      email: "new@example.com",
    });

    expect(api).toHaveBeenCalledWith(
      "/api/v1/settings/profile",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          name: "New Name",
          email: "new@example.com",
        }),
      }),
    );
    expect(res.data.name).toBe("New Name");
  });

  it("updates user password with PUT /api/v1/settings/password", async () => {
    vi.mocked(api).mockResolvedValue({
      message: "Password updated successfully.",
    });

    const res = await updatePassword({
      current_password: "OldPassword1!",
      password: "NewPassword1!",
      password_confirmation: "NewPassword1!",
    });

    expect(api).toHaveBeenCalledWith(
      "/api/v1/settings/password",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          current_password: "OldPassword1!",
          password: "NewPassword1!",
          password_confirmation: "NewPassword1!",
        }),
      }),
    );
    expect(res.message).toBe("Password updated successfully.");
  });
});
