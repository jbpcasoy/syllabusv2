"use client";

import type { DepartmentRecord } from "@/lib/department-client";
import { createDepartmentHead } from "@/lib/department-head-client";
import { UserCombobox } from "@/components/user/user-combobox";
import type { UserOption } from "@/lib/user-client";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Field,
  Label,
  Select,
} from "@headlessui/react";
import { useState, type FormEvent } from "react";

type DepartmentHeadModalProps = {
  open: boolean;
  departments: DepartmentRecord[];
  onClose: () => void;
  onSaved: () => void;
};

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

export function DepartmentHeadModal({
  open,
  departments,
  onClose,
  onSaved,
}: DepartmentHeadModalProps) {
  const [user, setUser] = useState<UserOption | null>(null);
  const [departmentId, setDepartmentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return setError("Select a user.");
    if (!departmentId) return setError("Select a department.");

    setSaving(true);
    setError(null);
    try {
      await createDepartmentHead({ user: user.id, department: departmentId });
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
            Assign department head
          </DialogTitle>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                User
              </Label>
              <UserCombobox
                value={user}
                onChange={setUser}
                disabled={saving}
              />
            </Field>

            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                Department
              </Label>
              <Select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={saving}
                className={inputClass}
              >
                <option value="">Select a department…</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name || d.id}
                  </option>
                ))}
              </Select>
            </Field>

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
                {saving ? "Saving…" : "Assign"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
