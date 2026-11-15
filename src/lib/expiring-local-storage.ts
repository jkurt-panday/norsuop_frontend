const MAX_AGE_MS = 24 * 60 * 60 * 1000;

type StoredValue<T> = { value: T; expiresAt: number };

export function getExpiringLocalStorage<T>(key: string): T | undefined {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return undefined;
    const stored = JSON.parse(raw) as StoredValue<T>;
    if (stored.expiresAt <= Date.now()) {
      window.localStorage.removeItem(key);
      return undefined;
    }
    return stored.value;
  } catch {
    return undefined;
  }
}

export function setExpiringLocalStorage<T>(
  key: string,
  value: T,
  maxAgeMs = MAX_AGE_MS,
): void {
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        value,
        expiresAt: Date.now() + maxAgeMs,
      } satisfies StoredValue<T>),
    );
  } catch {
    // Prefill persistence is optional; private browsing/storage limits must not block submission.
  }
}
