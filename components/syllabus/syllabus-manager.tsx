"use client";

import { formatDate } from "@/lib/format-date";
import {
  listSyllabi,
  type SyllabusListParams,
  type SyllabusResponse,
} from "@/lib/syllabus-client";
import { SYLLABUS_STATUSES } from "@/lib/syllabus-workflow";
import { listTerms, type TermResponse } from "@/lib/term-client";
import { Select } from "@headlessui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ListResult } from "pocketbase";
import { useEffect, useState } from "react";
import { SubmissionOverdueBadge } from "./overdue-badge";
import { SyllabusModal, type ProgramOption } from "./syllabus-modal";
import {
  ACCESS_LABELS,
  STATUS_LABELS,
  SyllabusStatusBadge,
  termLabel,
} from "./syllabus-status";

const PER_PAGE = 10;

type SyllabusManagerProps = {
  /** Programs where the user is active faculty; empty means they can't start one. */
  programs: ProgramOption[];
};

export function SyllabusManager({ programs }: SyllabusManagerProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [termFilter, setTermFilter] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<NonNullable<SyllabusListParams["status"]>>("");
  const [scope, setScope] =
    useState<NonNullable<SyllabusListParams["scope"]>>("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<ListResult<SyllabusResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [terms, setTerms] = useState<TermResponse[]>([]);
  const [modal, setModal] = useState({ open: false, key: 0 });

  // Load terms once for the filter and the new-syllabus form.
  // (The API caps perPage at 100; swap in a searchable combobox if you exceed that.)
  useEffect(() => {
    const controller = new AbortController();
    listTerms({ page: 1, perPage: 100 }, controller.signal)
      .then((result) => setTerms(result.items))
      .catch(() => {
        // The dropdowns just stay empty; the main list surfaces its own errors.
      });
    return () => controller.abort();
  }, []);

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

    listSyllabi(
      {
        page,
        perPage: PER_PAGE,
        search,
        term: termFilter,
        status: statusFilter,
        scope,
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
  }, [page, search, termFilter, statusFilter, scope, reloadKey]);

  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = totalItems === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, totalItems);
  const openTerms = terms.filter((t) => t.open);
  const canStart = programs.length > 0 && openTerms.length > 0;

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My syllabi</h1>
          <p className="mt-1 text-sm text-gray-600">
            Syllabi you lead or co-author. Start a draft, upload PDF versions,
            then submit it for review.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal((prev) => ({ open: true, key: prev.key + 1 }))}
          disabled={!canStart}
          className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0"
        >
          New syllabus
        </button>
      </div>

      {programs.length === 0 && (
        <p className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You need an active faculty assignment to start a syllabus.{" "}
          <Link href="/program-join-request" className="font-medium underline">
            Request to join a program
          </Link>
          .
        </p>
      )}
      {programs.length > 0 && terms.length > 0 && openTerms.length === 0 && (
        <p className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No term is open for submissions right now.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="sm:w-48">
          <label htmlFor="scope-filter" className="sr-only">
            Show
          </label>
          <Select
            id="scope-filter"
            value={scope}
            onChange={(e) => {
              setScope(e.target.value as typeof scope);
              setPage(1);
            }}
            className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          >
            <option value="">My syllabi</option>
            <option value="review">Waiting on me</option>
          </Select>
        </div>
        <div className="sm:w-full sm:max-w-sm">
          <label htmlFor="search" className="sr-only">
            Search syllabi
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
        <div className="sm:w-64">
          <label htmlFor="term-filter" className="sr-only">
            Filter by term
          </label>
          <Select
            id="term-filter"
            value={termFilter}
            onChange={(e) => {
              setTermFilter(e.target.value);
              setPage(1);
            }}
            className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          >
            <option value="">All terms</option>
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {termLabel({
                  semester: t.semester,
                  school_year_label: t.expand?.school_year?.label ?? "",
                })}
              </option>
            ))}
          </Select>
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
            {SYLLABUS_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
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
                Program
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell"
              >
                Term
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
                Your role
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 lg:table-cell"
              >
                Updated
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-gray-100 transition-opacity ${
              loading ? "opacity-50" : "opacity-100"
            }`}
          >
            {items.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  <Link
                    href={`/syllabus/${row.id}`}
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    {row.expand?.course?.code || "—"}
                  </Link>
                  <div className="text-gray-500">
                    {row.expand?.course?.title}
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 sm:table-cell">
                  {row.expand?.program?.code || row.expand?.program?.name || "—"}
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 md:table-cell">
                  {termLabel(row.expand?.term)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <SyllabusStatusBadge status={row.status} />
                  <div className="mt-1 empty:hidden">
                    <SubmissionOverdueBadge
                      term={row.expand?.term}
                      slot={{ syllabusStatus: row.status, hasReference: false }}
                    />
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 md:table-cell">
                  {row.access ? ACCESS_LABELS[row.access] : "—"}
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 lg:table-cell">
                  {formatDate(row.updated)}
                </td>
              </tr>
            ))}

            {!loading && items.length === 0 && !error && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  {scope === "review" && !search && !termFilter && !statusFilter
                    ? "Nothing is waiting on your review."
                    : search || termFilter || statusFilter
                      ? "No syllabi match your filters."
                      : "No syllabi yet."}
                </td>
              </tr>
            )}

            {loading && items.length === 0 && (
              <tr>
                <td
                  colSpan={6}
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

      <SyllabusModal
        key={`modal-${modal.key}`}
        open={modal.open}
        terms={openTerms}
        programs={programs}
        onClose={() => setModal((prev) => ({ ...prev, open: false }))}
        onCreated={(created) => {
          setModal((prev) => ({ ...prev, open: false }));
          router.push(`/syllabus/${created.id}`);
        }}
      />
    </div>
  );
}
