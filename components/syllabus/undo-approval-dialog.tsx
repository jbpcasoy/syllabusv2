"use client";

import { undoApproval, type SyllabusResponse } from "@/lib/syllabus-client";
import { CHAIN_ROLES, undoableStage } from "@/lib/syllabus-workflow";
import {
  UNDO_REASON_MAX,
  UNDO_REASON_MIN,
} from "@/lib/validators/undo-approval";
import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Field,
  Label,
  Textarea,
} from "@headlessui/react";
import { useState } from "react";

type UndoApprovalDialogProps = {
  open: boolean;
  syllabus: SyllabusResponse;
  onClose: () => void;
  onUndone: () => void;
};

/** An admin takes back the latest approval, one stage at a time. */
export function UndoApprovalDialog({
  open,
  syllabus,
  onClose,
  onUndone,
}: UndoApprovalDialogProps) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const length = reason.trim().length;
  const reasonTooShort = length < UNDO_REASON_MIN;

  const stage = undoableStage(syllabus) ?? 0;
  const role = CHAIN_ROLES[stage - 1]?.label ?? `Stage ${stage}`;
  const course = syllabus.expand?.course?.code || "this syllabus";

  async function handleUndo() {
    if (reasonTooShort) {
      return setError(`Give a reason of at least ${UNDO_REASON_MIN} characters.`);
    }
    setSaving(true);
    setError(null);
    try {
      await undoApproval(syllabus.id, { reason: reason.trim() });
      onUndone();
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
            Undo {role} approval
          </DialogTitle>
          <Description className="mt-2 text-sm text-gray-600">
            {course} goes back to waiting on the {role} (stage {stage}), who
            can then approve or return it again. The original approval stays
            on the timeline, followed by this undo. The lead and the {role}{" "}
            are notified.
          </Description>

          <Field className="mt-4">
            <Label className="block text-sm font-medium text-gray-900">
              Reason (required)
            </Label>
            <Description className="mt-1 text-sm text-gray-600">
              This is an admin override. The reason is shown on the timeline,
              sent with the notification and kept in the audit log. At least{" "}
              {UNDO_REASON_MIN} characters ({length}/{UNDO_REASON_MIN}).
            </Description>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={saving}
              required
              rows={3}
              maxLength={UNDO_REASON_MAX}
              className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50"
            />
          </Field>

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
              onClick={handleUndo}
              disabled={saving || reasonTooShort}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              {saving ? "Undoing…" : "Undo approval"}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
