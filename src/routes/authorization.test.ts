import { describe, expect, it } from "vitest";
import { canAccessRole } from "./authorization";

const staff = {
  id: 1,
  name: "Staff",
  email: "staff@example.test",
  role: "staff" as const,
};

describe("role authorization", () => {
  it("allows users whose role is explicitly listed", () => {
    expect(canAccessRole(staff, ["staff", "admin"])).toBe(true);
  });

  it("denies missing users and roles outside the allowlist", () => {
    expect(canAccessRole(undefined, ["staff"])).toBe(false);
    expect(canAccessRole(staff, ["cashier"])).toBe(false);
  });
});
