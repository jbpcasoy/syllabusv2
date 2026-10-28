"use client";

import {
  getForm18,
  getSyllabusTimeline,
  updateReviewPoint,
  type Form18PointResponse,
  type TimelineEntry,
} from "@/lib/syllabus-client";
import { CHAIN_ROLES } from "@/lib/syllabus-workflow";
import { Field, Input, Label, Textarea } from "@headlessui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { PdfPane } from "./pdf-pane";
import { ResubmitSyllabusDialog } from "./resubmit-syllabus-dialog";
import { termLabel } from "./syllabus-status";
import { UploadVersionModal } from "./upload-version-modal";
import { useSyllabusWorkspace } from "./use-syllabus-workspace";

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

/** Version number of the latest return, from the timeline. */
function lastReturnedVersionNo(entries: TimelineEntry[]): number | null {
  const returns = entries.filter((e) => e.kind === "returned");
  return returns[returns.length - 1]?.version_no ?? null;
}

/**
 * For the lead of a returned syllabus: the PDF beside each review point of
 * the returning stage, an Action Taken editor per point, the revision
 * upload and Resubmit. The server enforces every rule; the checklist only
 * explains why Resubmit is off.
 */
export function ReviseWorkspace({ id }: { id: string }) {
  const router = useRouter();
  const [reloadKey, setReloadKey] = useState(0);
  const { syllabus, versions, error } = useSyllabusWorkspace(id, reloadKey);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [points, setPoints] = useState<Form18PointResponse[] | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [sideError, setSideError] = useState<string | null>(null);
  const [upload, setUpload] = useState({ open: false, key: 0 });
  const [resubmit, setResubmit] = useState({ open: false, key: 0 });

  // Points and the timeline only change with this page's own actions.
  useEffect(() => {
    const controller = new AbortController();
    setSideError(null);

    Promise.all([
      getForm18(id, controller.signal),
      getSyllabusTimeline(id, controller.signal),
    ])
      .then(([form, history]) => {
        setPoints(form.points);
        setTimeline(history.items);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setSideError(err instanceof Error ? err.message : "Something went wrong");
      });

    return () => controller.abort();
  }, [id]);

  const hub = (
    <Link href={`/syllabus/${id}`} className="text-sm text-indigo-600 hover:text-indigo-500">
      ← Syllabus page
    </Link>
  );

  if (!syllabus) {
    return (
      <div>
        {hub}
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
          <p className="mt-4 text-sm text-gray-500">Loading…</p>
        )}
      </div>
    );
  }

  const course = syllabus.expand?.course;
  const stageLabel = CHAIN_ROLES[syllabus.stage - 1]?.label ?? "";
  const canRevise = syllabus.access === "lead" && syllabus.status === "returned";

  const returnedNo = lastReturnedVersionNo(timeline);
  const returned = versions.find((v) => v.version_no === returnedNo);
  const latest = versions[0];
  // PocketBase datetimes share one format, so they compare as strings.
  const hasRevision =
    !!latest && !!syllabus.returned_at && latest.created > syllabus.returned_at;
  const tags: Record<string, string> = {};
  if (returned) tags[returned.id] = "returned";
  if (hasRevision && latest) tags[latest.id] = "your revision";

  const atStage = (points ?? []).filter((p) => p.stage === syllabus.stage);
  const toAnswer = atStage.filter((p) => p.status === "open" || p.status === "responded");
  const settled = atStage.filter((p) => p.status === "resolved" || p.status === "unresolved");
  const unanswered = toAnswer.filter((p) => p.status === "open").length;
  const ready = hasRevision && points !== null && unanswered === 0;

  const replacePoint = (updated: Form18PointResponse) =>
    setPoints((prev) => prev?.map((p) => (p.id === updated.id ? updated : p)) ?? prev);

  return (
    <div>
      {hub}
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold text-gray-900">
          Revise {course ? `${course.code} — ${course.title}` : "syllabus"}
        </h1>
        <p className="text-sm text-gray-600">
          {syllabus.expand?.program?.code} · {termLabel(syllabus.expand?.term)}
        </p>
      </div>

      {!canRevise ? (
        <p className="mt-4 rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-700">
          {syllabus.status === "returned"
            ? "Only the lead can revise this syllabus."
            : "This syllabus isn't returned for revision."}{" "}
          <Link href={`/syllabus/${id}`} className="font-medium text-indigo-600 underline">
            See its page
          </Link>
          .
        </p>
      ) : (
        <div className="mt-4 grid gap-4 lg:h-[calc(100vh-12rem)] lg:grid-cols-2">
          <div className="lg:min-h-0">
            <PdfPane
              syllabusId={id}
              versions={versions}
              selectedId={versionId ?? returned?.id ?? null}
              onSelect={setVersionId}
              tags={tags}
            />
          </div>

          <div className="flex flex-col lg:min-h-0">
            <p className="text-sm text-gray-600">
              Returned at stage {syllabus.stage} ({stageLabel}). Upload a revised
              PDF and answer each point, then resubmit. It goes back to the
              same stage.
            </p>

            <ul className="mt-3 space-y-1 text-sm" aria-label="Before you resubmit">
              <Check done={hasRevision}>
                {hasRevision
                  ? `Revision uploaded (v${latest?.version_no})`
                  : "Upload a revised PDF"}
              </Check>
              <Check done={points !== null && unanswered === 0}>
                {points === null
                  ? "Loading review points…"
                  : `${toAnswer.length - unanswered} of ${toAnswer.length} points answered`}
              </Check>
            </ul>

            {sideError && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {sideError}
              </p>
            )}

            <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {toAnswer.map((point) => (
                <PointCard key={point.id} syllabusId={id} point={point} onSaved={replacePoint} />
              ))}
              {settled.length > 0 && (
                <details className="rounded-lg bg-gray-50 p-3 text-sm">
                  <summary className="cursor-pointer font-medium text-gray-700">
                    {settled.length} point{settled.length === 1 ? "" : "s"} already judged
                  </summary>
                  <ul className="mt-2 space-y-2">
                    {settled.map((point) => (
                      <li key={point.id} className="text-gray-700">
                        <span className="text-xs font-medium uppercase text-gray-500">
                          {point.status}
                        </span>{" "}
                        {point.review_point}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>

            <div className="sticky bottom-0 mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 bg-white py-3">
              {!ready && (
                <span className="mr-auto text-xs text-gray-500">
                  Resubmit opens once both items above are done.
                </span>
              )}
              <button
                type="button"
                onClick={() => setUpload((prev) => ({ open: true, key: prev.key + 1 }))}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Upload revision
              </button>
              <button
                type="button"
                disabled={!ready}
                onClick={() => setResubmit((prev) => ({ open: true, key: prev.key + 1 }))}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Resubmit
              </button>
            </div>
          </div>

          <UploadVersionModal
            key={`upload-${upload.key}`}
            open={upload.open}
            syllabusId={id}
            onClose={() => setUpload((prev) => ({ ...prev, open: false }))}
            onUploaded={() => {
              setUpload((prev) => ({ ...prev, open: false }));
              setVersionId(null);
              setReloadKey((k) => k + 1);
            }}
          />
          <ResubmitSyllabusDialog
            key={`resubmit-${resubmit.key}`}
            open={resubmit.open}
            syllabus={syllabus}
            onClose={() => setResubmit((prev) => ({ ...prev, open: false }))}
            onResubmitted={() => router.push(`/syllabus/${id}`)}
          />
        </div>
      )}
    </div>
  );
}

function Check({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <li className={done ? "text-green-700" : "text-gray-700"}>
      <span aria-hidden className="mr-1.5">
        {done ? "✓" : "○"}
      </span>
      <span className="sr-only">{done ? "Done: " : "To do: "}</span>
      {children}
    </li>
  );
}

/** One review point with its own Action Taken editor and save state. */
function PointCard({
  syllabusId,
  point,
  onSaved,
}: {
  syllabusId: string;
  point: Form18PointResponse;
  onSaved: (point: Form18PointResponse) => void;
}) {
  const [actionTaken, setActionTaken] = useState(point.action_taken);
  const [pageNumber, setPageNumber] = useState(point.page_number);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = actionTaken !== point.action_taken || pageNumber !== point.page_number;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!actionTaken.trim()) return setError("Describe the action taken.");
    setSaving(true);
    setError(null);
    try {
      onSaved(
        await updateReviewPoint(syllabusId, point.id, {
          action: "respond",
          action_taken: actionTaken,
          page_number: pageNumber,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span>
          Stage {point.stage} · {CHAIN_ROLES[point.stage - 1]?.label}
          {point.raised_by.name && ` · ${point.raised_by.name}`}
        </span>
        {point.code && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-700">
            {point.code}
          </span>
        )}
        <span
          className={`rounded-full px-2 py-0.5 font-medium ${
            point.status === "open" ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-blue-700"
          }`}
        >
          {point.status === "open" ? "Needs an answer" : "Answered"}
        </span>
      </div>
      <p className="mt-1 whitespace-pre-line text-sm text-gray-900">{point.review_point}</p>
      {point.remarks && <p className="mt-1 text-sm text-gray-600">Remarks: {point.remarks}</p>}

      <form onSubmit={handleSubmit} className="mt-2 grid gap-2 sm:grid-cols-[1fr_7rem]">
        <Field className="sm:col-span-1">
          <Label className="block text-xs font-medium text-gray-700">Action taken</Label>
          <Textarea
            rows={2}
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            disabled={saving}
            className={inputClass}
          />
        </Field>
        <Field>
          <Label className="block text-xs font-medium text-gray-700">Page number</Label>
          <Input
            value={pageNumber}
            onChange={(e) => setPageNumber(e.target.value)}
            disabled={saving}
            className={inputClass}
          />
        </Field>
        <div className="flex items-center justify-end gap-2 sm:col-span-2">
          {error && (
            <p role="alert" className="mr-auto text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={saving || !dirty}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Saving…" : point.status === "responded" ? "Update answer" : "Save answer"}
          </button>
        </div>
      </form>
    </article>
  );
}
