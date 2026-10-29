"use client";

import { JustificationLetterView } from "@/components/forms/justification-letter-view";
import { formatDate } from "@/lib/format-date";
import type { JustificationLetterData } from "@/lib/forms/justification";
import {
  getJustification,
  getJustificationLetter,
  justificationScanUrl,
  MAX_PDF_BYTES,
  returnJustification,
  saveJustification,
  uploadJustificationScan,
} from "@/lib/syllabus-client";
import type { JustificationResponse } from "@/types/justification";
import { Checkbox, Field, Input, Label, Textarea } from "@headlessui/react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

const STATUS_LABELS = {
  draft: "Draft",
  submitted: "Submitted",
  returned: "Returned for revision",
} as const;

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";
const button =
  "rounded-md px-3 py-2 text-sm font-semibold disabled:opacity-50";

/**
 * Justification Form: acknowledges authors of last school year's syllabus
 * who can't sign. Informational only. Hidden from referencing programs
 * (the API answers 404) and when no previous syllabus exists.
 */
export function JustificationPanel({ syllabusId }: { syllabusId: string }) {
  const [data, setData] = useState<JustificationResponse | null>(null);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [file, setFile] = useState<File | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [letter, setLetter] = useState<JustificationLetterData | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function adopt(result: JustificationResponse) {
    setData(result);
    const entries = result.justification?.entries ?? [];
    setChecked(Object.fromEntries(entries.map((e) => [e.author.id, true])));
    setReasons(Object.fromEntries(entries.map((e) => [e.author.id, e.reason])));
  }

  useEffect(() => {
    const controller = new AbortController();
    setError(null);

    getJustification(syllabusId, controller.signal)
      .then(adopt)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof Error && err.message === "Not found") {
          setHidden(true);
          return;
        }
        setError(err instanceof Error ? err.message : "Something went wrong");
      });

    return () => controller.abort();
  }, [syllabusId, reloadKey]);

  async function run(change: () => Promise<JustificationResponse>) {
    setBusy(true);
    setActionError(null);
    try {
      adopt(await change());
      setFile(null);
      setReturnReason("");
      setLetter(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const entries = (data?.eligible_authors ?? [])
      .filter((author) => checked[author.id])
      .map((author) => ({ author: author.id, reason: (reasons[author.id] ?? "").trim() }));
    const missing = entries.find((entry) => !entry.reason);
    if (missing) return setActionError("Give a reason for every author you tick.");
    await run(() => saveJustification(syllabusId, entries));
  }

  async function handlePreview() {
    setBusy(true);
    setActionError(null);
    try {
      setLetter(await getJustificationLetter(syllabusId));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (hidden || (data && !data.applies)) return null;

  const record = data?.justification ?? null;
  const editing = !!data?.can_edit;
  const hasEntries = (record?.entries.length ?? 0) > 0;

  return (
    <section className="rounded-lg bg-white p-4 shadow ring-1 ring-black/5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900">Justification Form</h2>
        {record && (
          <span className="text-xs text-gray-500">{STATUS_LABELS[record.status]}</span>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-600">
        Last school year&apos;s syllabus for this course is acknowledged here.
        If any of its authors can&apos;t sign, name them and say why. This never
        holds up the syllabus.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-3 flex items-center justify-between rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          <span>{error}</span>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="font-medium underline">
            Retry
          </button>
        </div>
      )}

      {record?.status === "returned" && (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Returned by {record.returned_by?.name || "—"}
          {record.returned_at && `, ${formatDate(record.returned_at)}`}:{" "}
          {record.return_reason}
        </p>
      )}

      {data && editing ? (
        <form onSubmit={handleSave} className="mt-3 space-y-3">
          {data.eligible_authors.length === 0 && (
            <p className="text-sm text-gray-500">
              Every author of last year&apos;s syllabus is also an author of this one,
              so nobody needs a justification.
            </p>
          )}
          {data.eligible_authors.map((author) => (
            <div key={author.id} className="text-sm">
              <Field className="flex items-center gap-2">
                <Checkbox
                  checked={!!checked[author.id]}
                  onChange={(value) =>
                    setChecked((prev) => ({ ...prev, [author.id]: value }))
                  }
                  disabled={busy}
                  className="group size-4 rounded border border-gray-300 bg-white data-checked:border-indigo-600 data-checked:bg-indigo-600"
                >
                  <svg className="hidden size-3.5 text-white group-data-checked:block" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M3 8l3 3 5-6" stroke="currentColor" strokeWidth={2} />
                  </svg>
                </Checkbox>
                <Label className="font-medium text-gray-900">
                  {author.name || "Unnamed"} can&apos;t sign
                </Label>
              </Field>
              {checked[author.id] && (
                <Field className="mt-1 pl-6">
                  <Label className="sr-only">Reason for {author.name}</Label>
                  <Textarea
                    rows={2}
                    value={reasons[author.id] ?? ""}
                    onChange={(e) =>
                      setReasons((prev) => ({ ...prev, [author.id]: e.target.value }))
                    }
                    disabled={busy}
                    placeholder="Why they can't sign, e.g. on official leave"
                    className={inputClass}
                  />
                </Field>
              )}
            </div>
          ))}
          {data.eligible_authors.length > 0 && (
            <div className="flex justify-end">
              <button type="submit" disabled={busy} className={`${button} bg-indigo-600 text-white hover:bg-indigo-500`}>
                {busy ? "Saving…" : "Save justification"}
              </button>
            </div>
          )}
        </form>
      ) : (
        record && (
          <ul className="mt-3 divide-y divide-gray-100 text-sm">
            {record.entries.map((entry) => (
              <li key={entry.author.id} className="py-2">
                <span className="font-medium text-gray-900">{entry.author.name || "—"}</span>
                <span className="text-gray-600">: {entry.reason}</span>
              </li>
            ))}
          </ul>
        )
      )}

      {record?.has_scan && (
        <p className="mt-3 text-sm">
          <a
            href={justificationScanUrl(syllabusId)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            View the signed letter
          </a>
          {record.submitted_at && (
            <span className="text-gray-500"> (submitted {formatDate(record.submitted_at)})</span>
          )}
        </p>
      )}

      {editing && hasEntries && (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={handlePreview}
            disabled={busy}
            className={`${button} bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50`}
          >
            Preview the letter
          </button>
          <Link
            href={`/syllabus/${syllabusId}/forms/justification`}
            className={`${button} ml-3 inline-block bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50`}
          >
            Print the letter
          </Link>
          {letter && (
            <div className="ring-1 ring-black/5">
              <JustificationLetterView data={letter} />
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!file) return setActionError("Choose the scanned signed letter.");
              if (file.size > MAX_PDF_BYTES) return setActionError("The PDF must be 20 MB or smaller.");
              run(() => uploadJustificationScan(syllabusId, file));
            }}
            className="flex flex-wrap items-end gap-3"
          >
            <Field className="grow">
              <Label className="block text-sm font-medium text-gray-900">
                Signed letter (PDF, max 20 MB)
              </Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={busy}
                className={inputClass}
              />
            </Field>
            <button type="submit" disabled={busy || !file} className={`${button} bg-indigo-600 text-white hover:bg-indigo-500`}>
              {busy ? "Uploading…" : "Upload and submit"}
            </button>
          </form>
        </div>
      )}

      {data?.can_return && record?.status === "submitted" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!returnReason.trim()) return setActionError("Give a reason for returning it.");
            run(() => returnJustification(syllabusId, returnReason));
          }}
          className="mt-4 space-y-2 border-t border-gray-100 pt-4"
        >
          <Field>
            <Label className="block text-sm font-medium text-gray-900">
              Return for revision
            </Label>
            <Textarea
              rows={2}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              disabled={busy}
              className={inputClass}
            />
          </Field>
          <div className="flex justify-end">
            <button type="submit" disabled={busy} className={`${button} bg-white text-red-700 ring-1 ring-inset ring-red-300 hover:bg-red-50`}>
              {busy ? "Returning…" : "Return for revision"}
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
