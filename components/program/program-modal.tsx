"use client";

import type { DepartmentRecord } from "@/lib/department-client";
import { formatDate } from "@/lib/format-date";
import {
  createProgram,
  updateProgram,
  type ProgramRecord,
} from "@/lib/program-client";
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

export type ProgramModalMode = "create" | "edit" | "view";

type ProgramModalProps = {
  open: boolean;
  mode: ProgramModalMode;
  program: ProgramRecord | null;
  departments: DepartmentRecord[];
  onClose: () => void;
  onSaved: () => void;
  onModeChange: (mode: ProgramModalMode) => void;
};

const TITLES: Record<ProgramModalMode, string> = {
  create: "New program",
  edit: "Edit program",
  view: "Program details",
};

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

export function ProgramModal({
  open,
  mode,
  program,
  departments,
  onClose,
  onSaved,
  onModeChange,
}: ProgramModalProps) {
  const [name, setName] = useState(program?.name ?? "");
  const [code, setCode] = useState(program?.code ?? "");
  const [departmentId, setDepartmentId] = useState(program?.department ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the program's department isn't in the loaded list, still show it.
  const currentDepartment = program?.expand?.department;
  const hasCurrentInList =
    !currentDepartment ||
    departments.some((d) => d.id === currentDepartment.id);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedCode = code.trim();
    if (!trimmedName) return setError("Name is required.");
    if (!trimmedCode) return setError("Code is required.");
    if (!departmentId) return setError("Select a department.");

    setSaving(true);
    setError(null);
    try {
      const input = {
        name: trimmedName,
        code: trimmedCode,
        department: departmentId,
      };
      if (mode === "edit" && program) {
        await updateProgram(program.id, input);
      } else {
        await createProgram(input);
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

          {mode === "view" && program ? (
            <>
              <dl className="mt-4 space-y-3 text-sm">
                <Detail label="Name" value={program.name || "—"} />
                <Detail label="Code" value={program.code || "—"} />
                <Detail
                  label="Department"
                  value={program.expand?.department?.name || "—"}
                />
                <Detail label="ID" value={program.id} mono />
                <Detail label="Created" value={formatDate(program.created)} />
                <Detail label="Updated" value={formatDate(program.updated)} />
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
                  placeholder="BS Computer Science"
                  className={inputClass}
                />
              </Field>

              <Field>
                <Label className="block text-sm font-medium text-gray-900">
                  Code
                </Label>
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={saving}
                  placeholder="BSCS"
                  className={inputClass}
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
                  {!hasCurrentInList && currentDepartment && (
                    <option value={currentDepartment.id}>
                      {currentDepartment.name || currentDepartment.id}
                    </option>
                  )}
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
