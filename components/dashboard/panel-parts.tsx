"use client";

import type { ReactNode } from "react";

/** One dashboard section: a heading, an optional action, and its body. */
export function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const id = `panel-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id={id} className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** "Export CSV" as a plain download link, so it works without script. */
export function ExportLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      aria-label={label}
      className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
    >
      Export CSV
    </a>
  );
}

export function ErrorBanner({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="mb-3 flex items-center justify-between rounded-md bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <span>{error}</span>
      <button type="button" onClick={onRetry} className="font-medium underline">
        Retry
      </button>
    </div>
  );
}

export function Pager({
  page,
  perPage,
  totalItems,
  totalPages,
  loading,
  onPage,
}: {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  loading: boolean;
  onPage: (page: number) => void;
}) {
  const from = totalItems === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, totalItems);
  return (
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
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => onPage(Math.max(1, page - 1))}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages || loading}
          onClick={() => onPage(page + 1)}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </nav>
  );
}

/** Whole days since a PocketBase datetime: "today", "1 day", "12 days". */
export function daysSince(value: string): string {
  if (!value) return "—";
  const then = new Date(value.replace(" ", "T")).getTime();
  if (Number.isNaN(then)) return "—";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  return days === 1 ? "1 day" : `${days} days`;
}

export const thClass =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500";
