"use client";

import { register } from "@/lib/auth-client";
import { MAX_NAME, MAX_PASSWORD, MIN_PASSWORD } from "@/lib/validators/user";
import { Button, Description, Field, Input, Label } from "@headlessui/react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

type RegisterFormProps = {
  /** Sign-in link (with the sanitised `next`), shown once the account exists. */
  loginHref: string;
  /** Email domains registration accepts, for the hint and a client-side check. */
  allowedDomains: string[];
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

export function RegisterForm({ loginHref, allowedDomains }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const domainHint = allowedDomains.map((d) => `@${d}`).join(", ");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) return setError("Name is required.");
    if (!EMAIL.test(trimmedEmail)) return setError("Enter a valid email.");
    const domain = trimmedEmail.split("@").pop()?.toLowerCase() ?? "";
    if (!allowedDomains.includes(domain)) {
      return setError(`Use your institutional email (${domainHint}).`);
    }
    if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
      return setError(
        `Password must be between ${MIN_PASSWORD} and ${MAX_PASSWORD} characters.`,
      );
    }
    if (password !== passwordConfirm)
      return setError("Passwords do not match.");

    setSubmitting(true);
    setError(null);
    try {
      const result = await register({
        name: trimmedName,
        email: trimmedEmail,
        password,
        passwordConfirm,
      });
      setSentTo(result.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  if (sentTo) {
    return (
      <div role="status" className="space-y-4 text-sm text-gray-700">
        <p>
          We sent a verification link to{" "}
          <span className="font-medium text-gray-900">{sentTo}</span>. Open it,
          then sign in.
        </p>
        <p className="text-gray-500">No email? Signing in sends a new link.</p>
        <Link
          href={loginHref}
          className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field>
        <Label className="block text-sm font-medium text-gray-900">Name</Label>
        <Input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          autoFocus
          disabled={submitting}
          maxLength={MAX_NAME}
          placeholder="Juan Dela Cruz"
          className={inputClass}
        />
      </Field>

      <Field>
        <Label className="block text-sm font-medium text-gray-900">Email</Label>
        <Input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={submitting}
          placeholder={`you@${allowedDomains[0]}`}
          className={inputClass}
        />
        <Description className="mt-1 text-xs text-gray-500">
          Use your institutional email ({domainHint}).
        </Description>
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
          autoComplete="new-password"
          disabled={submitting}
          className={inputClass}
        />
        <Description className="mt-1 text-xs text-gray-500">
          At least {MIN_PASSWORD} characters.
        </Description>
      </Field>

      <Field>
        <Label className="block text-sm font-medium text-gray-900">
          Confirm password
        </Label>
        <Input
          type="password"
          name="passwordConfirm"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          autoComplete="new-password"
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
        {submitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
