"use client";

import { submitSyllabus, type SyllabusResponse } from "@/lib/syllabus-client";
import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useState } from "react";

type SubmitSyllabusDialogProps = {
  open: boolean;
  syllabus: SyllabusResponse;
  onClose: () => void;
  onSubmitted: (syllabus: SyllabusResponse) => void;
};

export function SubmitSyllabusDialog({
  open,
  syllabus,
  onClose,
  onSubmitted,
}: SubmitSyllabusDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      onSubmitted(await submitSyllabus(syllabus.id));
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
            Submit for review
          </DialogTitle>
          <Description className="mt-2 text-sm text-gray-600">
            Submit{" "}
            <span className="font-medium text-gray-900">
              {syllabus.expand?.course?.code || "this syllabus"}
            </span>{" "}
            to the program chair? Its latest PDF version is reviewed, and you
            can&apos;t upload new versions or change co-authors afterwards.
          </Description>

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
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? "Submitting…" : "Submit"}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
