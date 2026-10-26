"use client";

import { formatDate } from "@/lib/format-date";
import {
  listReferences,
  REFERENCE_STATUS_LABELS,
  REFERENCE_STATUS_STYLES,
  type SyllabusReferenceResponse,
} from "@/lib/syllabus-reference-client";
import { useEffect, useState } from "react";
import {
  ReferenceRowActions,
  type ReferenceViewer,
} from "../syllabus-reference/reference-row-actions";

type SyllabusReferencesPanelProps = {
  syllabusId: string;
  viewer: ReferenceViewer;
};

/** Programs referencing this syllabus, with the lead's (or admin's) actions. */
export function SyllabusReferencesPanel({
  syllabusId,
  viewer,
}: SyllabusReferencesPanelProps) {
  const [items, setItems] = useState<SyllabusReferenceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    // A syllabus is referenced by at most one live request per program.
    listReferences(
      { page: 1, perPage: 100, syllabus: syllabusId },
      controller.signal,
    )
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

  return (
    <section className="rounded-lg bg-white p-4 shadow ring-1 ring-black/5">
      <h2 className="text-base font-semibold text-gray-900">References</h2>
      <p className="mt-1 text-sm text-gray-600">
        Programs that asked to use this syllabus instead of writing their own.
        Approved programs&apos; faculty can view it and its PDFs.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-3 flex items-center justify-between rounded-md bg-red-50 px-4 py-3 text-sm text-red-700"
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

      <ul
        className={`mt-3 divide-y divide-gray-100 transition-opacity ${
          loading ? "opacity-50" : "opacity-100"
        }`}
      >
        {items.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-start justify-between gap-2 py-2 text-sm"
          >
            <div>
              <span className="font-medium text-gray-900">
                {row.expand?.program?.name || "—"}
              </span>{" "}
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${REFERENCE_STATUS_STYLES[row.status]}`}
              >
                {REFERENCE_STATUS_LABELS[row.status]}
              </span>
              <div className="text-xs text-gray-500">
                Requested {formatDate(row.created)}
                {row.expand?.requested_by?.name &&
                  ` by ${row.expand.requested_by.name}`}
              </div>
              {row.note && (
                <p className="mt-1 text-xs text-gray-600">“{row.note}”</p>
              )}
              {row.reason && (
                <p className="mt-1 text-xs text-gray-500">Reason: {row.reason}</p>
              )}
            </div>
            <ReferenceRowActions
              row={row}
              viewer={viewer}
              onChanged={() => setReloadKey((k) => k + 1)}
              onError={setError}
            />
          </li>
        ))}
        {!loading && items.length === 0 && !error && (
          <li className="py-2 text-sm text-gray-500">No references.</li>
        )}
      </ul>
    </section>
  );
}
