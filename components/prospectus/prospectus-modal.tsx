"use client";

import type { ProgramRecord } from "@/lib/program-client";
import {
  createProspectus,
  updateProspectus,
  type ProspectusResponse,
} from "@/lib/prospectus-client";
import {
  isValidSchoolYear,
  SCHOOL_YEAR_ERROR,
} from "@/lib/validators/prospectus";
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

export type ProspectusModalMode = "create" | "edit";

type ProspectusModalProps = {
  open: boolean;
  mode: ProspectusModalMode;
  prospectus: ProspectusResponse | null;
  programs: ProgramRecord[];
  onClose: () => void;
  onSaved: () => void;
};

const TITLES: Record<ProspectusModalMode, string> = {
  create: "New prospectus",
  edit: "Edit prospectus",
};

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

export function ProspectusModal({
  open,
  mode,
  prospectus,
  programs,
  onClose,
  onSaved,
}: ProspectusModalProps) {
  const isEdit = mode === "edit" && prospectus !== null;

  const [programId, setProgramId] = useState(prospectus?.program ?? "");
  const [schoolYear, setSchoolYear] = useState(prospectus?.school_year ?? "");
  const [published, setPublished] = useState(prospectus?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the prospectus's program isn't in the loaded list, still show it.
  const currentProgram = prospectus?.expand?.program;
  const hasCurrentInList =
    !currentProgram || programs.some((p) => p.id === currentProgram.id);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedYear = schoolYear.trim();

    if (!isEdit && !programId) return setError("Select a program.");
    if (!isValidSchoolYear(trimmedYear)) {
      return setError(
        SCHOOL_YEAR_ERROR.replace("`school_year`", "School year"),
      );
    }

    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateProspectus(prospectus.id, {
          school_year: trimmedYear,
          published,
        });
      } else {
        await createProspectus({
          program: programId,
          school_year: trimmedYear,
          published,
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

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                Program
              </Label>
              <Select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                disabled={saving || isEdit}
                className={inputClass}
              >
                <option value="">Select a program…</option>
                {!hasCurrentInList && currentProgram && (
                  <option value={currentProgram.id}>
                    {currentProgram.name || currentProgram.id}
                  </option>
                )}
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code ? `${p.name} (${p.code})` : p.name || p.id}
                  </option>
                ))}
              </Select>
              {isEdit && (
                <Description className="mt-1 text-xs text-gray-500">
                  The program can&apos;t be changed after creation.
                </Description>
              )}
            </Field>

            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                School year
              </Label>
              <Input
                type="text"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                autoFocus
                disabled={saving}
                maxLength={9}
                placeholder="2026-2027"
                className={inputClass}
              />
            </Field>

            <Field className="flex items-center gap-3">
              <Checkbox
                checked={published}
                onChange={setPublished}
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
                Published
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
