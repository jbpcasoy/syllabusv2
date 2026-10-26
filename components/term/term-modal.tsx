"use client";

import type { SchoolYearResponse } from "@/lib/school-year-client";
import {
  createTerm,
  updateTerm,
  type TermResponse,
} from "@/lib/term-client";
import { isValidDate } from "@/lib/validators/term";
import { SEMESTERS, type Semester } from "@/types/term";
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
  Select,
} from "@headlessui/react";
import { useState, type FormEvent } from "react";

export type TermModalMode = "create" | "edit";

type TermModalProps = {
  open: boolean;
  mode: TermModalMode;
  term: TermResponse | null;
  schoolYears: SchoolYearResponse[];
  onClose: () => void;
  onSaved: () => void;
};

const TITLES: Record<TermModalMode, string> = {
  create: "New term",
  edit: "Edit term",
};

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

export function TermModal({
  open,
  mode,
  term,
  schoolYears,
  onClose,
  onSaved,
}: TermModalProps) {
  const isEdit = mode === "edit" && term !== null;

  const [schoolYearId, setSchoolYearId] = useState(term?.school_year ?? "");
  const [semester, setSemester] = useState<Semester>(
    term?.semester ?? SEMESTERS[0],
  );
  const [isOpen, setIsOpen] = useState(term?.open ?? false);
  const [deadline, setDeadline] = useState(term?.submission_deadline ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the term's school year isn't in the loaded list, still show it.
  const current = term?.expand?.school_year;
  const hasCurrentInList =
    !current || schoolYears.some((y) => y.id === current.id);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isEdit && !schoolYearId) return setError("Select a school year.");
    if (deadline && !isValidDate(deadline)) {
      return setError("Enter a valid submission deadline or leave it empty.");
    }

    setSaving(true);
    setError(null);
    try {
      const fields = {
        semester,
        open: isOpen,
        submission_deadline: deadline || null,
      };
      if (isEdit) {
        await updateTerm(term.id, fields);
      } else {
        await createTerm({ school_year: schoolYearId, ...fields });
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
              <Select
                value={schoolYearId}
                onChange={(e) => setSchoolYearId(e.target.value)}
                disabled={saving || isEdit}
                className={inputClass}
              >
                <option value="">Select a school year…</option>
                {!hasCurrentInList && current && (
                  <option value={current.id}>{current.label}</option>
                )}
                {schoolYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.label}
                  </option>
                ))}
              </Select>
              {isEdit && (
                <Description className="mt-1 text-xs text-gray-500">
                  The school year can&apos;t be changed after creation.
                </Description>
              )}
            </Field>

            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                Semester
              </Label>
              <Select
                value={semester}
                onChange={(e) => setSemester(e.target.value as Semester)}
                disabled={saving}
                className={inputClass}
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>

            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                Submission deadline
              </Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={saving}
                className={inputClass}
              />
              <Description className="mt-1 text-xs text-gray-500">
                Optional.
              </Description>
            </Field>

            <Field className="flex items-center gap-3">
              <Checkbox
                checked={isOpen}
                onChange={setIsOpen}
                disabled={saving}
                className="group flex size-5 items-center justify-center rounded border border-gray-300 bg-white focus:outline-none data-checked:border-indigo-600 data-checked:bg-indigo-600 data-disabled:opacity-50 data-focus:ring-2 data-focus:ring-indigo-600 data-focus:ring-offset-2"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 14 14"
                  fill="none"
                  className="size-3.5 stroke-white opacity-0 group-data-checked:opacity-100"
                >
                  <path
                    d="M3 8L6 11L11 3.5"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Checkbox>
              <Label className="text-sm font-medium text-gray-900">
                Open for submissions
              </Label>
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
