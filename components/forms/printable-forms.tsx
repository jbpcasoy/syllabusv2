"use client";

import type { Form17ExportData, Form181ExportData } from "@/lib/forms/export";
import { getForm17Export, getForm181Export } from "@/lib/syllabus-client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Form17View } from "./form17-view";
import { Form181View } from "./form181-view";

/** Both review forms of a syllabus, ready to print from the browser. */
export function PrintableForms({ syllabusId }: { syllabusId: string }) {
  const [form17, setForm17] = useState<Form17ExportData | null>(null);
  const [form181, setForm181] = useState<Form181ExportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    Promise.all([
      getForm17Export(syllabusId, controller.signal),
      getForm181Export(syllabusId, controller.signal),
    ])
      .then(([a, b]) => {
        setForm17(a);
        setForm181(b);
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
          disabled={!form17 || !form181}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          Print
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-500 print:hidden">
        A reference rendering of the review forms. The official documents are
        produced by the document export.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-center justify-between rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden"
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
      {loading && !error && (
        <p className="mt-4 text-sm text-gray-500 print:hidden">Loading…</p>
      )}

      {form181 && (
        <div className="mt-6 shadow ring-1 ring-black/5 print:shadow-none print:ring-0">
          <Form181View data={form181} />
        </div>
      )}
      {form17 && (
        <div className="mt-6 shadow ring-1 ring-black/5 break-before-page print:shadow-none print:ring-0">
          <Form17View data={form17} />
        </div>
      )}
    </div>
  );
}
