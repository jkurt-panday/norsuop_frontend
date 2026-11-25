import type { paths } from "./schema";

export type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};
export type ApiPaths = paths;

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;
  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message ?? `API request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.errors = payload.errors ?? {};
  }
}

const baseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const requestTimeoutMs = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 60_000);
let csrfPromise: Promise<void> | undefined;

function timeoutError(): ApiError {
  return new ApiError(408, {
    message: "The API request timed out. Please try again.",
  });
}

function requestSignal(
  parentSignal: AbortSignal | null | undefined,
  timeoutMs = requestTimeoutMs,
): {
  signal: AbortSignal;
  cleanup: () => void;
  timedOut: () => boolean;
} {
  const controller = new AbortController();
  let didTimeout = false;
  const timeout = window.setTimeout(() => {
    didTimeout = true;
    controller.abort(timeoutError());
  }, timeoutMs);
  const abortParent = () => controller.abort(parentSignal?.reason);
  parentSignal?.addEventListener("abort", abortParent, { once: true });
  return {
    signal: controller.signal,
    cleanup: () => {
      window.clearTimeout(timeout);
      parentSignal?.removeEventListener("abort", abortParent);
    },
    timedOut: () => didTimeout,
  };
}

function xsrfToken(): string | undefined {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith("XSRF-TOKEN="));
  return cookie
    ? decodeURIComponent(cookie.slice("XSRF-TOKEN=".length))
    : undefined;
}

export async function csrf(parentSignal?: AbortSignal): Promise<void> {
  if (csrfPromise) return csrfPromise;
  const signals = requestSignal(parentSignal);
  csrfPromise = fetch(`${baseUrl}/sanctum/csrf-cookie`, {
    credentials: "include",
    headers: { Accept: "application/json" },
    signal: signals.signal,
  })
    .then(async (response) => {
      if (!response.ok) await parseError(response);
    })
    .catch((error: unknown) => {
      csrfPromise = undefined;
      if (signals.timedOut()) throw timeoutError();
      throw error;
    })
    .finally(() => signals.cleanup());
  return csrfPromise;
}

async function request(
  path: string,
  init: RequestInit = {},
  timeoutMs = requestTimeoutMs,
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method))
    await csrf(init.signal ?? undefined);
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (method !== "GET" && method !== "HEAD") {
    const token = xsrfToken();
    if (token) headers.set("X-XSRF-TOKEN", token);
  }
  if (!(init.body instanceof FormData) && init.body !== undefined)
    headers.set("Content-Type", "application/json");
  const signals = requestSignal(init.signal, timeoutMs);
  try {
    return await fetch(`${baseUrl}${path}`, {
      ...init,
      method,
      headers,
      credentials: "include",
      signal: signals.signal,
    });
  } catch (error) {
    if (signals.timedOut()) throw timeoutError();
    throw error;
  } finally {
    signals.cleanup();
  }
}

async function parseError(response: Response): Promise<never> {
  const contentType = response.headers.get("content-type") ?? "";
  let payload: unknown;
  try {
    payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  } catch {
    payload = "The API returned an unreadable error response.";
  }
  const normalized =
    payload && typeof payload === "object"
      ? (payload as ApiErrorPayload)
      : {
          message: String(payload || `API request failed (${response.status})`),
        };
  throw new ApiError(response.status, normalized);
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = requestTimeoutMs,
): Promise<T> {
  const response = await request(path, init, timeoutMs);
  if (response.status === 204) return undefined as T;
  if (!response.ok) return parseError(response);
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  return payload as T;
}

export async function binary(
  path: string,
  init: RequestInit = {},
  timeoutMs = requestTimeoutMs,
): Promise<Blob> {
  const response = await request(path, init, timeoutMs);
  if (!response.ok) return parseError(response);
  return response.blob();
}

export function apiUrl(path: string): string {
  return `${baseUrl}${path}`;
}
