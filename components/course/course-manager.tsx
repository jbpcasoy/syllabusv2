"use client";

import { listCourses, type CourseResponse } from "@/lib/course-client";
import { listPrograms, type ProgramRecord } from "@/lib/program-client";
import { Select } from "@headlessui/react";
import type { ListResult } from "pocketbase";
import { useEffect, useState } from "react";
import { CourseModal, type CourseModalMode } from "./course-modal";
import { DeleteCourseDialog } from "./delete-course-dialog";

const PER_PAGE = 10;

type CourseManagerProps = {
  canManage: boolean;
};

type ModalState = {
  open: boolean;
  mode: CourseModalMode;
  course: CourseResponse | null;
  key: number; // bumps on each open so the form state resets
};

const selectClass =
  "block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600";

const thClass =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500";

export function CourseManager({ canManage }: CourseManagerProps) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<ListResult<CourseResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [programs, setPrograms] = useState<ProgramRecord[]>([]);

  const [modal, setModal] = useState<ModalState>({
    open: false,
    mode: "create",
    course: null,
    key: 0,
  });
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    course: CourseResponse | null;
    key: number;
  }>({ open: false, course: null, key: 0 });

  // Load programs once for the filter and the form dropdown.
  // (The API caps perPage at 100; swap in a searchable combobox if you exceed that.)
  useEffect(() => {
    const controller = new AbortController();
    listPrograms({ page: 1, perPage: 100 }, controller.signal)
      .then((result) => setPrograms(result.items))
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

    listCourses(
      { page, perPage: PER_PAGE, search, program: programFilter },
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
  }, [page, search, programFilter, reloadKey]);

  function openModal(
    mode: CourseModalMode,
    course: CourseResponse | null = null,
  ) {
    setModal((prev) => ({ open: true, mode, course, key: prev.key + 1 }));
  }

  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = totalItems === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, totalItems);
  const colCount = 6;

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Courses</h1>
          <p className="mt-1 text-sm text-gray-600">
            The university-wide course catalog. Each course belongs to one
            program and can appear in any program&apos;s prospectus.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => openModal("create")}
            className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:mt-0"
          >
            New course
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="sm:w-full sm:max-w-sm">
          <label htmlFor="search" className="sr-only">
            Search courses
          </label>
          <input
            id="search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by code or title…"
            className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          />
        </div>
        <div className="sm:w-56">
          <label htmlFor="program-filter" className="sr-only">
            Filter by owning program
          </label>
          <Select
            id="program-filter"
            value={programFilter}
            onChange={(e) => {
              setProgramFilter(e.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="">All programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.id}
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
              <th scope="col" className={`hidden md:table-cell ${thClass}`}>
                Program
              </th>
              <th scope="col" className={`hidden sm:table-cell ${thClass}`}>
                Units
              </th>
              <th scope="col" className={`hidden lg:table-cell ${thClass}`}>
                Prerequisites
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
              const prerequisites = [
                ...(row.expand?.prerequisites ?? []).map((c) => c.code),
                ...(row.prerequisite_note ? [row.prerequisite_note] : []),
              ];
              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {row.code}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {row.title}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-gray-500 md:table-cell">
                    {row.expand?.program?.code ||
                      row.expand?.program?.name || (
                        <span className="text-gray-500">Unknown program</span>
                      )}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-gray-500 sm:table-cell">
                    {row.credit_units}
                    <span className="block text-xs text-gray-500">
                      {row.lec_units} lec / {row.lab_units} lab ·{" "}
                      {row.nominal_duration_hours} h
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-gray-500 lg:table-cell">
                    {prerequisites.length > 0 ? prerequisites.join(", ") : "—"}
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
                              course: row,
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
              );
            })}

            {!loading && items.length === 0 && !error && (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  {search || programFilter
                    ? "No courses match your filters."
                    : "No courses yet."}
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
        <CourseModal
          key={`modal-${modal.key}`}
          open={modal.open}
          mode={modal.mode}
          course={modal.course}
          programs={programs}
          onClose={() => setModal((prev) => ({ ...prev, open: false }))}
          onSaved={() => {
            setModal((prev) => ({ ...prev, open: false }));
            setReloadKey((k) => k + 1);
          }}
        />
      )}
      <DeleteCourseDialog
        key={`delete-${deleteState.key}`}
        open={deleteState.open}
        course={deleteState.course}
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
