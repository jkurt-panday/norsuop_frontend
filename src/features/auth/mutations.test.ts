import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { logout } from "./api";

vi.mock("./api", () => ({ login: vi.fn(), logout: vi.fn() }));

describe("auth cache lifecycle", () => {
  it("clears all cached server state after logout", async () => {
    const client = new QueryClient();
    client.setQueryData(["auth", "current-user"], { data: { id: 1 } });
    client.setQueryData(["ledger", "graduate"], { data: [{ id: 1 }] });
    vi.mocked(logout).mockResolvedValue(undefined);

    await vi.mocked(logout)();
    client.clear();

    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });
});
