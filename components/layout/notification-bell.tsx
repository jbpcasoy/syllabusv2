"use client";

import { formatDate } from "@/lib/format-date";
import {
  listNotifications,
  markAllNotificationsRead,
  setNotificationRead,
  type NotificationResponse,
} from "@/lib/notification-client";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  useClose,
} from "@headlessui/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PREVIEW_COUNT = 5;

type NotificationBellProps = {
  /** Rendered by the server so the first paint is right. */
  initialUnread: number;
};

function BellIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="size-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
      />
    </svg>
  );
}

export function NotificationBell({ initialUnread }: NotificationBellProps) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(initialUnread);

  // The header lives in the root layout, which stays mounted across client
  // navigations, so refresh the count on every route change.
  useEffect(() => {
    const controller = new AbortController();
    listNotifications({ page: 1, perPage: 1, unread: true }, controller.signal)
      .then((result) => setUnread(result.unread_count))
      .catch(() => {
        // Keep the last count; the list page surfaces errors.
      });
    return () => controller.abort();
  }, [pathname]);

  const label =
    unread > 0 ? `Notifications, ${unread} unread` : "Notifications";

  return (
    <Popover className="relative">
      <PopoverButton
        aria-label={label}
        className="relative rounded-full p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        <BellIcon />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </PopoverButton>

      <PopoverPanel
        transition
        anchor="bottom end"
        className="z-40 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition duration-100 focus:outline-none data-closed:scale-95 data-closed:opacity-0"
      >
        <BellPanel onUnreadChange={setUnread} />
      </PopoverPanel>
    </Popover>
  );
}

/** Mounted only while the popover is open, so it loads fresh each time. */
function BellPanel({
  onUnreadChange,
}: {
  onUnreadChange: (count: number) => void;
}) {
  const router = useRouter();
  const close = useClose();
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    listNotifications({ page: 1, perPage: PREVIEW_COUNT }, controller.signal)
      .then((result) => {
        setItems(result.items);
        onUnreadChange(result.unread_count);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey, onUnreadChange]);

  function open(item: NotificationResponse) {
    close();
    if (!item.read) {
      // Navigation shouldn't wait on this; a failure just leaves it unread.
      void setNotificationRead(item.id, true).catch(() => {});
    }
    router.push(item.link);
  }

  async function markAll() {
    setMarking(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      onUnreadChange(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setMarking(false);
    }
  }

  const hasUnread = items.some((item) => !item.read);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
        <button
          type="button"
          onClick={markAll}
          disabled={marking || !hasUnread}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-500 disabled:cursor-not-allowed disabled:text-gray-400"
        >
          {marking ? "Marking…" : "Mark all read"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between bg-red-50 px-4 py-2 text-xs text-red-700"
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

      <ul
        className={`max-h-96 divide-y divide-gray-100 overflow-y-auto transition-opacity ${
          loading ? "opacity-50" : "opacity-100"
        }`}
      >
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => open(item)}
              className="flex w-full gap-2 px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
            >
              <span
                aria-hidden
                className={`mt-1.5 size-2 shrink-0 rounded-full ${
                  item.read ? "bg-transparent" : "bg-indigo-600"
                }`}
              />
              <span className="min-w-0">
                <span
                  className={`block text-sm ${
                    item.read ? "text-gray-700" : "font-semibold text-gray-900"
                  }`}
                >
                  {item.title}
                  {!item.read && <span className="sr-only"> (unread)</span>}
                </span>
                <span className="block text-xs text-gray-500">
                  {formatDate(item.created)}
                </span>
              </span>
            </button>
          </li>
        ))}

        {!loading && !error && items.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-gray-500">
            You have no notifications.
          </li>
        )}
        {loading && items.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-gray-500">
            Loading…
          </li>
        )}
      </ul>

      <div className="border-t border-gray-100 px-4 py-2 text-center">
        <Link
          href="/notifications"
          onClick={() => close()}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          See all
        </Link>
      </div>
    </div>
  );
}
