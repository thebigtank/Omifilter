"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import TurnstileWidget from "../../TurnstileWidget";
import "../admin.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  // Each login attempt spends the token; a retry needs a fresh one.
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!turnstileToken) {
        setError("Please complete the verification check.");
        return;
      }

      setSubmitting(true);

      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, turnstileToken }),
        });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.ok) {
          setError(data?.reason || "Incorrect password.");
          setSubmitting(false);
          setTurnstileResetKey((n) => n + 1);
          return;
        }

        router.push("/admin");
        router.refresh();
      } catch {
        setError("Something went wrong. Try again.");
        setSubmitting(false);
        setTurnstileResetKey((n) => n + 1);
      }
    },
    [password, router, turnstileToken],
  );

  return (
    <main className="admin-login-main">
      <div className="admin-login-card">
        <h1>Admin</h1>
        <form onSubmit={submit}>
          <label className="field">
            <span className="field__label">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <TurnstileWidget onToken={setTurnstileToken} resetKey={turnstileResetKey} />

          {error && (
            <p className="checkout-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn--teal" disabled={submitting || !turnstileToken}>
            {submitting ? "Checking…" : "Log in"}
          </button>
        </form>
      </div>
    </main>
  );
}
