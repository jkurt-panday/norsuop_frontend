import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, api, binary } from "./client";

describe("api client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends JSON requests with credentials and parses responses", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    await expect(api<{ data: { ok: boolean } }>("/api/test")).resolves.toEqual({
      data: { ok: true },
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/test"),
      expect.objectContaining({
        credentials: "include",
        headers: expect.any(Headers),
      }),
    );
  });

  it("downloads binary responses with credentials", async () => {
    const blob = new Blob(["xlsx"]);
    vi.mocked(fetch).mockResolvedValue(
      new Response(blob, {
        status: 200,
        headers: {
          "content-type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      }),
    );
    await expect(binary("/api/export")).resolves.toBeInstanceOf(Blob);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/export"),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("retries CSRF bootstrap after a failed response", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "CSRF unavailable" }), {
          status: 503,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    await expect(
      api("/api/test", { method: "POST", body: JSON.stringify({ ok: true }) }),
    ).rejects.toMatchObject({ status: 503 });
    await expect(
      api<{ ok: boolean }>("/api/test", {
        method: "POST",
        body: JSON.stringify({ ok: true }),
      }),
    ).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("preserves caller cancellation", async () => {
    const controller = new AbortController();
    vi.mocked(fetch).mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        }),
    );
    const pending = api("/api/search", { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  it("normalizes empty and malformed error responses", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("", {
        status: 502,
        headers: { "content-type": "application/json" },
      }),
    );
    await expect(api("/api/test")).rejects.toMatchObject({
      status: 502,
      message: "The API returned an unreadable error response.",
    });
  });

  it("converts JSON failures into ApiError", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ message: "Invalid", errors: { email: ["Required"] } }),
        { status: 422, headers: { "content-type": "application/json" } },
      ),
    );
    await expect(api("/api/test")).rejects.toMatchObject({
      status: 422,
      message: "Invalid",
      errors: { email: ["Required"] },
    } satisfies Partial<ApiError>);
  });
});
