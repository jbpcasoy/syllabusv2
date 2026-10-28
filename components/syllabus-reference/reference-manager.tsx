"use client";

import { formatDate } from "@/lib/format-date";
import { listPrograms, type ProgramRecord } from "@/lib/program-client";
import {
  listReferences,
  REFERENCE_STATUS_LABELS,
  REFERENCE_STATUS_STYLES,
  type ReferenceListParams,
  type SyllabusReferenceResponse,
} from "@/lib/syllabus-reference-client";
import { listTerms, type TermResponse } from "@/lib/term-client";
import { Select } from "@headlessui/react";
import Link from "next/link";
import type { ListResult } from "pocketbase";
import { useEffect, useState } from "react";
import { termLabel } from "../syllabus/syllabus-status";
import { ReferenceModal } from "./reference-modal";
import {
  ReferenceRowActions,
  type ReferenceViewer,
} from "./reference-row-actions";

const PER_PAGE = 10;

type ReferenceManagerProps = {
  viewer: ReferenceViewer;
  /** Chairs (and admin) may start a request. */
  canRequest: boolean;
};

export function ReferenceManager({ viewer, canRequest }: ReferenceManagerProps) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<NonNullable<ReferenceListParams["status"]>>("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] =
    useState<ListResult<SyllabusReferenceResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [terms, setTerms] = useState<TermResponse[]>([]);
  const [modal, setModal] = useState({ open: false, key: 0 });

  // Load programs and terms once for the request form.
  // (The API caps perPage at 100; swap in a searchable combobox if you exceed that.)
  useEffect(() => {
    if (!canRequest) return;
    const controller = new AbortController();
    Promise.all([
      listPrograms({ page: 1, perPage: 100 }, controller.signal),
      listTerms({ page: 1, perPage: 100 }, controller.signal),
    ])
      .then(([programResult, termResult]) => {
        setPrograms(programResult.items);
        setTerms(termResult.items);
      })
      .catch(() => {
        // The form's dropdowns just stay empty; the list surfaces its own errors.
      });
    return () => controller.abort();
  }, [canRequest]);

  // Debounce the search box and go back to page 1 when the filter changes.
  useEffect(() => {
    const timeout = setTimeout(() => {
      const next = searchInput.trim();
      setSearch((prev) => {
        if (prev !== next) setPage(1);
        return next;
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Fetch the current page.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listReferences(
      { page, perPage: PER_PAGE, search, status: statusFilter },
      controller.signal,
    )
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      });

    return () => controller.abort();
  }, [page, search, statusFilter, reloadKey]);

  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = totalItems === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, totalItems);
  const requestablePrograms = programs
    .filter((p) => viewer.isAdmin || viewer.chairOfPrograms.includes(p.id))
    .map((p) => ({ id: p.id, name: p.name, code: p.code }));

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Syllabus references
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Use another program&apos;s syllabus for a course instead of
            writing your own. Requests to your syllabi are listed here too.
          </p>
        </div>
        {canRequest && (
          <button
            type="button"
            onClick={() => setModal((prev) => ({ open: true, key: prev.key + 1 }))}
            className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:mt-0"
          >
            Reference a syllabus
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="sm:w-full sm:max-w-sm">
          <label htmlFor="search" className="sr-only">
            Search references
          </label>
          <input
            id="search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by course or program…"
            className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          />
        </div>
        <div className="sm:w-40">
          <label htmlFor="status-filter" className="sr-only">
            Filter by status
          </label>
          <Select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPage(1);
            }}
            className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          >
            <option value="">All statuses</option>
            {Object.entries(REFERENCE_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-center justify-between rounded-md bg-red-50 px-4 py-3 text-sm text-red-700"
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

      <div className="mt-4 overflow-hidden rounded-lg bg-white shadow ring-1 ring-black/5">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Course
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell"
              >
                Program → Source
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Status
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell"
              >
                Requested
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
            {items.map((row) => {
              const source = row.expand?.syllabus;
              const canOpen =
                viewer.isAdmin ||
                source?.lead === viewer.id ||
                row.status === "approved";
              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900">
                      {canOpen ? (
                        <Link
                          href={`/syllabus/${row.syllabus}`}
                          className="text-indigo-600 hover:text-indigo-500"
                        >
                          {row.expand?.course?.code || "—"}
                        </Link>
                      ) : (
                        row.expand?.course?.code || "—"
                      )}
                    </div>
                    <div className="text-gray-500">
                      {termLabel(row.expand?.term)}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-gray-500 sm:table-cell">
                    <span className="font-medium text-gray-900">
                      {row.expand?.program?.code || "—"}
                    </span>{" "}
                    → {source?.program?.code || "—"}
                    {source?.lead_name && (
                      <div className="text-xs text-gray-500">
                        led by {source.lead_name}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${REFERENCE_STATUS_STYLES[row.status]}`}
                    >
                      {REFERENCE_STATUS_LABELS[row.status]}
                    </span>
                    {row.reason && (
                      <p className="mt-1 max-w-xs text-xs text-gray-500">
                        {row.reason}
                      </p>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-gray-500 md:table-cell">
                    {formatDate(row.created)}
                    {row.expand?.requested_by?.name && (
                      <div className="text-xs text-gray-500">
                        by {row.expand.requested_by.name}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <ReferenceRowActions
                      row={row}
                      viewer={viewer}
                      onChanged={() => setReloadKey((k) => k + 1)}
                      onError={setError}
                    />
                  </td>
                </tr>
              );
            })}

            {!loading && items.length === 0 && !error && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  {search || statusFilter
                    ? "No references match your filters."
                    : "No references yet."}
                </td>
              </tr>
            )}

            {loading && items.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <nav
          aria-label="Pagination"
          className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3"
        >
          <p className="text-sm text-gray-600">
            {totalItems > 0 ? (
              <>
                Showing <span className="font-medium">{from}</span>–
                <span className="font-medium">{to}</span> of{" "}
                <span className="font-medium">{totalItems}</span>
              </>
            ) : (
              "0 results"
            )}
          </p>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-gray-500 sm:inline">
              Page {page} of {Math.max(1, totalPages)}
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
          </div>
        </nav>
      </div>

      {canRequest && (
        <ReferenceModal
          key={`modal-${modal.key}`}
          open={modal.open}
          programs={requestablePrograms}
          terms={terms}
          onClose={() => setModal((prev) => ({ ...prev, open: false }))}
          onSaved={() => {
            setModal((prev) => ({ ...prev, open: false }));
            setReloadKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
