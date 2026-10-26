"use client";

import {
  createSchoolYear,
  updateSchoolYear,
  type SchoolYearResponse,
} from "@/lib/school-year-client";
import {
  isValidSchoolYear,
  SCHOOL_YEAR_ERROR,
} from "@/lib/validators/school-year";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Field,
  Input,
  Label,
} from "@headlessui/react";
import { useState, type FormEvent } from "react";

export type SchoolYearModalMode = "create" | "edit";

type SchoolYearModalProps = {
  open: boolean;
  mode: SchoolYearModalMode;
  schoolYear: SchoolYearResponse | null;
  onClose: () => void;
  onSaved: () => void;
};

const TITLES: Record<SchoolYearModalMode, string> = {
  create: "New school year",
  edit: "Edit school year",
};

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

export function SchoolYearModal({
  open,
  mode,
  schoolYear,
  onClose,
  onSaved,
}: SchoolYearModalProps) {
  const isEdit = mode === "edit" && schoolYear !== null;

  const [label, setLabel] = useState(schoolYear?.label ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = label.trim();
    if (!isValidSchoolYear(trimmed)) {
      return setError(SCHOOL_YEAR_ERROR.replace("`label`", "School year"));
    }

    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateSchoolYear(schoolYear.id, { label: trimmed });
      } else {
        await createSchoolYear({ label: trimmed });
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

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                School year
              </Label>
              <Input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                autoFocus
                disabled={saving}
                maxLength={9}
                placeholder="2026-2027"
                className={inputClass}
              />
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
                {saving ? "Saving…" : isEdit ? "Save changes" : "Create"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
