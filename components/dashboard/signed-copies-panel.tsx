"use client";

import {
  exportUrl,
  listSignedCopies,
  type DashboardParams,
  type SignedCopyRow,
} from "@/lib/dashboard-client";
import { formatDate } from "@/lib/format-date";
import Link from "next/link";
import type { ListResult } from "pocketbase";
import { useEffect, useState } from "react";
import { daysSince, ErrorBanner, ExportLink, Pager, Panel, thClass } from "./panel-parts";

const PER_PAGE = 10;

/** Approved syllabi whose lead still has to upload the signed scan. */
export function SignedCopiesPanel({ params }: { params: DashboardParams }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResult<SignedCopyRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    listSignedCopies({ ...params, page, perPage: PER_PAGE }, controller.signal)
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
  }, [params, page, reloadKey]);

  const items = data?.items ?? [];

  return (
    <Panel
      title="Awaiting signed copy"
      description="Approved by the VPAA. The lead uploads the wet-signed scan to file it. Longest wait first."
      action={<ExportLink href={exportUrl("signed-copies", params)} label="Export awaiting signed copy as CSV" />}
    >
      {error && <ErrorBanner error={error} onRetry={() => setReloadKey((k) => k + 1)} />}
      <div className="overflow-hidden rounded-lg bg-white shadow ring-1 ring-black/5">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className={thClass}>Course</th>
              <th scope="col" className={`hidden sm:table-cell ${thClass}`}>Program</th>
              <th scope="col" className={`hidden md:table-cell ${thClass}`}>Lead</th>
              <th scope="col" className={thClass}>Waiting</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-gray-100 transition-opacity ${loading ? "opacity-50" : "opacity-100"}`}>
            {items.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  <Link href={`/syllabus/${row.id}`} className="font-medium text-indigo-600 hover:text-indigo-500">
                    {row.course_code || "—"}
                  </Link>
                  <div className="text-gray-500">{row.course_title}</div>
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 sm:table-cell">{row.program_code || "—"}</td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 md:table-cell">{row.lead_name || "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-700" title={`Approved ${formatDate(row.approved_at)}`}>
                  {daysSince(row.approved_at)}
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && !error && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">
                  Nothing is waiting for a signed copy.
                </td>
              </tr>
            )}
            {loading && items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">Loading…</td>
              </tr>
            )}
          </tbody>
        </table>
        <Pager
          page={page}
          perPage={PER_PAGE}
          totalItems={data?.totalItems ?? 0}
          totalPages={data?.totalPages ?? 1}
          loading={loading}
          onPage={setPage}
        />
      </div>
    </Panel>
  );
}
