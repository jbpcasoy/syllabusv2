"use client";

import { formatDate } from "@/lib/format-date";
import { createUser, updateUser, type UserResponse } from "@/lib/user-client";
import type { UserInput } from "@/types/user";
import {
  Checkbox,
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Field,
  Input,
  Label,
} from "@headlessui/react";
import { useState, type FormEvent } from "react";

export type UserModalMode = "create" | "edit" | "view";

type UserModalProps = {
  open: boolean;
  mode: UserModalMode;
  user: UserResponse | null;
  currentUserId: string;
  onClose: () => void;
  onSaved: () => void;
  onModeChange: (mode: UserModalMode) => void;
};

const TITLES: Record<UserModalMode, string> = {
  create: "New user",
  edit: "Edit user",
  view: "User details",
};

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 71;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

export function UserModal({
  open,
  mode,
  user,
  currentUserId,
  onClose,
  onSaved,
  onModeChange,
}: UserModalProps) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(user?.isAdmin ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === "edit" && user !== null;
  const isSelf = isEdit && user.id === currentUserId;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!EMAIL.test(trimmedEmail)) return setError("Enter a valid email.");
    if (!isEdit && !password) return setError("Password is required.");
    if (
      password &&
      (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD)
    ) {
      return setError(
        `Password must be between ${MIN_PASSWORD} and ${MAX_PASSWORD} characters.`,
      );
    }

    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        const input: Partial<UserInput> = {
          name: name.trim(),
          email: trimmedEmail,
          // The server refuses to remove your own flag; don't even send it.
          ...(!isSelf && { isAdmin }),
          // Only send a password when the admin typed a new one.
          ...(password && { password }),
        };
        await updateUser(user.id, input);
      } else {
        await createUser({
          name: name.trim(),
          email: trimmedEmail,
          password,
          isAdmin,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? () => {} : onClose}
      className="relative z-50"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-900/50 transition-opacity duration-200 data-closed:opacity-0"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl transition duration-200 data-closed:scale-95 data-closed:opacity-0"
        >
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {TITLES[mode]}
          </DialogTitle>

          {mode === "view" && user ? (
            <>
              <dl className="mt-4 space-y-3 text-sm">
                <Detail label="Name" value={user.name || "—"} />
                <Detail label="Email" value={user.email} />
                <Detail
                  label="Administrator"
                  value={user.isAdmin ? "Yes" : "No"}
                />
                <Assignments user={user} />
                <Detail label="Verified" value={user.verified ? "Yes" : "No"} />
                <Detail label="ID" value={user.id} mono />
                <Detail label="Created" value={formatDate(user.created)} />
                <Detail label="Updated" value={formatDate(user.updated)} />
              </dl>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange("edit")}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Edit
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <Field>
                <Label className="block text-sm font-medium text-gray-900">
                  Name
                </Label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  disabled={saving}
                  maxLength={255}
                  placeholder="Juan Dela Cruz"
                  className={inputClass}
                />
              </Field>

              <Field>
                <Label className="block text-sm font-medium text-gray-900">
                  Email
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={saving}
                  placeholder="juan@example.com"
                  className={inputClass}
                />
              </Field>

              <Field>
                <Label className="block text-sm font-medium text-gray-900">
                  {isEdit ? "New password" : "Password"}
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={saving}
                  autoComplete="new-password"
                  className={inputClass}
                />
                <Description className="mt-1 text-xs text-gray-500">
                  {isEdit
                    ? "Leave blank to keep the current password."
                    : `At least ${MIN_PASSWORD} characters.`}
                </Description>
              </Field>

              <Field disabled={saving || isSelf} className="flex gap-3">
                <Checkbox
                  checked={isAdmin}
                  onChange={setIsAdmin}
                  className="group mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-gray-300 bg-white data-checked:border-indigo-600 data-checked:bg-indigo-600 data-disabled:opacity-50 data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-indigo-600"
                >
                  <svg
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden
                    className="size-3 stroke-white opacity-0 group-data-checked:opacity-100"
                  >
                    <path
                      d="M3 8L6 11L11 3.5"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Checkbox>
                <div>
                  <Label className="block text-sm font-medium text-gray-900">
                    Administrator
                  </Label>
                  <Description className="text-xs text-gray-500">
                    {isSelf
                      ? "You can't remove your own administrator access."
                      : "Full access to everything, including users."}
                  </Description>
                </div>
              </Field>

              {isEdit && (
                <dl className="text-sm">
                  <Assignments user={user} />
                </dl>
              )}

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {saving
                    ? "Saving…"
                    : mode === "edit"
                      ? "Save changes"
                      : "Create"}
                </button>
              </div>
            </form>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

/** Read-only: assignments are managed on their own pages (Deans, Faculty, ...). */
function Assignments({ user }: { user: UserResponse }) {
  const assignments = user.assignments ?? [];
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Assignments
      </dt>
      <dd className="mt-0.5 text-gray-900">
        {assignments.length === 0 ? (
          <span className="text-gray-500">None (unassigned)</span>
        ) : (
          <ul className="list-inside list-disc space-y-0.5">
            {assignments.map((a, i) => (
              <li key={i}>
                {a.title}
                {a.scope && <span className="text-gray-500"> · {a.scope}</span>}
              </li>
            ))}
          </ul>
        )}
      </dd>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className={`mt-0.5 text-gray-900 ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
