# NORSU Order Payment SPA

This workspace is the incremental standalone React/Vite frontend for the Laravel API.

## Environment

- `VITE_API_URL`: Laravel API origin, without a trailing slash.
- `VITE_API_TIMEOUT_MS`: optional request timeout in milliseconds; defaults to `15000`.

The production build must be deployed with SPA fallback enabled so direct URLs such as `/graduate-ledger` and `/staff/requests/123` serve `index.html`. For Hostinger/Apache, keep the generated `public/.htaccess` file beside the deployed `index.html`.

Generate API types from the backend contract with:

```bash
pnpm run generate:api
```

## Validation

```bash
pnpm test
pnpm build
pnpm lint
pnpm preview --host 127.0.0.1
pnpm smoke
```

`pnpm smoke` checks that production-style deep links return the SPA shell. Browser E2E tests use Playwright and mock only public option endpoints; authenticated tests require a running Laravel API with test credentials.

Install the local Chromium browser once, then run the public-form E2E suite:

```bash
pnpm e2e:install
pnpm e2e
```

Set `PLAYWRIGHT_BASE_URL` to test a deployed or separately running SPA. The default is `http://127.0.0.1:5173`.
