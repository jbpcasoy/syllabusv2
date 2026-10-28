"use client";

import {
  exportUrl,
  getDashboardSummary,
  type CompletionRow,
  type DashboardCounts,
  type DashboardParams,
  type DashboardSummary,
} from "@/lib/dashboard-client";
import { CHAIN_ROLES } from "@/lib/syllabus-workflow";
import { useEffect, useState } from "react";
import { ErrorBanner, ExportLink, Panel, thClass } from "./panel-parts";

type Tile = {
  label: string;
  value: (c: DashboardCounts) => number;
  href: (p: DashboardParams) => string;
  tone?: "warn";
};

const TILES: Tile[] = [
  { label: "Not started", value: (c) => c.notStarted, href: (p) => exportUrl("completion", p) },
  { label: "Draft", value: (c) => c.draft, href: (p) => exportUrl("syllabi", p, { status: "draft" }) },
  ...CHAIN_ROLES.map(
    (role): Tile => ({
      label: `Waiting: ${role.label}`,
      value: (c) => c.waiting[role.stage - 1] ?? 0,
      href: (p) => exportUrl("syllabi", p, { status: "submitted", stage: role.stage }),
    }),
  ),
  { label: "Returned to faculty", value: (c) => c.returned, href: (p) => exportUrl("syllabi", p, { status: "returned" }) },
  { label: "Awaiting signed copy", value: (c) => c.approved, href: (p) => exportUrl("signed-copies", p) },
  { label: "Filed", value: (c) => c.filed, href: (p) => exportUrl("syllabi", p, { status: "filed" }) },
  { label: "Referenced", value: (c) => c.referenced, href: (p) => exportUrl("completion", p) },
  {
    label: "Overdue for submission",
    value: (c) => c.overdueSubmission,
    href: (p) => exportUrl("syllabi", p, { overdue: "submission" }),
    tone: "warn",
  },
  {
    label: "Overdue for review",
    value: (c) => c.overdueReview,
    href: (p) => exportUrl("syllabi", p, { overdue: "review" }),
    tone: "warn",
  },
];

export function SummaryPanel({ params }: { params: DashboardParams }) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getDashboardSummary(params, controller.signal)
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
  }, [params, reloadKey]);

  return (
    <>
      <Panel title="By stage" description="Every syllabus of the term in your scope. Each tile downloads its rows.">
        {error && <ErrorBanner error={error} onRetry={() => setReloadKey((k) => k + 1)} />}
        <ul
          className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 transition-opacity ${
            loading ? "opacity-50" : "opacity-100"
          }`}
        >
          {TILES.map((tile) => {
            const value = data ? tile.value(data.counts) : null;
            const warn = tile.tone === "warn" && !!value;
            return (
              <li
                key={tile.label}
                className={`rounded-lg bg-white p-4 shadow ring-1 ${warn ? "ring-red-200" : "ring-black/5"}`}
              >
                <p className="text-sm text-gray-600">{tile.label}</p>
                <p className={`mt-1 text-2xl font-semibold ${warn ? "text-red-700" : "text-gray-900"}`}>
                  {value ?? "—"}
                </p>
                <a
                  href={tile.href(params)}
                  download
                  aria-label={`Download ${tile.label} as CSV`}
                  className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Download
                </a>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel
        title="Completion"
        description="Filed syllabi out of the courses each program's published prospectus lists for the term. A reference to a filed syllabus counts as filed."
        action={<ExportLink href={exportUrl("completion", params)} subject="completion" />}
      >
        <CompletionTable rows={data?.completion ?? []} loading={loading} />
      </Panel>
    </>
  );
}

const percent = (rate: number) => `${Math.round(rate * 1000) / 10}%`;

function CompletionTable({ rows, loading }: { rows: CompletionRow[]; loading: boolean }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const parentOf = new Map(rows.map((r) => [r.id, r.parentId]));

  const hidden = (row: CompletionRow) => {
    for (let id = row.parentId; id; id = parentOf.get(id) ?? "") {
      if (collapsed.has(id)) return true;
    }
    return false;
  };
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow ring-1 ring-black/5">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className={thClass}>College / department / program</th>
            <th scope="col" className={thClass}>Completion</th>
            <th scope="col" className={`hidden sm:table-cell ${thClass}`}>Overdue submission</th>
            <th scope="col" className={`hidden sm:table-cell ${thClass}`}>Overdue review</th>
          </tr>
        </thead>
        <tbody className={`divide-y divide-gray-100 transition-opacity ${loading ? "opacity-50" : "opacity-100"}`}>
          {rows.filter((r) => !hidden(r)).map((row) => {
            const indent = row.level === "college" ? "" : row.level === "department" ? "pl-6" : "pl-12";
            const expandable = row.level !== "program";
            const open = !collapsed.has(row.id);
            return (
              <tr key={`${row.level}-${row.id}`} className={row.level === "college" ? "bg-gray-50/60" : ""}>
                <th scope="row" className={`px-4 py-2 text-left text-sm ${row.level === "program" ? "font-normal text-gray-700" : "font-medium text-gray-900"}`}>
                  <span className={`flex items-center gap-1 ${indent}`}>
                    {expandable ? (
                      <button
                        type="button"
                        onClick={() => toggle(row.id)}
                        aria-expanded={open}
                        aria-label={`${open ? "Collapse" : "Expand"} ${row.name}`}
                        className="rounded p-0.5 text-gray-500 hover:bg-gray-100"
                      >
                        <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className={`size-4 transition-transform ${open ? "rotate-90" : ""}`}>
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.17 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
                        </svg>
                      </button>
                    ) : (
                      <span className="w-5" aria-hidden />
                    )}
                    {row.name || "—"}
                  </span>
                </th>
                <td className="px-4 py-2 text-sm text-gray-700">
                  {row.rate === null ? (
                    <span className="text-gray-500">— (nothing expected)</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <progress
                        value={row.filed}
                        max={row.expected}
                        aria-label={`${row.name} completion`}
                        className="h-2 w-24 overflow-hidden rounded-full [&::-moz-progress-bar]:bg-indigo-600 [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:bg-indigo-600"
                      />
                      <span>
                        {percent(row.rate)}{" "}
                        <span className="text-gray-500">({row.filed} of {row.expected})</span>
                      </span>
                    </span>
                  )}
                </td>
                <td className={`hidden px-4 py-2 text-sm sm:table-cell ${row.overdueSubmission ? "font-medium text-red-700" : "text-gray-500"}`}>
                  {row.overdueSubmission}
                </td>
                <td className={`hidden px-4 py-2 text-sm sm:table-cell ${row.overdueReview ? "font-medium text-red-700" : "text-gray-500"}`}>
                  {row.overdueReview}
                </td>
              </tr>
            );
          })}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">
                No programs in this view.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
