"use client";

import { formatDate } from "@/lib/format-date";
import { listPrograms, type ProgramRecord } from "@/lib/program-client";
import {
  decideProgramJoinRequest,
  listProgramJoinRequests,
  type JoinRequestStatus,
  type ProgramJoinRequestListParams,
  type ProgramJoinRequestResponse,
} from "@/lib/program-join-request-client";
import { Select } from "@headlessui/react";
import type { ListResult } from "pocketbase";
import { useEffect, useState } from "react";
import { ProgramJoinRequestModal } from "./program-join-request-modal";
import { RejectProgramJoinRequestDialog } from "./reject-program-join-request-dialog";
import { WithdrawProgramJoinRequestDialog } from "./withdraw-program-join-request-dialog";

const PER_PAGE = 10;

const STATUS_STYLES: Record<JoinRequestStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

const STATUS_LABELS: Record<JoinRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

type ProgramJoinRequestManagerProps = {
  /** Show Approve/Reject. The API still checks each request's program. */
  canReview: boolean;
  /** The signed-in user, who may withdraw their own pending requests. */
  currentUserId: string;
};

type RowDialog = {
  open: boolean;
  joinRequest: ProgramJoinRequestResponse | null;
  key: number;
};

export function ProgramJoinRequestManager({
  canReview,
  currentUserId,
}: ProgramJoinRequestManagerProps) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  // Reviewers mostly care about what's waiting on them.
  const [statusFilter, setStatusFilter] = useState<
    NonNullable<ProgramJoinRequestListParams["status"]>
  >(canReview ? "pending" : "");
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] =
    useState<ListResult<ProgramJoinRequestResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [programs, setPrograms] = useState<ProgramRecord[]>([]);

  const [modal, setModal] = useState({ open: false, key: 0 });
  const [rejectState, setRejectState] = useState<RowDialog>({
    open: false,
    joinRequest: null,
    key: 0,
  });
  const [withdrawState, setWithdrawState] = useState<RowDialog>({
    open: false,
    joinRequest: null,
    key: 0,
  });

  // Load programs once for the filter and the request form.
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

    listProgramJoinRequests(
      {
        page,
        perPage: PER_PAGE,
        search,
        program: programFilter,
        status: statusFilter,
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
  }, [page, search, programFilter, statusFilter, reloadKey]);

  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = totalItems === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, totalItems);

  /** Reload, stepping back a page if the last row on it just left the filter. */
  function reloadAfterRowLeft() {
    if (statusFilter === "pending" && items.length === 1 && page > 1) {
      setPage((p) => p - 1); // the page change triggers the refetch
    } else {
      setReloadKey((k) => k + 1);
    }
  }

  async function approve(row: ProgramJoinRequestResponse) {
    setDecidingId(row.id);
    setError(null);
    try {
      await decideProgramJoinRequest(row.id, { decision: "approve" });
      reloadAfterRowLeft();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Join requests
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {canReview
              ? "Approve or reject requests to join your programs. Approving adds the user as faculty."
              : "Ask to join a program as faculty. Its program chair reviews your request."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal((prev) => ({ open: true, key: prev.key + 1 }))}
          className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:mt-0"
        >
          Request to join
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="sm:w-full sm:max-w-sm">
          <label htmlFor="search" className="sr-only">
            Search join requests
          </label>
          <input
            id="search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email or program…"
            className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          />
        </div>
        <div className="sm:w-56">
          <label htmlFor="program-filter" className="sr-only">
            Filter by program
          </label>
          <Select
            id="program-filter"
            value={programFilter}
            onChange={(e) => {
              setProgramFilter(e.target.value);
              setPage(1);
            }}
            className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          >
            <option value="">All programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.id}
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
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
                Requester
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Program
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell"
              >
                Note
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell"
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
              const mine = row.user === currentUserId;
              const pending = row.status === "pending";
              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900">
                      {row.expand?.user?.name || (
                        <span className="text-gray-400">Unnamed</span>
                      )}
                      {mine && (
                        <span className="ml-1 font-normal text-gray-500">
                          (you)
                        </span>
                      )}
                    </div>
                    <div className="text-gray-500">
                      {row.expand?.user?.email || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {row.expand?.program?.name || "—"}
                  </td>
                  <td className="hidden max-w-xs px-4 py-3 text-sm text-gray-500 md:table-cell">
                    <p className="line-clamp-3 whitespace-pre-line">
                      {row.note || "—"}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 text-sm sm:table-cell">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status]}`}
                    >
                      {STATUS_LABELS[row.status]}
                    </span>
                    {row.status === "rejected" && row.reason && (
                      <p className="mt-1 max-w-xs text-xs text-gray-500">
                        {row.reason}
                      </p>
                    )}
                    {!pending && row.expand?.reviewed_by?.name && (
                      <p className="mt-1 text-xs text-gray-400">
                        by {row.expand.reviewed_by.name}
                      </p>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-gray-500 md:table-cell">
                    {formatDate(row.created)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    {pending && mine && (
                      <button
                        type="button"
                        onClick={() =>
                          setWithdrawState((prev) => ({
                            open: true,
                            joinRequest: row,
                            key: prev.key + 1,
                          }))
                        }
                        className="font-medium text-red-600 hover:text-red-500"
                      >
                        Withdraw
                      </button>
                    )}
                    {pending && !mine && canReview && (
                      <>
                        <button
                          type="button"
                          onClick={() => approve(row)}
                          disabled={decidingId === row.id}
                          className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                        >
                          {decidingId === row.id ? "Approving…" : "Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setRejectState((prev) => ({
                              open: true,
                              joinRequest: row,
                              key: prev.key + 1,
                            }))
                          }
                          disabled={decidingId === row.id}
                          className="ml-4 font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                        >
                          Reject
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
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  {search || programFilter || statusFilter
                    ? "No join requests match your filters."
                    : "No join requests yet."}
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

      <ProgramJoinRequestModal
        key={`modal-${modal.key}`}
        open={modal.open}
        programs={programs}
        onClose={() => setModal((prev) => ({ ...prev, open: false }))}
        onSaved={() => {
          setModal((prev) => ({ ...prev, open: false }));
          setReloadKey((k) => k + 1);
        }}
      />
      {canReview && (
        <RejectProgramJoinRequestDialog
          key={`reject-${rejectState.key}`}
          open={rejectState.open}
          joinRequest={rejectState.joinRequest}
          onClose={() => setRejectState((prev) => ({ ...prev, open: false }))}
          onRejected={() => {
            setRejectState((prev) => ({ ...prev, open: false }));
            reloadAfterRowLeft();
          }}
        />
      )}
      <WithdrawProgramJoinRequestDialog
        key={`withdraw-${withdrawState.key}`}
        open={withdrawState.open}
        joinRequest={withdrawState.joinRequest}
        onClose={() => setWithdrawState((prev) => ({ ...prev, open: false }))}
        onWithdrawn={() => {
          setWithdrawState((prev) => ({ ...prev, open: false }));
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
