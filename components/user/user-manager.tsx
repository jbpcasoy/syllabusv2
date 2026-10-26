"use client";

import { formatDate } from "@/lib/format-date";
import {
  listUsers,
  type UserKind,
  type UserResponse,
} from "@/lib/user-client";
import { Select } from "@headlessui/react";
import type { ListResult } from "pocketbase";
import { useEffect, useState } from "react";
import { DeleteUserDialog } from "./delete-user-modal";
import { UserModal, type UserModalMode } from "./user-modal";

const PER_PAGE = 10;

const KIND_LABELS: Record<UserKind, string> = {
  admin: "Administrators",
  assigned: "Has assignments",
  unassigned: "Unassigned",
};

/** "Administrator", "Program Chair (BSCS)", ... or "Unassigned". */
function describeAccess(user: UserResponse): string {
  const parts = [
    ...(user.isAdmin ? ["Administrator"] : []),
    ...(user.assignments ?? []).map((a) =>
      a.scope ? `${a.title} (${a.scope})` : a.title,
    ),
  ];
  return parts.length > 0 ? parts.join(", ") : "Unassigned";
}

type ModalState = {
  open: boolean;
  mode: UserModalMode;
  user: UserResponse | null;
  key: number; // bumps on each open so the form state resets
};

type UserManagerProps = {
  currentUserId: string;
};

export function UserManager({ currentUserId }: UserManagerProps) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<UserKind | "">("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<ListResult<UserResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalState>({
    open: false,
    mode: "create",
    user: null,
    key: 0,
  });
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    user: UserResponse | null;
    key: number;
  }>({ open: false, user: null, key: 0 });

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

    listUsers(
      { page, perPage: PER_PAGE, search, kind: kindFilter },
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
  }, [page, search, kindFilter, reloadKey]);

  function openModal(mode: UserModalMode, user: UserResponse | null = null) {
    setModal((prev) => ({ open: true, mode, user, key: prev.key + 1 }));
  }

  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = totalItems === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, totalItems);

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-600">
            Browse, search, and manage user accounts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openModal("create")}
          className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:mt-0"
        >
          New user
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="sm:w-full sm:max-w-sm">
          <label htmlFor="search" className="sr-only">
            Search users
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
          <label htmlFor="kind-filter" className="sr-only">
            Filter by access
          </label>
          <Select
            id="kind-filter"
            value={kindFilter}
            onChange={(e) => {
              setKindFilter(e.target.value as UserKind | "");
              setPage(1);
            }}
            className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          >
            <option value="">All users</option>
            {(Object.keys(KIND_LABELS) as UserKind[]).map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABELS[kind]}
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
                Name
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell"
              >
                Email
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell"
              >
                Access
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 lg:table-cell"
              >
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
            {items.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {user.name || (
                      <span className="text-gray-400">Unnamed</span>
                    )}
                    {isSelf && (
                      <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        You
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-gray-500 sm:table-cell">
                    {user.email}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-gray-500 md:table-cell">
                    {describeAccess(user)}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-gray-500 lg:table-cell">
                    {formatDate(user.updated)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <button
                      type="button"
                      onClick={() => openModal("view", user)}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => openModal("edit", user)}
                      className="ml-4 font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={isSelf}
                      title={
                        isSelf ? "You can't delete your own account" : undefined
                      }
                      onClick={() =>
                        setDeleteState((prev) => ({
                          open: true,
                          user,
                          key: prev.key + 1,
                        }))
                      }
                      className="ml-4 font-medium text-red-600 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-red-600"
                    >
                      Delete
                    </button>
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
                  {search || kindFilter
                    ? "No users match your filters."
                    : "No users yet. Create your first one."}
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

      <UserModal
        key={`modal-${modal.key}`}
        open={modal.open}
        mode={modal.mode}
        user={modal.user}
        currentUserId={currentUserId}
        onModeChange={(mode) => setModal((prev) => ({ ...prev, mode }))}
        onClose={() => setModal((prev) => ({ ...prev, open: false }))}
        onSaved={() => {
          setModal((prev) => ({ ...prev, open: false }));
          setReloadKey((k) => k + 1);
        }}
      />
      <DeleteUserDialog
        key={`delete-${deleteState.key}`}
        open={deleteState.open}
        user={deleteState.user}
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
