"use client";

import {
  CourseCombobox,
  type CourseOption,
} from "@/components/course/course-combobox";
import type { ProspectusResponse } from "@/lib/prospectus-client";
import {
  createProspectusItem,
  updateProspectusItem,
  type ProspectusItemResponse,
} from "@/lib/prospectus-item-client";
import {
  SEMESTERS,
  YEAR_LEVELS,
  type Semester,
  type YearLevel,
} from "@/types/prospectus-item";
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

export type ProspectusItemModalMode = "create" | "edit";

type ProspectusItemModalProps = {
  open: boolean;
  mode: ProspectusItemModalMode;
  item: ProspectusItemResponse | null;
  prospectuses: ProspectusResponse[];
  onClose: () => void;
  onSaved: () => void;
};

const TITLES: Record<ProspectusItemModalMode, string> = {
  create: "New prospectus item",
  edit: "Edit prospectus item",
};

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

function labelOf(p: {
  expand?: {
    program?: { name?: string; code?: string };
    school_year?: { label: string };
  };
}) {
  const program = p.expand?.program;
  const name = program?.name || program?.code;
  const year = p.expand?.school_year?.label ?? "";
  return name ? `${name} — ${year}` : year;
}

export function ProspectusItemModal({
  open,
  mode,
  item,
  prospectuses,
  onClose,
  onSaved,
}: ProspectusItemModalProps) {
  const isEdit = mode === "edit" && item !== null;

  const [prospectusId, setProspectusId] = useState(item?.prospectus ?? "");
  const [yearLevel, setYearLevel] = useState<YearLevel>(
    item?.year_level ?? YEAR_LEVELS[0],
  );
  const [semester, setSemester] = useState<Semester>(
    item?.semester ?? SEMESTERS[0],
  );
  const [course, setCourse] = useState<CourseOption | null>(
    item?.expand?.course ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the item's prospectus isn't in the loaded list, still show it.
  const current = item?.expand?.prospectus;
  const hasCurrentInList =
    !current || prospectuses.some((p) => p.id === current.id);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isEdit && !prospectusId) return setError("Select a prospectus.");
    if (!course) return setError("Select a course.");

    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateProspectusItem(item.id, {
          course: course.id,
          year_level: yearLevel,
          semester,
        });
      } else {
        await createProspectusItem({
          prospectus: prospectusId,
          course: course.id,
          year_level: yearLevel,
          semester,
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
                Prospectus
              </Label>
              <Select
                value={prospectusId}
                onChange={(e) => setProspectusId(e.target.value)}
                disabled={saving || isEdit}
                className={inputClass}
              >
                <option value="">Select a prospectus…</option>
                {!hasCurrentInList && current && (
                  <option value={current.id}>
                    {labelOf({
                      expand: {
                        program: current.program,
                        school_year: current.school_year,
                      },
                    })}
                  </option>
                )}
                {prospectuses.map((p) => (
                  <option key={p.id} value={p.id}>
                    {labelOf(p)}
                  </option>
                ))}
              </Select>
              {isEdit && (
                <Description className="mt-1 text-xs text-gray-500">
                  The prospectus can&apos;t be changed after creation.
                </Description>
              )}
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <Label className="block text-sm font-medium text-gray-900">
                  Year level
                </Label>
                <Select
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value as YearLevel)}
                  disabled={saving}
                  className={inputClass}
                >
                  {YEAR_LEVELS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
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
            </div>

            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                Course
              </Label>
              <CourseCombobox
                value={course}
                onChange={setCourse}
                disabled={saving}
              />
              <Description className="mt-1 text-xs text-gray-500">
                Any program&apos;s course can be listed, including GE courses.
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
