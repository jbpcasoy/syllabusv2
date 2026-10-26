"use client";

import {
  decideProgramJoinRequest,
  type ProgramJoinRequestResponse,
} from "@/lib/program-join-request-client";
import { MAX_JOIN_REQUEST_TEXT } from "@/types/program-join-request";
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

type RejectProgramJoinRequestDialogProps = {
  open: boolean;
  joinRequest: ProgramJoinRequestResponse | null;
  onClose: () => void;
  onRejected: () => void;
};

export function RejectProgramJoinRequestDialog({
  open,
  joinRequest,
  onClose,
  onRejected,
}: RejectProgramJoinRequestDialogProps) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!joinRequest) return;
    const trimmed = reason.trim();
    if (!trimmed) return setError("Give a reason so the requester knows why.");

    setSaving(true);
    setError(null);
    try {
      await decideProgramJoinRequest(joinRequest.id, {
        decision: "reject",
        reason: trimmed,
      });
      onRejected();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  const who =
    joinRequest?.expand?.user?.name ||
    joinRequest?.expand?.user?.email ||
    "this user";
  const where = joinRequest?.expand?.program?.name || "this program";

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
            Reject request
          </DialogTitle>
          <Description className="mt-2 text-sm text-gray-600">
            Reject <span className="font-medium text-gray-900">{who}</span>
            &apos;s request to join{" "}
            <span className="font-medium text-gray-900">{where}</span>?
          </Description>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                Reason
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={saving}
                rows={3}
                maxLength={MAX_JOIN_REQUEST_TEXT}
                className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50"
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
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {saving ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
