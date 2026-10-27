"use client";

import { resubmitSyllabus, type SyllabusResponse } from "@/lib/syllabus-client";
import { CHAIN_ROLES } from "@/lib/syllabus-workflow";
import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useState } from "react";

type ResubmitSyllabusDialogProps = {
  open: boolean;
  syllabus: SyllabusResponse;
  onClose: () => void;
  onResubmitted: (syllabus: SyllabusResponse) => void;
};

export function ResubmitSyllabusDialog({
  open,
  syllabus,
  onClose,
  onResubmitted,
}: ResubmitSyllabusDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResubmit() {
    setSaving(true);
    setError(null);
    try {
      onResubmitted(await resubmitSyllabus(syllabus.id));
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
            Resubmit
          </DialogTitle>
          <Description className="mt-2 text-sm text-gray-600">
            Send{" "}
            <span className="font-medium text-gray-900">
              {syllabus.expand?.course?.code || "this syllabus"}
            </span>{" "}
            back to the {CHAIN_ROLES[syllabus.stage - 1]?.label ?? "reviewer"}{" "}
            (stage {syllabus.stage})? Its latest PDF version is reviewed.
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
              onClick={handleResubmit}
              disabled={saving}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? "Resubmitting…" : "Resubmit"}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
