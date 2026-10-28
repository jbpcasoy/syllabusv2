"use client";

import { formatDate } from "@/lib/format-date";
import {
  listSyllabusVersions,
  syllabusVersionFileUrl,
  type SyllabusVersionResponse,
} from "@/lib/syllabus-client";
import type { ListResult } from "pocketbase";
import { useEffect, useState } from "react";

const PER_PAGE = 10;

type SyllabusVersionsProps = {
  syllabusId: string;
  /** Bump to refetch, e.g. after an upload. */
  reloadKey: number;
  onCountChange?: (count: number) => void;
  /** Decisions per version number, e.g. ["S1 returned", "S2 approved"]. */
  decisions?: ReadonlyMap<number, string[]>;
};

export function SyllabusVersions({
  syllabusId,
  reloadKey,
  onCountChange,
  decisions,
}: SyllabusVersionsProps) {
  const [page, setPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);
  const [data, setData] =
    useState<ListResult<SyllabusVersionResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listSyllabusVersions(
      syllabusId,
      { page, perPage: PER_PAGE },
      controller.signal,
    )
      .then((result) => {
        setData(result);
        setLoading(false);
        onCountChange?.(result.totalItems);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      });

    return () => controller.abort();
  }, [syllabusId, page, reloadKey, retryKey, onCountChange]);

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div>
      {error && (
        <div
          role="alert"
          className="mb-3 flex items-center justify-between rounded-md bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow ring-1 ring-black/5">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Version
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell"
              >
                Notes
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell"
              >
                Uploaded
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-gray-100 transition-opacity ${
              loading ? "opacity-50" : "opacity-100"
            }`}
          >
            {items.map((version) => (
              <tr key={version.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  v{version.version_no}
                  {page === 1 && version.id === items[0]?.id && (
                    <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      Latest
                    </span>
                  )}
                  {(decisions?.get(version.version_no) ?? []).length > 0 && (
                    <div className="mt-1 text-xs font-normal text-gray-500">
                      {decisions?.get(version.version_no)?.join(" · ")}
                    </div>
                  )}
                </td>
                <td className="hidden max-w-xs px-4 py-3 text-sm text-gray-500 sm:table-cell">
                  <p className="line-clamp-2 whitespace-pre-line">
                    {version.notes || "—"}
                  </p>
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 md:table-cell">
                  {formatDate(version.created)}
                  {version.expand?.uploaded_by?.name && (
                    <div className="text-xs text-gray-400">
                      by {version.expand.uploaded_by.name}
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  <a
                    href={syllabusVersionFileUrl(syllabusId, version.id)}
                    target="_blank"
                    rel="noopener"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    View PDF
                    <span className="sr-only">
                      {" "}
                      of version {version.version_no} (opens in a new tab)
                    </span>
                  </a>
                </td>
              </tr>
            ))}

            {!loading && items.length === 0 && !error && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  No versions yet. Upload a PDF to get started.
                </td>
              </tr>
            )}

            {loading && items.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <nav
            aria-label="Version pages"
            className="flex items-center justify-end gap-2 border-t border-gray-200 bg-white px-4 py-3"
          >
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
