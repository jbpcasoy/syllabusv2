"use client";

import {
  AUDIT_ACTIONS,
  listAudit,
  type AuditAction,
  type AuditListResponse,
} from "@/lib/audit-client";
import { formatDate } from "@/lib/format-date";
import { Select } from "@headlessui/react";
import Link from "next/link";
import { useEffect, useState } from "react";

const PER_PAGE = 10;

const ACTION_LABELS: Record<AuditAction, string> = {
  submitted: "Submitted",
  approved: "Approved",
  returned: "Returned",
  resubmitted: "Resubmitted",
  filed: "Filed",
  scan_returned: "Signed copy returned",
  "lead.transferred": "Lead transferred",
  "file.uploaded": "File uploaded",
};

const inputClass =
  "block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600";

/** Admin's read-only view of audit_log, newest first. */
export function AuditManager() {
  const [action, setAction] = useState<AuditAction | "">("");
  const [override, setOverride] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [syllabus, setSyllabus] = useState<{ id: string; label: string } | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<AuditListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listAudit(
      {
        page,
        perPage: PER_PAGE,
        action,
        override,
        from,
        to,
        syllabus: syllabus?.id,
      },
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
  }, [page, action, override, from, to, syllabus, reloadKey]);

  /** Every filter change starts again at page 1. */
  function filterBy(apply: () => void) {
    apply();
    setPage(1);
  }

  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const first = totalItems === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const last = Math.min(page * PER_PAGE, totalItems);
  const filtered = !!(action || override || from || to || syllabus);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Audit log</h1>
      <p className="mt-1 text-sm text-gray-600">
        Every syllabus status change, lead transfer and PDF upload, newest
        first. Entries can&apos;t be edited or deleted here.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="audit-action" className="block text-sm font-medium text-gray-900">
            Action
          </label>
          <Select
            id="audit-action"
            value={action}
            onChange={(e) => filterBy(() => setAction(e.target.value as AuditAction | ""))}
            className={`mt-1 ${inputClass}`}
          >
            <option value="">All actions</option>
            {AUDIT_ACTIONS.map((value) => (
              <option key={value} value={value}>
                {ACTION_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="audit-override" className="block text-sm font-medium text-gray-900">
            Overrides
          </label>
          <Select
            id="audit-override"
            value={override}
            onChange={(e) => filterBy(() => setOverride(e.target.value))}
            className={`mt-1 ${inputClass}`}
          >
            <option value="">All entries</option>
            <option value="true">Admin overrides only</option>
            <option value="false">Without overrides</option>
          </Select>
        </div>
        <div>
          <label htmlFor="audit-from" className="block text-sm font-medium text-gray-900">
            From
          </label>
          <input
            id="audit-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => filterBy(() => setFrom(e.target.value))}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label htmlFor="audit-to" className="block text-sm font-medium text-gray-900">
            To
          </label>
          <input
            id="audit-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => filterBy(() => setTo(e.target.value))}
            className={`mt-1 ${inputClass}`}
          />
        </div>
      </div>

      {syllabus && (
        <p className="mt-3 flex items-center gap-2 text-sm text-gray-700">
          Showing{" "}
          <span className="font-medium">{syllabus.label || "one syllabus"}</span>{" "}
          only.
          <button
            type="button"
            onClick={() => filterBy(() => setSyllabus(null))}
            className="font-medium text-indigo-600 underline hover:text-indigo-500"
          >
            Show all syllabi
          </button>
        </p>
      )}

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

      <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow ring-1 ring-black/5">
        <table className="min-w-full divide-y divide-gray-200">
          <caption className="sr-only">Audit log entries</caption>
          <thead className="bg-gray-50">
            <tr>
              {[
                ["When", ""],
                ["Action", ""],
                ["Syllabus", "hidden sm:table-cell"],
                ["By", "hidden md:table-cell"],
                ["Details", ""],
              ].map(([label, className]) => (
                <th
                  key={label}
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${className}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-gray-100 transition-opacity ${
              loading ? "opacity-50" : "opacity-100"
            }`}
          >
            {items.map((entry) => (
              <tr key={entry.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {formatDate(entry.created)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {ACTION_LABELS[entry.action] ?? entry.action}
                  {entry.override && (
                    <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                      Override
                    </span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-sm sm:table-cell">
                  {entry.syllabus ? (
                    <div className="flex flex-col items-start gap-0.5">
                      {entry.syllabus_label ? (
                        <Link
                          href={`/syllabus/${entry.syllabus}`}
                          className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          {entry.syllabus_label}
                        </Link>
                      ) : (
                        <span className="text-gray-500">Deleted syllabus</span>
                      )}
                      {syllabus?.id !== entry.syllabus && (
                        <button
                          type="button"
                          onClick={() =>
                            filterBy(() =>
                              setSyllabus({
                                id: entry.syllabus,
                                label: entry.syllabus_label,
                              }),
                            )
                          }
                          className="inline-flex min-h-6 items-center text-xs text-gray-600 underline hover:text-gray-900"
                        >
                          Only this syllabus
                          <span className="sr-only">
                            {" "}
                            ({entry.syllabus_label || "deleted syllabus"})
                          </span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 md:table-cell">
                  {entry.actor_name || "System"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <div>{entry.detail}</div>
                  {entry.reason && (
                    <div className="mt-1 text-gray-500">
                      <span className="font-medium text-gray-700">Reason:</span>{" "}
                      {entry.reason}
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {!loading && items.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                  {filtered ? "No entries match your filters." : "No entries yet."}
                </td>
              </tr>
            )}

            {loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
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
                Showing <span className="font-medium">{first}</span>–
                <span className="font-medium">{last}</span> of{" "}
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
    </div>
  );
}
