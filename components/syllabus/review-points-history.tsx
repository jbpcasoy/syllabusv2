"use client";

import {
  getForm18,
  type Form18PointResponse,
} from "@/lib/syllabus-client";
import { CHAIN_ROLES } from "@/lib/syllabus-workflow";
import type { PointStatus } from "@/types/form18";
import { useEffect, useState } from "react";

const STATUS_STYLES: Record<PointStatus, string> = {
  open: "bg-amber-50 text-amber-800",
  responded: "bg-blue-50 text-blue-700",
  resolved: "bg-green-50 text-green-700",
  unresolved: "bg-red-50 text-red-700",
};
const STATUS_LABELS: Record<PointStatus, string> = {
  open: "Open",
  responded: "Answered",
  resolved: "Resolved",
  unresolved: "Unresolved",
};

type Group = { versionNo: number; stages: [number, Form18PointResponse[]][] };

/** Newest version first; within it, by stage, as listed by the API. */
export function groupPoints(points: readonly Form18PointResponse[]): Group[] {
  const byVersion = new Map<number, Map<number, Form18PointResponse[]>>();
  for (const point of points) {
    const stages = byVersion.get(point.version_no) ?? new Map();
    stages.set(point.stage, [...(stages.get(point.stage) ?? []), point]);
    byVersion.set(point.version_no, stages);
  }
  return [...byVersion.entries()]
    .sort(([a], [b]) => b - a)
    .map(([versionNo, stages]) => ({
      versionNo,
      stages: [...stages.entries()].sort(([a], [b]) => a - b),
    }));
}

type ReviewPointsHistoryProps = {
  syllabusId: string;
  /** Bump to refetch. */
  reloadKey: number;
};

/** Every Form 18-1 point across versions, read-only. */
export function ReviewPointsHistory({ syllabusId, reloadKey }: ReviewPointsHistoryProps) {
  const [points, setPoints] = useState<Form18PointResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);

    getForm18(syllabusId, controller.signal)
      .then((result) => setPoints(result.points))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
      });

    return () => controller.abort();
  }, [syllabusId, reloadKey, retryKey]);

  const groups = groupPoints(points ?? []);

  return (
    <section className="rounded-lg bg-white p-4 shadow ring-1 ring-black/5">
      <h2 className="text-base font-semibold text-gray-900">Review points</h2>
      <p className="mt-1 text-sm text-gray-600">
        Every Form 18-1 point, by the version it was raised on.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-3 flex items-center justify-between rounded-md bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}
      {!points && !error && <p className="mt-3 text-sm text-gray-500">Loading…</p>}
      {points && groups.length === 0 && (
        <p className="mt-3 text-sm text-gray-500">No review points yet.</p>
      )}

      {groups.map((group) => (
        <div key={group.versionNo} className="mt-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {group.versionNo > 0 ? `Version ${group.versionNo}` : "Unknown version"}
          </h3>
          {group.stages.map(([stage, inStage]) => (
            <div key={stage} className="mt-2">
              <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Stage {stage} · {CHAIN_ROLES[stage - 1]?.label}
              </h4>
              <ul className="mt-1 divide-y divide-gray-100">
                {inStage.map((point) => (
                  <li key={point.id} className="py-2 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      {point.code && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700">
                          {point.code}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[point.status]}`}
                      >
                        {STATUS_LABELS[point.status]}
                      </span>
                      {point.raised_by.name && (
                        <span className="text-xs text-gray-500">{point.raised_by.name}</span>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-line text-gray-900">{point.review_point}</p>
                    {point.remarks && (
                      <p className="mt-1 text-gray-600">Remarks: {point.remarks}</p>
                    )}
                    {point.action_taken && (
                      <p className="mt-1 rounded-md bg-gray-50 px-3 py-2 text-gray-700">
                        <span className="font-medium">Action taken:</span> {point.action_taken}
                        {point.page_number && ` (page ${point.page_number})`}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
