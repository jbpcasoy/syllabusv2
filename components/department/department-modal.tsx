"use client";

import type { CollegeRecord } from "@/lib/college-client";
import {
  createDepartment,
  updateDepartment,
  type DepartmentRecord,
} from "@/lib/department-client";
import { formatDate } from "@/lib/format-date";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Field,
  Input,
  Label,
  Select,
} from "@headlessui/react";
import { useState, type FormEvent } from "react";

export type DepartmentModalMode = "create" | "edit" | "view";

type DepartmentModalProps = {
  open: boolean;
  mode: DepartmentModalMode;
  department: DepartmentRecord | null;
  colleges: CollegeRecord[];
  onClose: () => void;
  onSaved: () => void;
  onModeChange: (mode: DepartmentModalMode) => void;
};

const TITLES: Record<DepartmentModalMode, string> = {
  create: "New department",
  edit: "Edit department",
  view: "Department details",
};

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

export function DepartmentModal({
  open,
  mode,
  department,
  colleges,
  onClose,
  onSaved,
  onModeChange,
}: DepartmentModalProps) {
  const [name, setName] = useState(department?.name ?? "");
  const [collegeId, setCollegeId] = useState(department?.college ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the department's college isn't in the loaded list, still show it.
  const currentCollege = department?.expand?.college;
  const hasCurrentInList =
    !currentCollege || colleges.some((c) => c.id === currentCollege.id);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return setError("Name is required.");

    setSaving(true);
    setError(null);
    try {
      const input = {
        name: trimmedName,
        college: collegeId, // "" clears the relation
      };
      if (mode === "edit" && department) {
        await updateDepartment(department.id, input);
      } else {
        await createDepartment(input);
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

          {mode === "view" && department ? (
            <>
              <dl className="mt-4 space-y-3 text-sm">
                <Detail label="Name" value={department.name || "—"} />
                <Detail
                  label="College"
                  value={department.expand?.college?.name || "—"}
                />
                <Detail label="ID" value={department.id} mono />
                <Detail
                  label="Created"
                  value={formatDate(department.created)}
                />
                <Detail
                  label="Updated"
                  value={formatDate(department.updated)}
                />
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
                  placeholder="Computer Science"
                  className={inputClass}
                />
              </Field>

              <Field>
                <Label className="block text-sm font-medium text-gray-900">
                  College
                </Label>
                <Select
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                  disabled={saving}
                  className={inputClass}
                >
                  <option value="">No college</option>
                  {!hasCurrentInList && currentCollege && (
                    <option value={currentCollege.id}>
                      {currentCollege.name || currentCollege.id}
                    </option>
                  )}
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.id}
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
