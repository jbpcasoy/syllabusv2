"use client";

import { formatDate } from "@/lib/format-date";
import type {
  SyllabusResponse,
  TimelineEntry,
} from "@/lib/syllabus-client";
import { CHAIN_ROLES } from "@/lib/syllabus-workflow";

const stageName = (stage: number) =>
  `stage ${stage} (${CHAIN_ROLES[stage - 1]?.label ?? "?"})`;

const by = (entry: TimelineEntry) =>
  entry.actor_name ? ` by ${entry.actor_name}` : "";

const version = (entry: TimelineEntry) =>
  entry.version_no ? ` · v${entry.version_no}` : "";

const DOT: Record<TimelineEntry["kind"], string> = {
  created: "bg-gray-300",
  uploaded: "bg-gray-400",
  submitted: "bg-blue-500",
  resubmitted: "bg-blue-500",
  approved: "bg-green-500",
  returned: "bg-amber-500",
  filed: "bg-emerald-600",
  scan_returned: "bg-red-500",
};

export function describeEntry(entry: TimelineEntry): string {
  switch (entry.kind) {
    case "created":
      return "Draft created";
    case "uploaded":
      return `Version ${entry.version_no ?? "?"} uploaded${by(entry)}`;
    case "submitted":
      return `Submitted for review${by(entry)}${version(entry)}`;
    case "approved":
      return `Approved at ${stageName(entry.stage)}${by(entry)}${version(entry)}`;
    case "returned":
      return `Returned for revision at ${stageName(entry.stage)}${by(entry)}${version(entry)}`;
    case "resubmitted":
      return `Resubmitted to ${stageName(entry.stage)}${by(entry)}${version(entry)}`;
    case "filed":
      return `Signed copy filed${by(entry)}`;
    case "scan_returned":
      return `Signed copy returned as invalid${by(entry)}`;
  }
}

/** "Waiting on Dean since …" and the like, from the syllabus itself. */
function currentLine(syllabus: SyllabusResponse): string {
  const since = syllabus.status_changed_at
    ? ` since ${formatDate(syllabus.status_changed_at)}`
    : "";
  const role = CHAIN_ROLES[syllabus.stage - 1]?.label ?? "";
  switch (syllabus.status) {
    case "draft":
      return "Draft: not yet submitted.";
    case "submitted":
      return `Waiting on ${role} (stage ${syllabus.stage})${since}.`;
    case "returned":
      return `With the faculty lead for revision${since}.`;
    case "approved":
      return `Approved; waiting for the signed copy${since}.`;
    case "filed":
      return `Filed${since}.`;
  }
}

type SyllabusTimelineProps = {
  syllabus: SyllabusResponse;
  entries: TimelineEntry[] | null;
  error: string | null;
  onRetry: () => void;
};

export function SyllabusTimeline({
  syllabus,
  entries,
  error,
  onRetry,
}: SyllabusTimelineProps) {
  // Newest first reads best on a status page.
  const rows = entries ? [...entries].reverse() : [];

  return (
    <section className="rounded-lg bg-white p-4 shadow ring-1 ring-black/5">
      <h2 className="text-base font-semibold text-gray-900">Timeline</h2>
      <p className="mt-1 text-sm font-medium text-gray-700">
        {currentLine(syllabus)}
      </p>

      {error && (
        <div
          role="alert"
          className="mt-3 flex items-center justify-between rounded-md bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button type="button" onClick={onRetry} className="font-medium underline">
            Retry
          </button>
        </div>
      )}
      {!entries && !error && (
        <p className="mt-3 text-sm text-gray-500">Loading…</p>
      )}

      {rows.length > 0 && (
        <ol className="mt-4 space-y-3 border-l border-gray-200 pl-4">
          {rows.map((entry, i) => (
            <li key={`${entry.kind}-${entry.at}-${i}`} className="relative">
              <span
                aria-hidden
                className={`absolute -left-[21px] top-1.5 size-2.5 rounded-full ring-2 ring-white ${DOT[entry.kind]}`}
              />
              <p className="text-sm text-gray-900">{describeEntry(entry)}</p>
              <p className="text-xs text-gray-500">
                <time dateTime={entry.at.replace(" ", "T")}>
                  {formatDate(entry.at)}
                </time>
                {entry.approval_code && (
                  <span className="ml-2 font-mono">{entry.approval_code}</span>
                )}
              </p>
              {entry.reason && (
                <p className="mt-0.5 text-xs text-gray-600">
                  Reason: {entry.reason}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
