async function resolveBase() {
  const candidates = [
    process.env.SPA_URL,
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://[::1]:4173",
  ].filter(Boolean);

  for (const url of candidates) {
    try {
      const res = await fetch(`${url}/`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return url;
    } catch {
      // try next candidate
    }
  }
  throw new Error("Vite preview not reachable on any candidate URL. Did you run `pnpm preview` first?");
}

const baseUrl = await resolveBase();
console.log(`Smoke testing against: ${baseUrl}`);
const routes = [
  "/",
  "/login",
  "/opform",
  "/assessmentform",
  "/graduate-ledger",
  "/staff/requests/123",
  "/admin/users",
  "/does-not-exist",
];

for (const route of routes) {
  const response = await fetch(`${baseUrl}${route}`);
  const body = await response.text();
  if (response.status !== 200 || !body.includes('<div id="root"></div>')) {
    throw new Error(
      `${route}: expected SPA fallback HTML, got ${response.status}`,
    );
  }
  console.log(`${response.status} ${route}`);
}
