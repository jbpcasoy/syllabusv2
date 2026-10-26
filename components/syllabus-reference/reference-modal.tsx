"use client";

import {
  createReference,
  MAX_REFERENCE_TEXT,
  type ReferenceSourceRow,
} from "@/lib/syllabus-reference-client";
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
  Textarea,
} from "@headlessui/react";
import { useState, type FormEvent } from "react";
import type { ProgramOption } from "../syllabus/syllabus-modal";
import { ReferenceSourceCombobox } from "./reference-source-combobox";

type ReferenceModalProps = {
  open: boolean;
  /** Programs the viewer may request for (their chair programs, or all for admin). */
  programs: ProgramOption[];
  terms: TermResponse[];
  onClose: () => void;
  onSaved: () => void;
};

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

export function ReferenceModal({
  open,
  programs,
  terms,
  onClose,
  onSaved,
}: ReferenceModalProps) {
  const [programId, setProgramId] = useState(
    programs.length === 1 ? programs[0].id : "",
  );
  const [termId, setTermId] = useState("");
  const [source, setSource] = useState<ReferenceSourceRow | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!programId) return setError("Select your program.");
    if (!termId) return setError("Select a term.");
    if (!source) return setError("Select a syllabus to reference.");

    setSaving(true);
    setError(null);
    try {
      await createReference({
        syllabus: source.id,
        program: programId,
        note: note.trim(),
      });
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
          className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl transition duration-200 data-closed:scale-95 data-closed:opacity-0"
        >
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Reference a syllabus
          </DialogTitle>
          <Description className="mt-1 text-sm text-gray-600">
            Use another program&apos;s syllabus for one of your courses
            instead of writing your own. Its lead approves the request.
          </Description>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                Your program
              </Label>
              <Select
                value={programId}
                onChange={(e) => {
                  setProgramId(e.target.value);
                  setSource(null);
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
            </Field>

            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                Term
              </Label>
              <Select
                value={termId}
                onChange={(e) => {
                  setTermId(e.target.value);
                  setSource(null);
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
            </Field>

            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                Syllabus
              </Label>
              <ReferenceSourceCombobox
                program={programId}
                term={termId}
                value={source}
                onChange={setSource}
                disabled={saving}
              />
              <Description className="mt-1 text-xs text-gray-500">
                Only courses in your program&apos;s published prospectus for
                the term are listed.
              </Description>
            </Field>

            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                Note <span className="font-normal text-gray-500">(optional)</span>
              </Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={saving}
                rows={2}
                maxLength={MAX_REFERENCE_TEXT}
                placeholder="For example, why it fits your program."
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
                {saving ? "Sending…" : "Send request"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
