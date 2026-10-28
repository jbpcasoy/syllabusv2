"use client";

import {
  listDepartments,
  type DepartmentRecord,
} from "@/lib/department-client";
import {
  listDepartmentHeads,
  updateDepartmentHead,
  type DepartmentHeadListParams,
  type DepartmentHeadResponse,
} from "@/lib/department-head-client";
import { formatDate } from "@/lib/format-date";
import { Select } from "@headlessui/react";
import type { ListResult } from "pocketbase";
import { useEffect, useState } from "react";
import { DeleteDepartmentHeadDialog } from "./delete-department-head-dialog";
import { DepartmentHeadModal } from "./department-head-modal";

const PER_PAGE = 10;

type DepartmentHeadManagerProps = {
  canManage: boolean;
};

const selectClass =
  "block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600";

const thClass =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500";

export function DepartmentHeadManager({
  canManage,
}: DepartmentHeadManagerProps) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<NonNullable<DepartmentHeadListParams["active"]>>("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<ListResult<DepartmentHeadResponse> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);

  const [modal, setModal] = useState({ open: false, key: 0 });
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    head: DepartmentHeadResponse | null;
    key: number;
  }>({ open: false, head: null, key: 0 });

  // (The API caps perPage at 100; swap in a searchable combobox if you exceed that.)
  useEffect(() => {
    const controller = new AbortController();
    listDepartments({ page: 1, perPage: 100 }, controller.signal)
      .then((result) => setDepartments(result.items))
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

    listDepartmentHeads(
      {
        page,
        perPage: PER_PAGE,
        search,
        department: departmentFilter,
        active: statusFilter,
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
  }, [page, search, departmentFilter, statusFilter, reloadKey]);

  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = totalItems === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, totalItems);

  async function toggleActive(row: DepartmentHeadResponse) {
    setTogglingId(row.id);
    setError(null);
    try {
      await updateDepartmentHead(row.id, { active: !row.active });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Department heads
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {canManage
              ? "Manage who heads each department."
              : "The departments you head."}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() =>
              setModal((prev) => ({ open: true, key: prev.key + 1 }))
            }
            className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:mt-0"
          >
            Assign head
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="sm:w-full sm:max-w-sm">
          <label htmlFor="search" className="sr-only">
            Search department heads
          </label>
          <input
            id="search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email…"
            className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          />
        </div>
        <div className="sm:w-56">
          <label htmlFor="department-filter" className="sr-only">
            Filter by department
          </label>
          <Select
            id="department-filter"
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name || d.id}
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
            className={selectClass}
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
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
                Name
              </th>
              <th scope="col" className={`hidden sm:table-cell ${thClass}`}>
                Email
              </th>
              <th scope="col" className={thClass}>
                Department
              </th>
              <th scope="col" className={`hidden sm:table-cell ${thClass}`}>
                Status
              </th>
              <th scope="col" className={`hidden md:table-cell ${thClass}`}>
                Added
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
                  {row.expand?.user?.name || (
                    <span className="text-gray-500">Unnamed</span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 sm:table-cell">
                  {row.expand?.user?.email || "—"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {row.expand?.department?.name || "—"}
                </td>
                <td className="hidden px-4 py-3 text-sm sm:table-cell">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      row.active
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {row.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 md:table-cell">
                  {formatDate(row.created)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleActive(row)}
                        disabled={togglingId === row.id}
                        className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                      >
                        {row.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteState((prev) => ({
                            open: true,
                            head: row,
                            key: prev.key + 1,
                          }))
                        }
                        className="ml-4 font-medium text-red-600 hover:text-red-500"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {!loading && items.length === 0 && !error && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  {search || departmentFilter || statusFilter
                    ? "No department heads match your filters."
                    : "No department heads assigned yet."}
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

      {canManage && (
        <DepartmentHeadModal
          key={`modal-${modal.key}`}
          open={modal.open}
          departments={departments}
          onClose={() => setModal((prev) => ({ ...prev, open: false }))}
          onSaved={() => {
            setModal((prev) => ({ ...prev, open: false }));
            setReloadKey((k) => k + 1);
          }}
        />
      )}
      <DeleteDepartmentHeadDialog
        key={`delete-${deleteState.key}`}
        open={deleteState.open}
        head={deleteState.head}
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
