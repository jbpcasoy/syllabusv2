"use client";

import { formatDate } from "@/lib/format-date";
import {
  listSchoolYears,
  type SchoolYearResponse,
} from "@/lib/school-year-client";
import type { ListResult } from "pocketbase";
import { useEffect, useState } from "react";
import { DeleteSchoolYearDialog } from "./delete-school-year-dialog";
import {
  SchoolYearModal,
  type SchoolYearModalMode,
} from "./school-year-modal";

const PER_PAGE = 10;

type SchoolYearManagerProps = {
  canManage: boolean;
  /** Called after a create, edit or delete so sibling lists can refresh. */
  onChanged?: () => void;
};

type ModalState = {
  open: boolean;
  mode: SchoolYearModalMode;
  schoolYear: SchoolYearResponse | null;
  key: number; // bumps on each open so the form state resets
};

const thClass =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500";

export function SchoolYearManager({
  canManage,
  onChanged,
}: SchoolYearManagerProps) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<ListResult<SchoolYearResponse> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalState>({
    open: false,
    mode: "create",
    schoolYear: null,
    key: 0,
  });
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    schoolYear: SchoolYearResponse | null;
    key: number;
  }>({ open: false, schoolYear: null, key: 0 });

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

    listSchoolYears({ page, perPage: PER_PAGE, search }, controller.signal)
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
  }, [page, search, reloadKey]);

  function openModal(
    mode: SchoolYearModalMode,
    schoolYear: SchoolYearResponse | null = null,
  ) {
    setModal((prev) => ({ open: true, mode, schoolYear, key: prev.key + 1 }));
  }

  function changed() {
    setReloadKey((k) => k + 1);
    onChanged?.();
  }

  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = totalItems === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, totalItems);
  const colCount = 3;

  return (
    <section>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">School years</h2>
          <p className="mt-1 text-sm text-gray-600">
            School years group terms and prospectuses.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => openModal("create")}
            className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:mt-0"
          >
            New school year
          </button>
        )}
      </div>

      <div className="mt-6">
        <label htmlFor="school-year-search" className="sr-only">
          Search school years
        </label>
        <input
          id="school-year-search"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by year…"
          className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-sm"
        />
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
              <th scope="col" className={`hidden sm:table-cell ${thClass}`}>
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
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {row.label}
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 sm:table-cell">
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
                            schoolYear: row,
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
                  {search
                    ? `No school years match “${search}”.`
                    : "No school years yet."}
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
          aria-label="School years pagination"
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
        <SchoolYearModal
          key={`modal-${modal.key}`}
          open={modal.open}
          mode={modal.mode}
          schoolYear={modal.schoolYear}
          onClose={() => setModal((prev) => ({ ...prev, open: false }))}
          onSaved={() => {
            setModal((prev) => ({ ...prev, open: false }));
            changed();
          }}
        />
      )}
      <DeleteSchoolYearDialog
        key={`delete-${deleteState.key}`}
        open={deleteState.open}
        schoolYear={deleteState.schoolYear}
        onClose={() => setDeleteState((prev) => ({ ...prev, open: false }))}
        onDeleted={() => {
          setDeleteState((prev) => ({ ...prev, open: false }));
          onChanged?.();
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
