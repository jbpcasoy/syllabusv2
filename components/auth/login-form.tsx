"use client";

import { login } from "@/lib/auth-client";
import { Button, Field, Input, Label } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type LoginFormProps = {
  /** Already sanitised on the server with safeRedirect(). */
  redirectTo: string;
};

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return setError("Email is required.");
    if (!password) return setError("Password is required.");

    setSubmitting(true);
    setError(null);
    try {
      await login({ email: trimmedEmail, password });
      router.replace(redirectTo);
      router.refresh(); // re-run server components with the new cookie
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field>
        <Label className="block text-sm font-medium text-gray-900">Email</Label>
        <Input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
          disabled={submitting}
          placeholder="you@example.com"
          className={inputClass}
        />
      </Field>

      <Field>
        <Label className="block text-sm font-medium text-gray-900">
          Password
        </Label>
        <Input
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={submitting}
          className={inputClass}
        />
      </Field>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={submitting}
        className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
