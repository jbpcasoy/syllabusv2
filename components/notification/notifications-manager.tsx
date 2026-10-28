"use client";

import { formatDate } from "@/lib/format-date";
import {
  listNotifications,
  markAllNotificationsRead,
  setNotificationRead,
  type NotificationListResponse,
  type NotificationResponse,
} from "@/lib/notification-client";
import { Tab, TabGroup, TabList } from "@headlessui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PER_PAGE = 10;
const TABS = [
  { unread: false, label: "All" },
  { unread: true, label: "Unread" },
] as const;

export function NotificationsManager() {
  const router = useRouter();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<NotificationListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listNotifications(
      { page, perPage: PER_PAGE, unread: unreadOnly },
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
  }, [page, unreadOnly, reloadKey]);

  /** Swaps one row in place and moves the unread count with it. */
  function replaceItem(updated: NotificationResponse) {
    setData((prev) => {
      if (!prev) return prev;
      const before = prev.items.find((item) => item.id === updated.id);
      const delta = before && before.read !== updated.read
        ? (updated.read ? -1 : 1)
        : 0;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === updated.id ? updated : item,
        ),
        unread_count: Math.max(0, prev.unread_count + delta),
      };
    });
  }

  async function toggleRead(item: NotificationResponse) {
    setBusyId(item.id);
    setActionError(null);
    try {
      replaceItem(await setNotificationRead(item.id, !item.read));
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  function follow(item: NotificationResponse) {
    if (!item.read) {
      // Navigation shouldn't wait on this; a failure just leaves it unread.
      void setNotificationRead(item.id, true).catch(() => {});
    }
  }

  async function markAll() {
    setMarkingAll(true);
    setActionError(null);
    try {
      await markAllNotificationsRead();
      setPage(1);
      setReloadKey((k) => k + 1);
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setMarkingAll(false);
    }
  }

  const items = data?.items ?? [];
  const unreadCount = data?.unread_count ?? 0;
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = totalItems === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, totalItems);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-600">
            Syllabi waiting for you, and what happened to the ones you author.
            They are also sent to your email.
          </p>
        </div>
        <button
          type="button"
          onClick={markAll}
          disabled={markingAll || unreadCount === 0}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {markingAll ? "Marking…" : "Mark all read"}
        </button>
      </div>

      <TabGroup
        selectedIndex={unreadOnly ? 1 : 0}
        onChange={(index) => {
          setUnreadOnly(TABS[index].unread);
          setPage(1);
        }}
        className="mt-6"
      >
        <TabList className="flex gap-1 border-b border-gray-200">
          {TABS.map((tab) => (
            <Tab
              key={tab.label}
              className="-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none data-focus:ring-2 data-focus:ring-indigo-600 data-selected:border-indigo-600 data-selected:text-indigo-700"
            >
              {tab.label}
              {tab.unread && unreadCount > 0 && ` (${unreadCount})`}
            </Tab>
          ))}
        </TabList>
      </TabGroup>

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
      {actionError && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <div className="mt-4 overflow-hidden rounded-lg bg-white shadow ring-1 ring-black/5">
        <ul
          className={`divide-y divide-gray-100 transition-opacity ${
            loading ? "opacity-50" : "opacity-100"
          }`}
        >
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 px-4 py-4">
              <span
                aria-hidden
                className={`mt-2 size-2 shrink-0 rounded-full ${
                  item.read ? "bg-transparent" : "bg-indigo-600"
                }`}
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={item.link}
                  onClick={() => follow(item)}
                  className={`text-sm hover:text-indigo-600 ${
                    item.read ? "text-gray-700" : "font-semibold text-gray-900"
                  }`}
                >
                  {item.title}
                  {!item.read && <span className="sr-only"> (unread)</span>}
                </Link>
                {item.body && (
                  <p className="mt-1 text-sm text-gray-600">{item.body}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formatDate(item.created)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleRead(item)}
                disabled={busyId === item.id}
                className="shrink-0 self-start text-xs font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
              >
                {item.read ? "Mark unread" : "Mark read"}
              </button>
            </li>
          ))}

          {!loading && items.length === 0 && !error && (
            <li className="px-4 py-10 text-center text-sm text-gray-500">
              {unreadOnly ? "You're all caught up." : "You have no notifications yet."}
            </li>
          )}
          {loading && items.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-gray-500">
              Loading…
            </li>
          )}
        </ul>

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
