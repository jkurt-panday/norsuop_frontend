import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <main className="bootstrap-card">
      <h1>Page not found</h1>
      <p className="muted">The page you requested does not exist.</p>
      <Link className="primary-link" to="/">
        Return home
      </Link>
    </main>
  );
}
