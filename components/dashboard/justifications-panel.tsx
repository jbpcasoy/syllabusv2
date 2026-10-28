"use client";

import {
  exportUrl,
  listJustificationRows,
  type DashboardParams,
  type JustificationRow,
  type JustificationState,
} from "@/lib/dashboard-client";
import { formatDate } from "@/lib/format-date";
import { Field, Label, Select } from "@headlessui/react";
import Link from "next/link";
import type { ListResult } from "pocketbase";
import { useEffect, useState } from "react";
import { STATUS_LABELS } from "../syllabus/syllabus-status";
import { ErrorBanner, ExportLink, Pager, Panel, thClass } from "./panel-parts";

const PER_PAGE = 10;

const STATES: { value: "" | JustificationState; label: string }[] = [
  { value: "", label: "All states" },
  { value: "none", label: "Not started" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "returned", label: "Returned" },
];

const STATE_STYLES: Record<JustificationState, string> = {
  none: "bg-amber-50 text-amber-800",
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-green-50 text-green-700",
  returned: "bg-red-50 text-red-700",
};

/**
 * Approved or filed syllabi that build on last year's, and where each
 * justification stands. Only reviewers and admins see this panel.
 */
export function JustificationsPanel({ params }: { params: DashboardParams }) {
  const [state, setState] = useState<"" | JustificationState>("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResult<JustificationRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    listJustificationRows(
      { ...params, page, perPage: PER_PAGE, state: state || undefined },
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
  }, [params, page, state, reloadKey]);

  const items = data?.items ?? [];
  const label = (s: JustificationState) => STATES.find((o) => o.value === s)?.label ?? s;

  return (
    <Panel
      title="Justifications"
      description="Approved or filed syllabi built on last school year's, whose previous authors are acknowledged. Informational only."
      action={
        <ExportLink
          href={exportUrl("justifications", params, { state: state || undefined })}
          subject="justifications"
        />
      }
    >
      <Field className="mb-3 sm:w-56">
        <Label className="text-sm font-medium text-gray-900">Justification state</Label>
        <Select
          value={state}
          onChange={(e) => {
            setState(e.target.value as "" | JustificationState);
            setPage(1);
          }}
          className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
        >
          {STATES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>

      {error && <ErrorBanner error={error} onRetry={() => setReloadKey((k) => k + 1)} />}
      <div className="overflow-hidden rounded-lg bg-white shadow ring-1 ring-black/5">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className={thClass}>Course</th>
              <th scope="col" className={`hidden sm:table-cell ${thClass}`}>Program</th>
              <th scope="col" className={`hidden md:table-cell ${thClass}`}>Lead</th>
              <th scope="col" className={`hidden md:table-cell ${thClass}`}>Syllabus</th>
              <th scope="col" className={thClass}>Justification</th>
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
                <td className="hidden px-4 py-3 text-sm text-gray-500 md:table-cell">
                  {STATUS_LABELS[row.syllabus_status]}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATE_STYLES[row.justification]}`}>
                    {label(row.justification)}
                  </span>
                  {row.justification_updated && (
                    <div className="mt-1 text-xs text-gray-500">{formatDate(row.justification_updated)}</div>
                  )}
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                  {state ? "No justifications in this state." : "No syllabus this term builds on last year's."}
                </td>
              </tr>
            )}
            {loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">Loading…</td>
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
