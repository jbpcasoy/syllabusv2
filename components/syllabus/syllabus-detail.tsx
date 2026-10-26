"use client";

import { formatDate } from "@/lib/format-date";
import { getSyllabus, type SyllabusResponse } from "@/lib/syllabus-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReferenceViewer } from "../syllabus-reference/reference-row-actions";
import { CoAuthorsPanel } from "./co-authors-panel";
import { DeleteSyllabusDialog } from "./delete-syllabus-dialog";
import { SubmitSyllabusDialog } from "./submit-syllabus-dialog";
import {
  ACCESS_LABELS,
  SyllabusStatusBadge,
  termLabel,
} from "./syllabus-status";
import { SyllabusReferencesPanel } from "./syllabus-references-panel";
import { SyllabusVersions } from "./syllabus-versions";
import { UploadVersionModal } from "./upload-version-modal";

type SyllabusDetailProps = { id: string; viewer: ReferenceViewer };

type DialogState = { open: boolean; key: number };
const closed: DialogState = { open: false, key: 0 };
const opened = (prev: DialogState) => ({ open: true, key: prev.key + 1 });
const shut = (prev: DialogState) => ({ ...prev, open: false });

export function SyllabusDetail({ id, viewer }: SyllabusDetailProps) {
  const router = useRouter();
  const [syllabus, setSyllabus] = useState<SyllabusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [versionsKey, setVersionsKey] = useState(0);
  const [versionCount, setVersionCount] = useState<number | null>(null);

  const [upload, setUpload] = useState(closed);
  const [submit, setSubmit] = useState(closed);
  const [remove, setRemove] = useState(closed);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getSyllabus(id, controller.signal)
      .then((result) => {
        setSyllabus(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      });

    return () => controller.abort();
  }, [id, reloadKey]);

  if (!syllabus) {
    return (
      <div>
        <Link href="/syllabus" className="text-sm text-indigo-600 hover:text-indigo-500">
          ← My syllabi
        </Link>
        {error ? (
          <div
            role="alert"
            className="mt-4 flex items-center justify-between rounded-md bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>
              {error === "Not found"
                ? "This syllabus doesn't exist or you don't have access to it."
                : error}
            </span>
            {error !== "Not found" && (
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="font-medium underline"
              >
                Retry
              </button>
            )}
          </div>
        ) : (
          loading && <p className="mt-4 text-sm text-gray-500">Loading…</p>
        )}
      </div>
    );
  }

  const isLead = syllabus.access === "lead";
  const editable = isLead && syllabus.status === "draft";
  const course = syllabus.expand?.course;
  const program = syllabus.expand?.program;

  return (
    <div>
      <Link href="/syllabus" className="text-sm text-indigo-600 hover:text-indigo-500">
        ← My syllabi
      </Link>

      <div className="mt-2 sm:flex sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {course ? `${course.code} — ${course.title}` : "Syllabus"}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
            <SyllabusStatusBadge status={syllabus.status} />
            <span>{program ? `${program.name} (${program.code})` : "—"}</span>
            <span>{termLabel(syllabus.expand?.term)}</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Lead: {syllabus.expand?.lead?.name || "—"}
            {syllabus.access && ` · You: ${ACCESS_LABELS[syllabus.access]}`}
            {syllabus.submitted_at &&
              ` · Submitted ${formatDate(syllabus.submitted_at)}`}
          </p>
        </div>

        {editable && (
          <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
            <button
              type="button"
              onClick={() => setUpload(opened)}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Upload new version
            </button>
            <button
              type="button"
              onClick={() => setSubmit(opened)}
              disabled={versionCount === 0}
              title={versionCount === 0 ? "Upload a PDF first" : undefined}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit for review
            </button>
            <button
              type="button"
              onClick={() => setRemove(opened)}
              className="rounded-md px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Delete draft
            </button>
          </div>
        )}
      </div>

      {syllabus.access === "referencer" && (
        <p className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          Your program references this syllabus, so you can view it and its
          PDFs. Only its lead can change it.
        </p>
      )}

      {syllabus.status === "submitted" && (
        <p className="mt-4 rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Submitted for review. It is read-only while it goes through the
          review chain.
        </p>
      )}

      <section className="mt-6">
        <h2 className="mb-2 text-base font-semibold text-gray-900">
          PDF versions
        </h2>
        <SyllabusVersions
          syllabusId={syllabus.id}
          reloadKey={versionsKey}
          onCountChange={setVersionCount}
        />
      </section>

      <div className="mt-6">
        <CoAuthorsPanel
          syllabus={syllabus}
          editable={editable}
          onChanged={setSyllabus}
        />
      </div>

      {(isLead || syllabus.access === "admin") && (
        <div className="mt-6">
          <SyllabusReferencesPanel syllabusId={syllabus.id} viewer={viewer} />
        </div>
      )}

      {editable && (
        <>
          <UploadVersionModal
            key={`upload-${upload.key}`}
            open={upload.open}
            syllabusId={syllabus.id}
            onClose={() => setUpload(shut)}
            onUploaded={() => {
              setUpload(shut);
              setVersionsKey((k) => k + 1);
            }}
          />
          <SubmitSyllabusDialog
            key={`submit-${submit.key}`}
            open={submit.open}
            syllabus={syllabus}
            onClose={() => setSubmit(shut)}
            onSubmitted={(updated) => {
              setSubmit(shut);
              setSyllabus(updated);
            }}
          />
          <DeleteSyllabusDialog
            key={`delete-${remove.key}`}
            open={remove.open}
            syllabus={syllabus}
            onClose={() => setRemove(shut)}
            onDeleted={() => router.push("/syllabus")}
          />
        </>
      )}
    </div>
  );
}
