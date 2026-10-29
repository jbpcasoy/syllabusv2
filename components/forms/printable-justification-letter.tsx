"use client";

import type { JustificationLetterData } from "@/lib/forms/justification";
import { getJustificationLetter } from "@/lib/syllabus-client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { JustificationLetterView } from "./justification-letter-view";

/** The Justification Form letter of a syllabus, ready to print from the browser. */
export function PrintableJustificationLetter({ syllabusId }: { syllabusId: string }) {
  const [letter, setLetter] = useState<JustificationLetterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getJustificationLetter(syllabusId, controller.signal)
      .then((data) => {
        setLetter(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      });

    return () => controller.abort();
  }, [syllabusId, reloadKey]);

  return (
    <div>
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/syllabus/${syllabusId}`}
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          ← Back to the syllabus
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          disabled={!letter}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          Print
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-500 print:hidden">
        Print this letter, have it signed, then upload the scan from the
        syllabus page.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-center justify-between rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              setReloadKey((k) => k + 1);
            }}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}
      {loading && !error && (
        <p className="mt-4 text-sm text-gray-500 print:hidden">Loading…</p>
      )}

      {letter && (
        <div className="mt-6 shadow ring-1 ring-black/5 print:shadow-none print:ring-0">
          <JustificationLetterView data={letter} />
        </div>
      )}
    </div>
  );
}
