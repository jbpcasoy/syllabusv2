"use client";

import { formatDate } from "@/lib/format-date";
import {
  getSyllabus,
  getSyllabusTimeline,
  startFromPrevious,
  type SyllabusResponse,
  type TimelineEntry,
} from "@/lib/syllabus-client";
import { CHAIN_ROLES } from "@/lib/syllabus-workflow";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReferenceViewer } from "../syllabus-reference/reference-row-actions";
import { CoAuthorsPanel } from "./co-authors-panel";
import { DeleteSyllabusDialog } from "./delete-syllabus-dialog";
import { Form17Panel } from "./form17-panel";
import { JustificationPanel } from "./justification-panel";
import { ReviewOverdueBadge, SubmissionOverdueBadge } from "./overdue-badge";
import { ReviewPointsHistory } from "./review-points-history";
import { SignedCopyPanel } from "./signed-copy-panel";
import { TransferLeadDialog } from "./transfer-lead-dialog";
import { StandInsPanel } from "./stand-ins-panel";
import { SubmitSyllabusDialog } from "./submit-syllabus-dialog";
import {
  ACCESS_LABELS,
  SyllabusStatusBadge,
  termLabel,
} from "./syllabus-status";
import { SyllabusReferencesPanel } from "./syllabus-references-panel";
import { SyllabusTimeline } from "./syllabus-timeline";
import { SyllabusVersions } from "./syllabus-versions";
import { UploadVersionModal } from "./upload-version-modal";

type SyllabusDetailProps = { id: string; viewer: ReferenceViewer };

/** "S1 returned", "S2 approved" per version number, oldest first. */
function decisionsByVersion(entries: TimelineEntry[] | null) {
  const map = new Map<number, string[]>();
  for (const e of entries ?? []) {
    if ((e.kind !== "approved" && e.kind !== "returned") || !e.version_no) continue;
    map.set(e.version_no, [...(map.get(e.version_no) ?? []), `S${e.stage} ${e.kind}`]);
  }
  return map;
}

type DialogState = { open: boolean; key: number };
const closed: DialogState = { open: false, key: 0 };
const opened = (prev: DialogState) => ({ open: true, key: prev.key + 1 });
const shut = <T extends DialogState>(prev: T): T => ({ ...prev, open: false });

export function SyllabusDetail({ id, viewer }: SyllabusDetailProps) {
  const router = useRouter();
  const [syllabus, setSyllabus] = useState<SyllabusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [versionsKey, setVersionsKey] = useState(0);
  const [versionCount, setVersionCount] = useState<number | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[] | null>(null);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [timelineRetry, setTimelineRetry] = useState(0);

  const [upload, setUpload] = useState(closed);
  const [submit, setSubmit] = useState(closed);
  const [remove, setRemove] = useState(closed);
  const [transfer, setTransfer] = useState(closed);
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

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

  // Uploads and transitions both add rows, so refetch on either.
  useEffect(() => {
    const controller = new AbortController();
    setTimelineError(null);

    getSyllabusTimeline(id, controller.signal)
      .then((result) => setTimeline(result.items))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setTimelineError(err instanceof Error ? err.message : "Something went wrong");
      });

    return () => controller.abort();
  }, [id, reloadKey, versionsKey, timelineRetry]);

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
  // A returned syllabus takes a new version and goes back to its stage.
  const revising = isLead && syllabus.status === "returned";
  const course = syllabus.expand?.course;
  const program = syllabus.expand?.program;
  const stageLabel = CHAIN_ROLES[syllabus.stage - 1]?.label ?? "";
  const review = syllabus.review;
  const showStandIns =
    syllabus.status !== "draft" || (review?.designatableStages.length ?? 0) > 0;
  const reload = () => setReloadKey((k) => k + 1);

  async function handleStartFromPrevious() {
    if (!syllabus) return;
    setCopying(true);
    setCopyError(null);
    try {
      await startFromPrevious(syllabus.id);
      setVersionsKey((k) => k + 1);
    } catch (err) {
      setCopyError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCopying(false);
    }
  }

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
            <SubmissionOverdueBadge
              term={syllabus.expand?.term}
              slot={{ syllabusStatus: syllabus.status, hasReference: false }}
            />
            <ReviewOverdueBadge syllabus={syllabus} term={syllabus.expand?.term} />
            <span>{program ? `${program.name} (${program.code})` : "—"}</span>
            <span>{termLabel(syllabus.expand?.term)}</span>
          </p>
          {syllabus.status !== "draft" && (
            <Link
              href={`/syllabus/${syllabus.id}/forms`}
              className="mt-1 inline-block text-sm text-indigo-600 hover:text-indigo-500"
            >
              Review forms (print view)
            </Link>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Lead: {syllabus.expand?.lead?.name || "—"}
            {syllabus.access && ` · You: ${ACCESS_LABELS[syllabus.access]}`}
            {syllabus.submitted_at &&
              ` · Submitted ${formatDate(syllabus.submitted_at)}`}
          </p>
          {syllabus.can_transfer_lead && syllabus.status !== "filed" && (
            <button
              type="button"
              onClick={() => setTransfer(opened)}
              className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Transfer lead
            </button>
          )}
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

        {revising && (
          <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
            <Link
              href={`/syllabus/${syllabus.id}/revise`}
              className="rounded-md bg-amber-700 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600"
            >
              Open revision workspace
            </Link>
          </div>
        )}
      </div>

      {editable && syllabus.based_on && versionCount === 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
          <span>
            This course had an approved syllabus last school year. Start from
            its latest PDF instead of uploading from scratch?
          </span>
          <button
            type="button"
            onClick={handleStartFromPrevious}
            disabled={copying}
            className="rounded-md bg-indigo-600 px-3 py-1.5 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {copying ? "Copying…" : "Start from last year's syllabus"}
          </button>
          {copyError && (
            <p role="alert" className="w-full text-red-600">
              {copyError}
            </p>
          )}
        </div>
      )}

      {syllabus.access === "referencer" && (
        <p className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          Your program references this syllabus, so you can view it and its
          PDFs. Only its lead can change it.
        </p>
      )}

      {syllabus.status === "submitted" && (
        <p className="mt-4 rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-800">
          In review at stage {syllabus.stage} ({stageLabel}). It is read-only
          while it goes through the review chain.
        </p>
      )}

      {syllabus.status === "returned" && (
        <p className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Returned for revision at stage {syllabus.stage} ({stageLabel})
          {syllabus.returned_at && ` on ${formatDate(syllabus.returned_at)}`}.
          {revising &&
            " Open the revision workspace to upload a revised PDF, answer the review points and resubmit."}
        </p>
      )}

      {syllabus.status === "approved" && (
        <p className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          Approved by every reviewer. It is ready for wet signing.
        </p>
      )}

      {syllabus.status === "filed" && (
        <p className="mt-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Filed: the signed copy is on record.
        </p>
      )}

      {review?.actorStage && (
        <section className="mt-6 rounded-lg bg-white p-4 shadow ring-1 ring-indigo-200">
          <h2 className="text-base font-semibold text-gray-900">Your review</h2>
          <p className="mt-1 text-sm text-gray-600">
            This syllabus is waiting on you at stage {review.actorStage} (
            {stageLabel}
            {review.actingAs === "proxy" && ", as proxy"}
            {review.actingAs === "standIn" && ", as stand-in"}).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/syllabus/${syllabus.id}/review`}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Open review workspace
            </Link>
          </div>
        </section>
      )}

      <div className="mt-6">
        <SyllabusTimeline
          syllabus={syllabus}
          entries={timeline}
          error={timelineError}
          onRetry={() => setTimelineRetry((k) => k + 1)}
        />
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-base font-semibold text-gray-900">
          PDF versions
        </h2>
        <SyllabusVersions
          syllabusId={syllabus.id}
          reloadKey={versionsKey}
          onCountChange={setVersionCount}
          decisions={decisionsByVersion(timeline)}
        />
      </section>

      {(syllabus.status === "approved" || syllabus.status === "filed") && (
        <div className="mt-6">
          <SignedCopyPanel
            key={`signed-${reloadKey}`}
            syllabusId={syllabus.id}
            status={syllabus.status}
            isLead={isLead}
            canReturn={!!syllabus.can_return_signed_copy}
            onChanged={reload}
          />
        </div>
      )}

      {(syllabus.status === "approved" || syllabus.status === "filed") &&
        syllabus.access !== "referencer" && (
          <div className="mt-6">
            <JustificationPanel key={`justification-${reloadKey}`} syllabusId={syllabus.id} />
          </div>
        )}

      {syllabus.status !== "draft" && (
        <>
          {/* Read-only here: reviewers edit in /review, the lead answers in /revise. */}
          <div className="mt-6">
            <ReviewPointsHistory syllabusId={syllabus.id} reloadKey={reloadKey} />
          </div>
          <div className="mt-6">
            <Form17Panel
              key={`form17-${reloadKey}`}
              syllabusId={syllabus.id}
              editable={false}
            />
          </div>
        </>
      )}

      <div className="mt-6">
        <CoAuthorsPanel
          syllabus={syllabus}
          editable={editable}
          onChanged={setSyllabus}
        />
      </div>

      {showStandIns && (
        <div className="mt-6">
          <StandInsPanel
            syllabusId={syllabus.id}
            designatableStages={review?.designatableStages ?? []}
            onChanged={reload}
          />
        </div>
      )}

      {(isLead || syllabus.access === "admin") && (
        <div className="mt-6">
          <SyllabusReferencesPanel syllabusId={syllabus.id} viewer={viewer} />
        </div>
      )}

      {editable && (
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
      )}

      {syllabus.can_transfer_lead && (
        <TransferLeadDialog
          key={`transfer-${transfer.key}`}
          open={transfer.open}
          syllabus={syllabus}
          onClose={() => setTransfer(shut)}
          onTransferred={() => {
            setTransfer(shut);
            reload();
          }}
        />
      )}

      {editable && (
        <>
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
