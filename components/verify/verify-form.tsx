"use client";

import { Button, Field, Input, Label } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type VerifyFormProps = {
  /** Pre-fills the field, for example with the code just checked. */
  initialCode?: string;
};

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 font-mono text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

// Sends the typed code to /verify/<code>, which does the lookup.
export function VerifyForm({ initialCode = "" }: VerifyFormProps) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return setError("Enter an approval code.");
    setError(null);
    router.push(`/verify/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <Field>
        <Label className="block text-sm font-medium text-gray-900">
          Approval code
        </Label>
        <div className="flex gap-2">
          <Input
            type="text"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder="SYL-2627-1-0042-S2"
            className={inputClass}
          />
          <Button
            type="submit"
            className="mt-1 shrink-0 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Verify
          </Button>
        </div>
      </Field>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
