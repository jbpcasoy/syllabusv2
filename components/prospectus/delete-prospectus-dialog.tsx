"use client";

import {
  deleteProspectus,
  type ProspectusResponse,
} from "@/lib/prospectus-client";
import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useState } from "react";

type DeleteProspectusDialogProps = {
  open: boolean;
  prospectus: ProspectusResponse | null;
  onClose: () => void;
  onDeleted: () => void;
};

export function DeleteProspectusDialog({
  open,
  prospectus,
  onClose,
  onDeleted,
}: DeleteProspectusDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!prospectus) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteProspectus(prospectus.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDeleting(false);
    }
  }

  const program = prospectus?.expand?.program?.name || "this program";
  const year = prospectus?.expand?.school_year?.label || "";

  return (
    <Dialog
      open={open}
      onClose={deleting ? () => {} : onClose}
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
            Delete prospectus
          </DialogTitle>
          <Description className="mt-2 text-sm text-gray-600">
            Are you sure you want to delete the{" "}
            <span className="font-medium text-gray-900">{year}</span> prospectus
            of <span className="font-medium text-gray-900">{program}</span>?
            This can&apos;t be undone. To hide it instead, unpublish it.
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
              disabled={deleting}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
