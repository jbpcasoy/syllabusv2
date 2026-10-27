"use client";

import { formatDate } from "@/lib/format-date";
import {
  listSignedCopies,
  MAX_PDF_BYTES,
  returnSignedCopy,
  signedCopyFileUrl,
  uploadSignedCopy,
  type SignedCopyResponse,
  type SyllabusStatus,
} from "@/lib/syllabus-client";
import { Field, Input, Label, Textarea } from "@headlessui/react";
import { useEffect, useState, type FormEvent } from "react";

type SignedCopyPanelProps = {
  syllabusId: string;
  status: SyllabusStatus;
  isLead: boolean;
  /** The viewer holds signedCopy.return for this syllabus's program. */
  canReturn: boolean;
  /** Called after an upload or return so the page reloads the syllabus. */
  onChanged: () => void;
};

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

/** Scans of the wet-signed syllabus: upload, return as invalid, history. */
export function SignedCopyPanel({
  syllabusId,
  status,
  isLead,
  canReturn,
  onChanged,
}: SignedCopyPanelProps) {
  const [items, setItems] = useState<SignedCopyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [file, setFile] = useState<File | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listSignedCopies(syllabusId, controller.signal)
      .then((result) => {
        setItems(result.items);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      });

    return () => controller.abort();
  }, [syllabusId, reloadKey]);

  async function run(change: () => Promise<unknown>) {
    setBusy(true);
    setActionError(null);
    try {
      await change();
      setFile(null);
      setReason("");
      onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return setActionError("Choose the scanned PDF first.");
    if (file.size > MAX_PDF_BYTES) {
      return setActionError("The PDF must be 20 MB or smaller.");
    }
    run(() => uploadSignedCopy(syllabusId, file));
  }

  const valid = items.find((item) => item.status === "valid");

  function handleReturn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valid) return;
    if (!reason.trim()) return setActionError("Give a reason for returning it.");
    run(() => returnSignedCopy(syllabusId, valid.id, reason));
  }

  return (
    <section className="rounded-lg bg-white p-4 shadow ring-1 ring-black/5">
      <h2 className="text-base font-semibold text-gray-900">Signed copy</h2>
      <p className="mt-1 text-sm text-gray-600">
        {status === "filed"
          ? "The scan of the wet-signed syllabus is on file."
          : "After every approval, print the syllabus, collect the wet signatures beside their approval codes, and upload the scan to file it."}
      </p>

      {error && (
        <div
          role="alert"
          className="mt-3 flex items-center justify-between rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      <ul className={`mt-3 divide-y divide-gray-100 ${loading ? "opacity-50" : ""}`}>
        {items.map((copy) => (
          <li key={copy.id} className="py-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  copy.status === "valid"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {copy.status === "valid" ? "On file" : "Returned"}
              </span>
              <span className="text-gray-600">
                Uploaded by {copy.uploaded_by.name || "—"},{" "}
                {formatDate(copy.created)}
              </span>
              <a
                href={signedCopyFileUrl(syllabusId, copy.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                View PDF
              </a>
            </div>
            {copy.status === "returned" && (
              <p className="mt-1 text-gray-700">
                Returned by {copy.returned_by?.name || "—"}
                {copy.returned_at && `, ${formatDate(copy.returned_at)}`}:{" "}
                {copy.reason}
              </p>
            )}
          </li>
        ))}
        {!loading && items.length === 0 && (
          <li className="py-2 text-sm text-gray-500">No signed copy yet.</li>
        )}
      </ul>

      {isLead && status === "approved" && (
        <form onSubmit={handleUpload} className="mt-3 flex flex-wrap items-end gap-3">
          <Field className="grow">
            <Label className="block text-sm font-medium text-gray-900">
              Scanned signed syllabus (PDF, max 20 MB)
            </Label>
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={busy}
              className={inputClass}
            />
          </Field>
          <button
            type="submit"
            disabled={busy || !file}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {busy ? "Uploading…" : "Upload and file"}
          </button>
        </form>
      )}

      {canReturn && status === "filed" && valid && (
        <form onSubmit={handleReturn} className="mt-3 space-y-2">
          <Field>
            <Label className="block text-sm font-medium text-gray-900">
              Return the scan as invalid
            </Label>
            <Textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={busy}
              placeholder="Why it can't be accepted, e.g. a missing signature"
              className={inputClass}
            />
          </Field>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-700 ring-1 ring-inset ring-red-300 hover:bg-red-50 disabled:opacity-50"
            >
              {busy ? "Returning…" : "Return as invalid"}
            </button>
          </div>
        </form>
      )}

      {actionError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {actionError}
        </p>
      )}
    </section>
  );
}
