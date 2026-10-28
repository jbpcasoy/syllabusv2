"use client";

import {
  listSchoolYears,
  type SchoolYearResponse,
} from "@/lib/school-year-client";
import {
  listTerms,
  updateTerm,
  type TermListParams,
  type TermResponse,
} from "@/lib/term-client";
import { Select } from "@headlessui/react";
import type { ListResult } from "pocketbase";
import { useEffect, useState } from "react";
import { DeleteTermDialog } from "./delete-term-dialog";
import { TermModal, type TermModalMode } from "./term-modal";

const PER_PAGE = 10;

type TermManagerProps = {
  canManage: boolean;
  /** Bump to reload the school year dropdowns (e.g. after a school year changes). */
  schoolYearsKey?: number;
};

type ModalState = {
  open: boolean;
  mode: TermModalMode;
  term: TermResponse | null;
  key: number; // bumps on each open so the form state resets
};

const selectClass =
  "block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600";

const thClass =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500";

export function TermManager({ canManage, schoolYearsKey = 0 }: TermManagerProps) {
  const [schoolYearFilter, setSchoolYearFilter] = useState("");
  const [openFilter, setOpenFilter] =
    useState<NonNullable<TermListParams["open"]>>("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<ListResult<TermResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [schoolYears, setSchoolYears] = useState<SchoolYearResponse[]>([]);

  const [modal, setModal] = useState<ModalState>({
    open: false,
    mode: "create",
    term: null,
    key: 0,
  });
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    term: TermResponse | null;
    key: number;
  }>({ open: false, term: null, key: 0 });

  // School years for the filter and the form dropdown. There is one per
  // year, so the API's 100-row cap is decades away.
  useEffect(() => {
    const controller = new AbortController();
    listSchoolYears({ page: 1, perPage: 100 }, controller.signal)
      .then((result) => setSchoolYears(result.items))
      .catch(() => {
        // The dropdown just stays empty; the main list surfaces its own errors.
      });
    return () => controller.abort();
  }, [schoolYearsKey]);

  // Fetch the current page. A school year change can rename rows, so refetch.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listTerms(
      {
        page,
        perPage: PER_PAGE,
        schoolYear: schoolYearFilter,
        open: openFilter,
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
  }, [page, schoolYearFilter, openFilter, reloadKey, schoolYearsKey]);

  function openModal(mode: TermModalMode, term: TermResponse | null = null) {
    setModal((prev) => ({ open: true, mode, term, key: prev.key + 1 }));
  }

  async function toggleOpen(row: TermResponse) {
    setTogglingId(row.id);
    setError(null);
    try {
      await updateTerm(row.id, { open: !row.open });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setTogglingId(null);
    }
  }

  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = totalItems === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, totalItems);
  const colCount = 6;

  return (
    <section>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Terms</h2>
          <p className="mt-1 text-sm text-gray-600">
            Each school year has up to one term per semester. Open terms accept
            syllabus submissions.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => openModal("create")}
            className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:mt-0"
          >
            New term
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="sm:w-56">
          <label htmlFor="term-school-year-filter" className="sr-only">
            Filter by school year
          </label>
          <Select
            id="term-school-year-filter"
            value={schoolYearFilter}
            onChange={(e) => {
              setSchoolYearFilter(e.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="">All school years</option>
            {schoolYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:w-40">
          <label htmlFor="term-open-filter" className="sr-only">
            Filter by status
          </label>
          <Select
            id="term-open-filter"
            value={openFilter}
            onChange={(e) => {
              setOpenFilter(e.target.value as typeof openFilter);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="">All statuses</option>
            <option value="true">Open</option>
            <option value="false">Closed</option>
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
              <th scope="col" className={thClass}>
                School year
              </th>
              <th scope="col" className={thClass}>
                Semester
              </th>
              <th scope="col" className={`hidden sm:table-cell ${thClass}`}>
                Status
              </th>
              <th scope="col" className={`hidden md:table-cell ${thClass}`}>
                Submission deadline
              </th>
              <th scope="col" className={`hidden lg:table-cell ${thClass}`}>
                Review limit
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
            {items.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {row.expand?.school_year?.label || (
                    <span className="text-gray-400">Unknown school year</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {row.semester}
                </td>
                <td className="hidden px-4 py-3 text-sm sm:table-cell">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      row.open
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {row.open ? "Open" : "Closed"}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 md:table-cell">
                  {row.submission_deadline || "—"}
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 lg:table-cell">
                  {row.review_days > 0
                    ? `${row.review_days} ${row.review_days === 1 ? "day" : "days"} per stage`
                    : "No limit"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleOpen(row)}
                        disabled={togglingId === row.id}
                        className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                      >
                        {row.open ? "Close" : "Open"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openModal("edit", row)}
                        className="ml-4 font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteState((prev) => ({
                            open: true,
                            term: row,
                            key: prev.key + 1,
                          }))
                        }
                        className="ml-4 font-medium text-red-600 hover:text-red-500"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {!loading && items.length === 0 && !error && (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  {schoolYearFilter || openFilter
                    ? "No terms match your filters."
                    : "No terms yet."}
                </td>
              </tr>
            )}

            {loading && items.length === 0 && (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <nav
          aria-label="Terms pagination"
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

      {canManage && (
        <TermModal
          key={`modal-${modal.key}`}
          open={modal.open}
          mode={modal.mode}
          term={modal.term}
          schoolYears={schoolYears}
          onClose={() => setModal((prev) => ({ ...prev, open: false }))}
          onSaved={() => {
            setModal((prev) => ({ ...prev, open: false }));
            setReloadKey((k) => k + 1);
          }}
        />
      )}
      <DeleteTermDialog
        key={`delete-${deleteState.key}`}
        open={deleteState.open}
        term={deleteState.term}
        onClose={() => setDeleteState((prev) => ({ ...prev, open: false }))}
        onDeleted={() => {
          setDeleteState((prev) => ({ ...prev, open: false }));
          if (items.length === 1 && page > 1) {
            setPage((p) => p - 1); // the page change triggers the refetch
          } else {
            setReloadKey((k) => k + 1);
          }
        }}
      />
    </section>
  );
}
