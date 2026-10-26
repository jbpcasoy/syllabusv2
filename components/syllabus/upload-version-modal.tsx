"use client";

import {
  MAX_PDF_BYTES,
  uploadSyllabusVersion,
} from "@/lib/syllabus-client";
import { MAX_VERSION_NOTES } from "@/types/syllabus-version";
import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Field,
  Input,
  Label,
  Textarea,
} from "@headlessui/react";
import { useState, type FormEvent } from "react";

type UploadVersionModalProps = {
  open: boolean;
  syllabusId: string;
  onClose: () => void;
  onUploaded: () => void;
};

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

const MAX_MB = MAX_PDF_BYTES / 1024 / 1024;

export function UploadVersionModal({
  open,
  syllabusId,
  onClose,
  onUploaded,
}: UploadVersionModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Quick checks for a friendly message; the server checks the bytes.
    if (!file) return setError("Choose a PDF file.");
    if (file.type !== "application/pdf") {
      return setError("Only PDF files are accepted.");
    }
    if (file.size > MAX_PDF_BYTES) {
      return setError(`The PDF must be ${MAX_MB} MB or smaller.`);
    }

    setSaving(true);
    setError(null);
    try {
      await uploadSyllabusVersion(syllabusId, file, notes.trim());
      onUploaded();
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
            Upload new version
          </DialogTitle>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                PDF file
              </Label>
              <Input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={saving}
                className="mt-1 block w-full text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <Description className="mt-1 text-xs text-gray-500">
                PDF only, up to {MAX_MB} MB.
              </Description>
            </Field>

            <Field>
              <Label className="block text-sm font-medium text-gray-900">
                Notes <span className="font-normal text-gray-500">(optional)</span>
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={saving}
                rows={3}
                maxLength={MAX_VERSION_NOTES}
                placeholder="What changed in this version?"
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
                {saving ? "Uploading…" : "Upload"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
