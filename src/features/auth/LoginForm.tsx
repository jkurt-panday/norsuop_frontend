import { useState } from "react";
import type { SubmitEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ApiError } from "../../api/client";
import { useLogin } from "./mutations";

export function LoginForm() {
  const navigate = useNavigate();
  const mutation = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate({ email, password }, { onSuccess: () => navigate("/") });
  }

  const validation =
    mutation.error instanceof ApiError ? mutation.error.errors : {};
  return (
    <main className="auth-card">
      <h1>Sign in</h1>
      <p className="muted">Use your NORSU Order Payment System account.</p>
      <form onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        {validation.email?.map((message) => (
          <small className="field-error" key={message}>
            {message}
          </small>
        ))}
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {validation.password?.map((message) => (
          <small className="field-error" key={message}>
            {message}
          </small>
        ))}
        {mutation.isError && Object.keys(validation).length === 0 && (
          <p className="field-error">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Sign in failed."}
          </p>
        )}
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <Link to="/">Back</Link>
    </main>
  );
}
