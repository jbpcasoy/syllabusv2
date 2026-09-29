"use client";

import {
  createCampus,
  updateCampus,
  type CampusRecord,
} from "@/lib/campus-client";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useState, type FormEvent } from "react";
import { formatDate } from "./campus-manager";

export type CampusModalMode = "create" | "edit" | "view";

type CampusModalProps = {
  open: boolean;
  mode: CampusModalMode;
  campus: CampusRecord | null;
  onClose: () => void;
  onSaved: () => void;
  onModeChange: (mode: CampusModalMode) => void;
};

const TITLES: Record<CampusModalMode, string> = {
  create: "New campus",
  edit: "Edit campus",
  view: "Campus details",
};

export function CampusModal({
  open,
  mode,
  campus,
  onClose,
  onSaved,
  onModeChange,
}: CampusModalProps) {
  const [name, setName] = useState(campus?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (mode === "edit" && campus) {
        await updateCampus(campus.id, { name: trimmed });
      } else {
        await createCampus({ name: trimmed });
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

          {mode === "view" && campus ? (
            <>
              <dl className="mt-4 space-y-3 text-sm">
                <Detail label="Name" value={campus.name || "—"} />
                <Detail label="ID" value={campus.id} mono />
                <Detail label="Created" value={formatDate(campus.created)} />
                <Detail label="Updated" value={formatDate(campus.updated)} />
              </dl>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange("edit")}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Edit
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4">
              <label
                htmlFor="campus-name"
                className="block text-sm font-medium text-gray-900"
              >
                Name
              </label>
              <input
                id="campus-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                disabled={saving}
                placeholder="Main Campus"
                className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50"
              />

              {error && (
                <p role="alert" className="mt-2 text-sm text-red-600">
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
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {saving
                    ? "Saving…"
                    : mode === "edit"
                      ? "Save changes"
                      : "Create"}
                </button>
              </div>
            </form>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className={`mt-0.5 text-gray-900 ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
