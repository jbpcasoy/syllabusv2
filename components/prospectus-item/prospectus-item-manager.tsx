"use client";

import { formatDate } from "@/lib/format-date";
import {
  listProspectuses,
  type ProspectusResponse,
} from "@/lib/prospectus-client";
import {
  listProspectusItems,
  type ProspectusItemResponse,
} from "@/lib/prospectus-item-client";
import {
  SEMESTERS,
  YEAR_LEVELS,
  type Semester,
  type YearLevel,
} from "@/types/prospectus-item";
import { Select } from "@headlessui/react";
import type { ListResult } from "pocketbase";
import { useEffect, useState } from "react";
import { DeleteProspectusItemDialog } from "./delete-prospectus-item-dialog";
import {
  ProspectusItemModal,
  type ProspectusItemModalMode,
} from "./prospectus-item-modal";

const PER_PAGE = 10;

type ProspectusItemManagerProps = {
  canManage: boolean;
};

type ModalState = {
  open: boolean;
  mode: ProspectusItemModalMode;
  item: ProspectusItemResponse | null;
  key: number; // bumps on each open so the form state resets
};

const selectClass =
  "block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600";

const thClass =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500";

// Prospectus as returned by the prospectus list endpoint.
function prospectusLabel(p: ProspectusResponse) {
  const program = p.expand?.program;
  const name = program?.name || program?.code;
  return name ? `${name} — ${p.school_year}` : p.school_year;
}

// Prospectus as embedded in a prospectus item response.
function itemProspectusLabel(
  p: NonNullable<NonNullable<ProspectusItemResponse["expand"]>["prospectus"]>,
) {
  const name = p.program?.name || p.program?.code;
  return name ? `${name} — ${p.school_year}` : p.school_year;
}

export function ProspectusItemManager({
  canManage,
}: ProspectusItemManagerProps) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [prospectusFilter, setProspectusFilter] = useState("");
  const [yearLevelFilter, setYearLevelFilter] = useState<YearLevel | "">("");
  const [semesterFilter, setSemesterFilter] = useState<Semester | "">("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<ListResult<ProspectusItemResponse> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [prospectuses, setProspectuses] = useState<ProspectusResponse[]>([]);

  const [modal, setModal] = useState<ModalState>({
    open: false,
    mode: "create",
    item: null,
    key: 0,
  });
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    item: ProspectusItemResponse | null;
    key: number;
  }>({ open: false, item: null, key: 0 });

  // Load prospectuses once for the filter and the form dropdown.
  // (The API caps perPage at 100; swap in a searchable combobox if you exceed that.)
  useEffect(() => {
    const controller = new AbortController();
    listProspectuses({ page: 1, perPage: 100 }, controller.signal)
      .then((result) => setProspectuses(result.items))
      .catch(() => {
        // The dropdown just stays empty; the main list surfaces its own errors.
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

    listProspectusItems(
      {
        page,
        perPage: PER_PAGE,
        search,
        prospectus: prospectusFilter,
        yearLevel: yearLevelFilter,
        semester: semesterFilter,
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
  }, [
    page,
    search,
    prospectusFilter,
    yearLevelFilter,
    semesterFilter,
    reloadKey,
  ]);

  function openModal(
    mode: ProspectusItemModalMode,
    item: ProspectusItemResponse | null = null,
  ) {
    setModal((prev) => ({ open: true, mode, item, key: prev.key + 1 }));
  }

  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = totalItems === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, totalItems);
  const hasFilters =
    search || prospectusFilter || yearLevelFilter || semesterFilter;
  const colCount = 6;

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Prospectus items
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {canManage
              ? "Manage the subjects listed in each prospectus."
              : "Subjects listed in published prospectuses."}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => openModal("create")}
            className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:mt-0"
          >
            New item
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="sm:w-full sm:max-w-xs">
          <label htmlFor="search" className="sr-only">
            Search prospectus items
          </label>
          <input
            id="search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by subject code or title…"
            className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          />
        </div>
        <div className="sm:w-56">
          <label htmlFor="prospectus-filter" className="sr-only">
            Filter by prospectus
          </label>
          <Select
            id="prospectus-filter"
            value={prospectusFilter}
            onChange={(e) => {
              setProspectusFilter(e.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="">All prospectuses</option>
            {prospectuses.map((p) => (
              <option key={p.id} value={p.id}>
                {prospectusLabel(p)}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:w-40">
          <label htmlFor="year-level-filter" className="sr-only">
            Filter by year level
          </label>
          <Select
            id="year-level-filter"
            value={yearLevelFilter}
            onChange={(e) => {
              setYearLevelFilter(e.target.value as YearLevel | "");
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="">All year levels</option>
            {YEAR_LEVELS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:w-44">
          <label htmlFor="semester-filter" className="sr-only">
            Filter by semester
          </label>
          <Select
            id="semester-filter"
            value={semesterFilter}
            onChange={(e) => {
              setSemesterFilter(e.target.value as Semester | "");
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="">All semesters</option>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                {s}
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
              <th scope="col" className={thClass}>
                Code
              </th>
              <th scope="col" className={thClass}>
                Title
              </th>
              <th scope="col" className={`hidden sm:table-cell ${thClass}`}>
                Year / Semester
              </th>
              <th scope="col" className={`hidden md:table-cell ${thClass}`}>
                Prospectus
              </th>
              <th scope="col" className={`hidden lg:table-cell ${thClass}`}>
                Updated
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
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                  {row.subject_code}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.title}</td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 sm:table-cell">
                  {row.year_level}
                  <span className="block text-xs text-gray-400">
                    {row.semester}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 md:table-cell">
                  {row.expand?.prospectus ? (
                    itemProspectusLabel(row.expand.prospectus)
                  ) : (
                    <span className="text-gray-400">Unknown prospectus</span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 lg:table-cell">
                  {formatDate(row.updated)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => openModal("edit", row)}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteState((prev) => ({
                            open: true,
                            item: row,
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
                  {hasFilters
                    ? "No prospectus items match your filters."
                    : "No prospectus items yet."}
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

      {canManage && (
        <ProspectusItemModal
          key={`modal-${modal.key}`}
          open={modal.open}
          mode={modal.mode}
          item={modal.item}
          prospectuses={prospectuses}
          onClose={() => setModal((prev) => ({ ...prev, open: false }))}
          onSaved={() => {
            setModal((prev) => ({ ...prev, open: false }));
            setReloadKey((k) => k + 1);
          }}
        />
      )}
      <DeleteProspectusItemDialog
        key={`delete-${deleteState.key}`}
        open={deleteState.open}
        item={deleteState.item}
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
    </div>
  );
}
