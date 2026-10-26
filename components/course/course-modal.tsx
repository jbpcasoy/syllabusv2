"use client";

import {
  createCourse,
  updateCourse,
  type CourseResponse,
} from "@/lib/course-client";
import type { ProgramRecord } from "@/lib/program-client";
import {
  MAX_CODE,
  MAX_HOURS,
  MAX_NOTE,
  MAX_PREREQUISITES,
  MAX_TITLE,
  MAX_UNITS,
} from "@/lib/validators/course";
import {
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
import { CourseCombobox, type CourseOption } from "./course-combobox";

export type CourseModalMode = "create" | "edit";

type CourseModalProps = {
  open: boolean;
  mode: CourseModalMode;
  course: CourseResponse | null;
  programs: ProgramRecord[];
  onClose: () => void;
  onSaved: () => void;
};

const TITLES: Record<CourseModalMode, string> = {
  create: "New course",
  edit: "Edit course",
};

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

const NUMBER_FIELDS = [
  { key: "credit_units", label: "Credit units", max: MAX_UNITS },
  { key: "lec_units", label: "Lecture units", max: MAX_UNITS },
  { key: "lab_units", label: "Lab units", max: MAX_UNITS },
  { key: "nominal_duration_hours", label: "Nominal hours", max: MAX_HOURS },
] as const;

type NumberKey = (typeof NUMBER_FIELDS)[number]["key"];

export function CourseModal({
  open,
  mode,
  course,
  programs,
  onClose,
  onSaved,
}: CourseModalProps) {
  const isEdit = mode === "edit" && course !== null;

  const [code, setCode] = useState(course?.code ?? "");
  const [title, setTitle] = useState(course?.title ?? "");
  const [programId, setProgramId] = useState(course?.program ?? "");
  const [numbers, setNumbers] = useState<Record<NumberKey, string>>({
    credit_units: String(course?.credit_units ?? 0),
    lec_units: String(course?.lec_units ?? 0),
    lab_units: String(course?.lab_units ?? 0),
    nominal_duration_hours: String(course?.nominal_duration_hours ?? 0),
  });
  const [prerequisites, setPrerequisites] = useState<CourseOption[]>(
    course?.expand?.prerequisites ?? [],
  );
  const [note, setNote] = useState(course?.prerequisite_note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the course's program isn't in the loaded list, still show it.
  const currentProgram = course?.expand?.program;
  const hasCurrentInList =
    !currentProgram || programs.some((p) => p.id === currentProgram.id);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedCode = code.trim();
    const trimmedTitle = title.trim();

    if (!trimmedCode || trimmedCode.length > MAX_CODE) {
      return setError(
        `Code is required and must be at most ${MAX_CODE} characters.`,
      );
    }
    if (!trimmedTitle || trimmedTitle.length > MAX_TITLE) {
      return setError(
        `Title is required and must be at most ${MAX_TITLE} characters.`,
      );
    }
    if (!programId) return setError("Select the owning program.");

    const parsed = {} as Record<NumberKey, number>;
    for (const { key, label, max } of NUMBER_FIELDS) {
      const value = Number(numbers[key]);
      if (numbers[key].trim() === "" || !(value >= 0 && value <= max)) {
        return setError(`${label} must be a number from 0 to ${max}.`);
      }
      parsed[key] = value;
    }

    setSaving(true);
    setError(null);
    try {
      const input = {
        code: trimmedCode,
        title: trimmedTitle,
        program: programId,
        ...parsed,
        prerequisites: prerequisites.map((c) => c.id),
        prerequisite_note: note.trim(),
      };
      if (isEdit) {
        await updateCourse(course.id, input);
      } else {
        await createCourse(input);
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
          className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl transition duration-200 data-closed:scale-95 data-closed:opacity-0"
        >
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {TITLES[mode]}
          </DialogTitle>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field>
                <Label className="block text-sm font-medium text-gray-900">
                  Code
                </Label>
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoFocus
                  disabled={saving}
                  maxLength={MAX_CODE}
                  placeholder="CS 101"
                  className={inputClass}
                />
              </Field>
              <Field className="sm:col-span-2">
                <Label className="block text-sm font-medium text-gray-900">
                  Title
                </Label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={saving}
                  maxLength={MAX_TITLE}
                  placeholder="Introduction to Computing"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                Owning program
              </Label>
              <Select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                disabled={saving}
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
              <Description className="mt-1 text-xs text-gray-500">
                GE courses belong to the GE program.
              </Description>
            </Field>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {NUMBER_FIELDS.map(({ key, label, max }) => (
                <Field key={key}>
                  <Label className="block text-sm font-medium text-gray-900">
                    {label}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={max}
                    step="any"
                    value={numbers[key]}
                    onChange={(e) =>
                      setNumbers((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    disabled={saving}
                    className={inputClass}
                  />
                </Field>
              ))}
            </div>

            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                Prerequisites
              </Label>
              {prerequisites.length > 0 && (
                <ul className="mt-1 flex flex-wrap gap-2">
                  {prerequisites.map((c) => (
                    <li
                      key={c.id}
                      className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-0.5 pl-2.5 pr-1 text-xs font-medium text-indigo-700"
                    >
                      {c.code}
                      <button
                        type="button"
                        onClick={() =>
                          setPrerequisites((prev) =>
                            prev.filter((p) => p.id !== c.id),
                          )
                        }
                        disabled={saving}
                        aria-label={`Remove ${c.code}`}
                        className="rounded-full px-1 hover:bg-indigo-100 disabled:opacity-50"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {prerequisites.length < MAX_PREREQUISITES && (
                <CourseCombobox
                  value={null}
                  onChange={(picked) => {
                    if (picked) setPrerequisites((prev) => [...prev, picked]);
                  }}
                  disabled={saving}
                  excludeIds={[
                    ...(course ? [course.id] : []),
                    ...prerequisites.map((c) => c.id),
                  ]}
                  placeholder="Add a prerequisite…"
                />
              )}
            </Field>

            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                Prerequisite note
              </Label>
              <Input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={saving}
                maxLength={MAX_NOTE}
                placeholder="Third year standing"
                className={inputClass}
              />
              <Description className="mt-1 text-xs text-gray-500">
                Optional. For prerequisites that aren&apos;t a course.
              </Description>
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
