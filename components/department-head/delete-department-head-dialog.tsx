"use client";

import {
  deleteDepartmentHead,
  type DepartmentHeadResponse,
} from "@/lib/department-head-client";
import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useState } from "react";

type DeleteDepartmentHeadDialogProps = {
  open: boolean;
  head: DepartmentHeadResponse | null;
  onClose: () => void;
  onDeleted: () => void;
};

export function DeleteDepartmentHeadDialog({
  open,
  head,
  onClose,
  onDeleted,
}: DeleteDepartmentHeadDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!head) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteDepartmentHead(head.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDeleting(false);
    }
  }

  const who =
    head?.expand?.user?.name || head?.expand?.user?.email || "this user";
  const where = head?.expand?.department?.name || "this department";

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
            Remove department head
          </DialogTitle>
          <Description className="mt-2 text-sm text-gray-600">
            Remove <span className="font-medium text-gray-900">{who}</span> as
            head of <span className="font-medium text-gray-900">{where}</span>?
            To keep a record instead, deactivate them.
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
              {deleting ? "Removing…" : "Remove"}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
