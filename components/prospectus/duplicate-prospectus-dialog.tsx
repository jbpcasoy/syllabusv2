"use client";

import {
  duplicateProspectus,
  previewProspectusDuplicate,
  type ProspectusDuplicateResponse,
  type ProspectusResponse,
} from "@/lib/prospectus-client";
import type { SchoolYearResponse } from "@/lib/school-year-client";
import type { ProspectusDuplicateItem } from "@/types/prospectus-duplicate";
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
import { useEffect, useState } from "react";

type DuplicateProspectusDialogProps = {
  open: boolean;
  /** The prospectus to copy (its program and school year are the source). */
  source: ProspectusResponse | null;
  schoolYears: SchoolYearResponse[];
  onClose: () => void;
  onDuplicated: () => void;
};

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

export function DuplicateProspectusDialog({
  open,
  source,
  schoolYears,
  onClose,
  onDuplicated,
}: DuplicateProspectusDialogProps) {
  const [targetId, setTargetId] = useState("");
  const [preview, setPreview] = useState<ProspectusDuplicateResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the preview whenever the target changes.
  useEffect(() => {
    if (!source || !targetId) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setPreview(null);

    previewProspectusDuplicate(
      {
        program: source.program,
        source_school_year: source.school_year,
        target_school_year: targetId,
      },
      controller.signal,
    )
      .then((result) => {
        setPreview(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      });

    return () => controller.abort();
  }, [source, targetId]);

  async function handleConfirm() {
    if (!source || !targetId) return;
    setSaving(true);
    setError(null);
    try {
      await duplicateProspectus({
        program: source.program,
        source_school_year: source.school_year,
        target_school_year: targetId,
      });
      onDuplicated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  const programName =
    source?.expand?.program?.name || source?.expand?.program?.code || "";
  const sourceYear = source?.expand?.school_year?.label ?? "";
  const targets = schoolYears.filter((y) => y.id !== source?.school_year);
  const nothingToCopy = !!preview?.target && preview.copy.length === 0;
  const canConfirm =
    !!preview && !loading && !saving && !nothingToCopy && targetId !== "";

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
          className="flex max-h-full w-full max-w-lg flex-col rounded-lg bg-white p-6 shadow-xl transition duration-200 data-closed:scale-95 data-closed:opacity-0"
        >
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Duplicate prospectus
          </DialogTitle>
          <Description className="mt-2 text-sm text-gray-600">
            Copy the{" "}
            <span className="font-medium text-gray-900">{sourceYear}</span>{" "}
            prospectus of{" "}
            <span className="font-medium text-gray-900">{programName}</span>{" "}
            into another school year. Courses already in the target are
            skipped.
          </Description>

          <Field className="mt-4">
            <Label className="block text-sm font-medium text-gray-900">
              Target school year
            </Label>
            <Select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={saving}
              className={inputClass}
            >
              <option value="">Select a school year…</option>
              {targets.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
            {loading && (
              <p className="text-sm text-gray-500">Loading preview…</p>
            )}

            {preview && (
              <div
                className={`space-y-4 text-sm transition-opacity ${
                  saving ? "opacity-50" : ""
                }`}
              >
                <p className="text-gray-700">
                  {preview.target
                    ? `Adds to the existing ${preview.target.published ? "published" : "unpublished"} ${preview.target_school_year.label} prospectus.`
                    : `Creates a new unpublished ${preview.target_school_year.label} prospectus.`}
                </p>
                <ItemList
                  title={`Will copy (${preview.copy.length})`}
                  items={preview.copy}
                  empty={
                    nothingToCopy
                      ? "Nothing to copy: the target already lists every course."
                      : "The source prospectus has no items."
                  }
                />
                {preview.skip.length > 0 && (
                  <ItemList
                    title={`Skipped, already present (${preview.skip.length})`}
                    items={preview.skip}
                    muted
                  />
                )}
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving
                ? "Copying…"
                : preview
                  ? `Copy ${preview.copy.length} item${preview.copy.length === 1 ? "" : "s"}`
                  : "Copy"}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function ItemList({
  title,
  items,
  empty,
  muted,
}: {
  title: string;
  items: ProspectusDuplicateItem[];
  empty?: string;
  muted?: boolean;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-1 text-gray-500">{empty}</p>
      ) : (
        <ul
          className={`mt-1 divide-y divide-gray-100 rounded-md ring-1 ring-gray-200 ${
            muted ? "text-gray-500" : "text-gray-900"
          }`}
        >
          {items.map((item) => (
            <li
              key={item.course.id}
              className="flex justify-between gap-3 px-3 py-1.5"
            >
              <span>
                <span className="font-medium">{item.course.code}</span>{" "}
                {item.course.title}
              </span>
              <span className="shrink-0 text-xs text-gray-500">
                {item.year_level}, {item.semester}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
