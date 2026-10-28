"use client";

import { formatDate } from "@/lib/format-date";
import {
  listReviewQueue,
  type QueueStatus,
  type ReviewQueueResponse,
} from "@/lib/review-queue-client";
import { CHAIN_ROLES } from "@/lib/syllabus-workflow";
import { listTerms, type TermResponse } from "@/lib/term-client";
import { Select, Tab, TabGroup, TabList } from "@headlessui/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ReviewOverdueBadge } from "../syllabus/overdue-badge";
import { SyllabusStatusBadge, termLabel } from "../syllabus/syllabus-status";
import {
  ProgramFilterCombobox,
  type ProgramOption,
} from "./program-filter-combobox";

const PER_PAGE = 10;

const STATUS_OPTIONS: { value: QueueStatus; label: string; since: string }[] = [
  { value: "waiting", label: "Waiting", since: "Waiting" },
  { value: "returned", label: "Returned (with faculty)", since: "Returned" },
  { value: "passed", label: "Passed this stage", since: "Last change" },
];

const stageLabel = (stage: number) => CHAIN_ROLES[stage - 1]?.label ?? `Stage ${stage}`;

/** "today", "1 day", "12 days" since a PocketBase datetime. */
function age(value: string): string {
  if (!value) return "—";
  const then = new Date(value.replace(" ", "T")).getTime();
  if (Number.isNaN(then)) return "—";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  return days === 1 ? "1 day" : `${days} days`;
}

export function ReviewQueueManager() {
  // undefined: let the server pick the first stage the caller holds.
  const [stage, setStage] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<QueueStatus>("waiting");
  const [program, setProgram] = useState<ProgramOption | null>(null);
  const [termFilter, setTermFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<ReviewQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terms, setTerms] = useState<TermResponse[]>([]);

  // Load terms once for the filter.
  // (The API caps perPage at 100; swap in a searchable combobox if you exceed that.)
  useEffect(() => {
    const controller = new AbortController();
    listTerms({ page: 1, perPage: 100 }, controller.signal)
      .then((result) => setTerms(result.items))
      .catch(() => {
        // The dropdown just stays empty; the queue surfaces its own errors.
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

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listReviewQueue(
      {
        page,
        perPage: PER_PAGE,
        stage,
        status,
        program: program?.id,
        term: termFilter,
        search,
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
  }, [page, stage, status, program, termFilter, search, reloadKey]);

  const stages = data?.stages ?? [];
  const currentStage = data?.stage ?? stage ?? 0;
  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = totalItems === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, totalItems);
  const since = STATUS_OPTIONS.find((o) => o.value === status)?.since ?? "";
  const filtered = !!(program || termFilter || search);

  if (data && stages.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Review queue</h1>
        <p className="mt-4 rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-700">
          You don&apos;t review syllabi at any stage. If you were named a
          stand-in for one, it appears under{" "}
          <Link href="/syllabus" className="font-medium text-indigo-600 underline">
            My syllabi → Waiting on me
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Review queue</h1>
      <p className="mt-1 text-sm text-gray-600">
        Syllabi in your scope at each stage you review. Oldest waiting first.
      </p>

      {stages.length > 0 && (
        <TabGroup
          selectedIndex={Math.max(0, stages.indexOf(currentStage))}
          onChange={(index) => {
            setStage(stages[index]);
            setPage(1);
          }}
          className="mt-6"
        >
          <TabList className="flex flex-wrap gap-1 border-b border-gray-200">
            {stages.map((s) => (
              <Tab
                key={s}
                className="-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none data-focus:ring-2 data-focus:ring-indigo-600 data-selected:border-indigo-600 data-selected:text-indigo-700"
              >
                {s}. {stageLabel(s)}
              </Tab>
            ))}
          </TabList>
        </TabGroup>
      )}

      <div className="mt-4 flex flex-col gap-3 lg:flex-row">
        <div className="lg:w-56">
          <label htmlFor="queue-status" className="sr-only">
            Status
          </label>
          <Select
            id="queue-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as QueueStatus);
              setPage(1);
            }}
            className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="lg:w-72">
          <ProgramFilterCombobox
            value={program}
            onChange={(next) => {
              setProgram(next);
              setPage(1);
            }}
          />
        </div>
        <div className="lg:w-64">
          <label htmlFor="queue-term" className="sr-only">
            Filter by term
          </label>
          <Select
            id="queue-term"
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
        <div className="lg:flex-1">
          <label htmlFor="queue-search" className="sr-only">
            Search
          </label>
          <input
            id="queue-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by course or program code…"
            className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          />
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
              {[
                ["Course", ""],
                ["Program", "hidden sm:table-cell"],
                ["Term", "hidden md:table-cell"],
                ["Lead", "hidden lg:table-cell"],
                ["Status", ""],
                [since, "hidden sm:table-cell"],
                ["", ""],
              ].map(([label, className], i) => (
                <th
                  key={i}
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${className}`}
                >
                  {label || <span className="sr-only">Action</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-gray-100 transition-opacity ${
              loading ? "opacity-50" : "opacity-100"
            }`}
          >
            {items.map(({ syllabus: row, version_no, actionable, covered_by }) => (
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
                    {version_no > 0 && ` · v${version_no}`}
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 sm:table-cell">
                  {row.expand?.program?.code || "—"}
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 md:table-cell">
                  {termLabel(row.expand?.term)}
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 lg:table-cell">
                  {row.expand?.lead?.name || "—"}
                </td>
                <td className="px-4 py-3 text-sm">
                  <SyllabusStatusBadge status={row.status} />
                  {status === "waiting" && (
                    <div className="mt-1">
                      <ReviewOverdueBadge syllabus={row} term={row.expand?.term} />
                    </div>
                  )}
                  {status === "passed" && row.status !== "approved" && row.status !== "filed" && (
                    <div className="mt-1 text-xs text-gray-500">
                      at {stageLabel(row.stage)}
                    </div>
                  )}
                </td>
                <td
                  className="hidden px-4 py-3 text-sm text-gray-500 sm:table-cell"
                  title={formatDate(row.status_changed_at)}
                >
                  {age(row.status_changed_at)}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  {actionable ? (
                    <Link
                      href={`/syllabus/${row.id}/review`}
                      className="rounded-md bg-indigo-600 px-2.5 py-1.5 font-semibold text-white hover:bg-indigo-500"
                    >
                      Review
                    </Link>
                  ) : covered_by !== null ? (
                    <span className="text-xs text-gray-500">
                      Covered by {covered_by || "a stand-in"}
                    </span>
                  ) : (
                    <Link
                      href={`/syllabus/${row.id}`}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View
                    </Link>
                  )}
                </td>
              </tr>
            ))}

            {!loading && items.length === 0 && !error && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                  {filtered
                    ? "No syllabi match your filters."
                    : status === "waiting"
                      ? `Nothing is waiting at ${stageLabel(currentStage)}.`
                      : "No syllabi here."}
                </td>
              </tr>
            )}

            {loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
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
    </div>
  );
}
