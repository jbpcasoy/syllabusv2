"use client";

import type { ProgramRecord } from "@/lib/program-client";
import { createProgramJoinRequest } from "@/lib/program-join-request-client";
import { MAX_JOIN_REQUEST_TEXT } from "@/types/program-join-request";
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

type ProgramJoinRequestModalProps = {
  open: boolean;
  programs: ProgramRecord[];
  onClose: () => void;
  onSaved: () => void;
};

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

export function ProgramJoinRequestModal({
  open,
  programs,
  onClose,
  onSaved,
}: ProgramJoinRequestModalProps) {
  const [programId, setProgramId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!programId) return setError("Select a program.");

    setSaving(true);
    setError(null);
    try {
      await createProgramJoinRequest({ program: programId, note: note.trim() });
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
            Request to join a program
          </DialogTitle>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                Program
              </Label>
              <Select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                disabled={saving}
                className={inputClass}
              >
                <option value="">Select a program…</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code ? `${p.name} (${p.code})` : p.name || p.id}
                  </option>
                ))}
              </Select>
              <Description className="mt-1 text-xs text-gray-500">
                GE programs are listed too. The program chair reviews your
                request.
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
                rows={3}
                maxLength={MAX_JOIN_REQUEST_TEXT}
                placeholder="For example, the courses you teach."
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
