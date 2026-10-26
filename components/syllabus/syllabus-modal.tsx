"use client";

import {
  createSyllabus,
  type AvailableSyllabusRow,
  type SyllabusResponse,
} from "@/lib/syllabus-client";
import type { TermResponse } from "@/lib/term-client";
import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Field,
  Label,
  Select,
} from "@headlessui/react";
import { useState, type FormEvent } from "react";
import { AvailableCourseCombobox } from "./available-course-combobox";

export type ProgramOption = { id: string; name: string; code: string };

type SyllabusModalProps = {
  open: boolean;
  /** Terms open for submissions. */
  terms: TermResponse[];
  /** Programs where the user is active faculty. */
  programs: ProgramOption[];
  onClose: () => void;
  onCreated: (syllabus: SyllabusResponse) => void;
};

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

export function SyllabusModal({
  open,
  terms,
  programs,
  onClose,
  onCreated,
}: SyllabusModalProps) {
  // Preselect when there is only one choice.
  const [termId, setTermId] = useState(terms.length === 1 ? terms[0].id : "");
  const [programId, setProgramId] = useState(
    programs.length === 1 ? programs[0].id : "",
  );
  const [row, setRow] = useState<AvailableSyllabusRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!termId) return setError("Select a term.");
    if (!programId) return setError("Select a program.");
    if (!row) return setError("Select a course.");

    setSaving(true);
    setError(null);
    try {
      const created = await createSyllabus({
        course: row.course.id,
        term: termId,
        program: programId,
      });
      onCreated(created);
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
          className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl transition duration-200 data-closed:scale-95 data-closed:opacity-0"
        >
          <DialogTitle className="text-lg font-semibold text-gray-900">
            New syllabus
          </DialogTitle>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                Term
              </Label>
              <Select
                value={termId}
                onChange={(e) => {
                  setTermId(e.target.value);
                  setRow(null);
                }}
                disabled={saving}
                className={inputClass}
              >
                <option value="">Select a term…</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {[t.expand?.school_year?.label, t.semester]
                      .filter(Boolean)
                      .join(" · ")}
                  </option>
                ))}
              </Select>
              <Description className="mt-1 text-xs text-gray-500">
                Only terms open for submissions are listed.
              </Description>
            </Field>

            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                Program
              </Label>
              <Select
                value={programId}
                onChange={(e) => {
                  setProgramId(e.target.value);
                  setRow(null);
                }}
                disabled={saving}
                className={inputClass}
              >
                <option value="">Select a program…</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code ? `${p.name} (${p.code})` : p.name}
                  </option>
                ))}
              </Select>
              <Description className="mt-1 text-xs text-gray-500">
                The program this syllabus is written for. Its chain reviews
                it.
              </Description>
            </Field>

            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                Course
              </Label>
              <AvailableCourseCombobox
                term={termId}
                program={programId}
                value={row}
                onChange={setRow}
                disabled={saving}
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
                {saving ? "Creating…" : "Create draft"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
