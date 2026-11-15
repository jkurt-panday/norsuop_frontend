const baseUrl = process.env.SPA_URL ?? "http://127.0.0.1:4173";
const routes = [
  "/",
  "/login",
  "/opform",
  "/assessment",
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
