"use client";

import { listNeedsProxy } from "@/lib/review-queue-client";
import type { SyllabusResponse } from "@/lib/syllabus-client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SyllabusStatusBadge, termLabel } from "../syllabus/syllabus-status";

/**
 * Drafts the viewer may name a proxy for that can't be submitted without
 * one. Renders nothing when there are none.
 */
export function NeedsProxyPanel() {
  const [items, setItems] = useState<SyllabusResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    listNeedsProxy(controller.signal)
      .then((result) => setItems(result.items))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
      });

    return () => controller.abort();
  }, [reloadKey]);

  if (!error && items.length === 0) return null;

  return (
    <section className="mt-8 rounded-lg bg-white p-4 shadow ring-1 ring-amber-200">
      <h2 className="text-base font-semibold text-gray-900">Needs a proxy</h2>
      <p className="mt-1 text-sm text-gray-600">
        The program reviewer leads or co-authors these syllabi, so stage 1
        can&apos;t be reviewed until someone names a proxy from the
        program&apos;s faculty. Drafts are listed too, so it can be done early.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-3 flex items-center justify-between rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setReloadKey((k) => k + 1);
            }}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      <ul className="mt-3 divide-y divide-gray-100">
        {items.map((syllabus) => {
          const course = syllabus.expand?.course;
          const program = syllabus.expand?.program;
          return (
            <li
              key={syllabus.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
            >
              <div>
                <div className="flex items-center gap-2 font-medium text-gray-900">
                  {course ? `${course.code} — ${course.title}` : "Syllabus"}
                  <SyllabusStatusBadge status={syllabus.status} />
                </div>
                <div className="text-gray-600">
                  {program?.code ?? "—"} · {termLabel(syllabus.expand?.term)} ·
                  Lead: {syllabus.expand?.lead?.name || "—"}
                </div>
              </div>
              <Link
                href={`/syllabus/${syllabus.id}`}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Name a proxy
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
