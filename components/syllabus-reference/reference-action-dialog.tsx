"use client";

import {
  actOnReference,
  MAX_REFERENCE_TEXT,
  type SyllabusReferenceResponse,
} from "@/lib/syllabus-reference-client";
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
import { useState, type FormEvent } from "react";

/** Actions that need confirming; approve runs inline. */
export type DialogAction = "reject" | "revoke" | "withdraw";

type ReferenceActionDialogProps = {
  open: boolean;
  action: DialogAction;
  reference: SyllabusReferenceResponse | null;
  onClose: () => void;
  onDone: () => void;
};

const COPY: Record<
  DialogAction,
  { title: string; confirm: string; busy: string; body: string }
> = {
  reject: {
    title: "Reject reference",
    confirm: "Reject",
    busy: "Rejecting…",
    body: "The program will not be able to use your syllabus for this course and term.",
  },
  revoke: {
    title: "Revoke reference",
    confirm: "Revoke",
    busy: "Revoking…",
    body: "The program loses access to your syllabus and will need its own or another reference.",
  },
  withdraw: {
    title: "Withdraw reference request",
    confirm: "Withdraw",
    busy: "Withdrawing…",
    body: "Your request is cancelled. You can then write your own or reference another.",
  },
};

/** Withdrawing an approved reference ends it rather than cancelling a request. */
const STOP_REFERENCING_COPY = {
  title: "Stop referencing",
  confirm: "Stop referencing",
  busy: "Stopping…",
  body: "Your program will stop using this syllabus. You can then write your own or reference another.",
};

export function ReferenceActionDialog({
  open,
  action,
  reference,
  onClose,
  onDone,
}: ReferenceActionDialogProps) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsReason = action !== "withdraw";
  const copy =
    action === "withdraw" && reference?.status === "approved"
      ? STOP_REFERENCING_COPY
      : COPY[action];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!reference) return;
    const trimmed = reason.trim();
    if (needsReason && !trimmed) return setError("Give a reason.");

    setSaving(true);
    setError(null);
    try {
      await actOnReference(
        reference.id,
        action === "withdraw"
          ? { action }
          : { action, reason: trimmed },
      );
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  const course = reference?.expand?.course?.code || "this course";
  const program = reference?.expand?.program?.code || "the program";

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
            {copy.title}
          </DialogTitle>
          <Description className="mt-2 text-sm text-gray-600">
            <span className="font-medium text-gray-900">{program}</span> ·{" "}
            <span className="font-medium text-gray-900">{course}</span>.{" "}
            {copy.body}
          </Description>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {needsReason && (
              <Field>
                <Label className="block text-sm font-medium text-gray-900">
                  Reason
                </Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={saving}
                  rows={3}
                  maxLength={MAX_REFERENCE_TEXT}
                  className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50"
                />
              </Field>
            )}

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
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {saving ? copy.busy : copy.confirm}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
