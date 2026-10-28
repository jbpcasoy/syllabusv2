"use client";

import {
  CURRENT_FORM18,
  getForm18 as formDefinition,
  partForStage,
} from "@/lib/forms";
import {
  createReviewPoint,
  deleteReviewPoint,
  getForm18,
  updateReviewPoint,
  type Form18PointResponse,
  type Form18Response,
  type PointInput,
  type SyllabusStatus,
} from "@/lib/syllabus-client";
import { CHAIN_ROLES } from "@/lib/syllabus-workflow";
import type { PointStatus } from "@/types/form18";
import { Field, Input, Label, Select, Textarea } from "@headlessui/react";
import { useEffect, useState, type FormEvent } from "react";

type Form18PanelProps = {
  syllabusId: string;
  status: SyllabusStatus;
  /** The syllabus's current (or returning) stage. */
  stage: number;
  /** The stage the viewer may decide now, or null. */
  actorStage: number | null;
};

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

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";
const smallButton =
  "rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50";

/**
 * Form 18-1 (CITL-F-018) for the reviewer: raise, edit and judge points.
 * The lead answers them in the revision workspace (revise-workspace.tsx).
 */
export function Form18Panel({
  syllabusId,
  status,
  stage,
  actorStage,
}: Form18PanelProps) {
  const [data, setData] = useState<Form18Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getForm18(syllabusId, controller.signal)
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
  }, [syllabusId, reloadKey]);

  /** Runs a change, then reloads the list. Returns false on failure. */
  async function run(change: () => Promise<unknown>): Promise<boolean> {
    setBusy(true);
    setActionError(null);
    try {
      await change();
      setEditing(null);
      setReloadKey((k) => k + 1);
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const form = (data && formDefinition(data.form_revision)) ?? CURRENT_FORM18;
  const points = data?.points ?? [];
  const reviewing = status === "submitted" && actorStage === stage;

  return (
    <section className="rounded-lg bg-white p-4 shadow ring-1 ring-black/5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900">
          Form 18-1: Review Points and Action Taken
        </h2>
        <span className="text-xs text-gray-500">
          {form.code} · Rev {form.revision}
        </span>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-3 flex items-center justify-between rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}
      {actionError && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {actionError}
        </p>
      )}

      <div className={loading ? "opacity-50" : ""}>
        {(["A", "B"] as const).map((part) => {
          const inPart = points.filter((p) => p.part === part);
          return (
            <div key={part} className="mt-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Part {part}.{" "}
                {part === "A" ? form.partA.title : form.partB.title}
              </h3>
              {inPart.length === 0 ? (
                <p className="mt-1 text-sm text-gray-500">No review points.</p>
              ) : (
                <ul className="mt-2 divide-y divide-gray-100">
                  {inPart.map((point) => (
                    <PointRow
                      key={point.id}
                      syllabusId={syllabusId}
                      point={point}
                      busy={busy}
                      editing={editing === point.id}
                      canReview={reviewing && point.stage === stage}
                      onEdit={() => setEditing(point.id)}
                      onCancel={() => setEditing(null)}
                      run={run}
                    />
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {reviewing && (
        <NewPointForm
          key={reloadKey}
          stage={stage}
          busy={busy}
          onAdd={(input) => run(() => createReviewPoint(syllabusId, input))}
        />
      )}
    </section>
  );
}

type PointRowProps = {
  syllabusId: string;
  point: Form18PointResponse;
  busy: boolean;
  editing: boolean;
  /** The viewer reviews the point's stage now. */
  canReview: boolean;
  onEdit: () => void;
  onCancel: () => void;
  run: (change: () => Promise<unknown>) => Promise<boolean>;
};

function PointRow({
  syllabusId,
  point,
  busy,
  editing,
  canReview,
  onEdit,
  onCancel,
  run,
}: PointRowProps) {
  const update = (input: Parameters<typeof updateReviewPoint>[2]) =>
    run(() => updateReviewPoint(syllabusId, point.id, input));

  return (
    <li className="py-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">
          Stage {point.stage} · {CHAIN_ROLES[point.stage - 1]?.label}
          {point.raised_by.name && ` · ${point.raised_by.name}`}
        </span>
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
      </div>

      {editing ? (
        <PointForm
          stage={point.stage}
          initial={point}
          busy={busy}
          submitLabel="Save"
          onSubmit={(input) => update({ action: "edit", ...input })}
          onCancel={onCancel}
        />
      ) : (
        <>
          <p className="mt-1 whitespace-pre-line text-gray-900">
            {point.review_point}
          </p>
          {point.remarks && (
            <p className="mt-1 text-gray-600">Remarks: {point.remarks}</p>
          )}
          {point.action_taken && (
            <p className="mt-1 rounded-md bg-gray-50 px-3 py-2 text-gray-700">
              <span className="font-medium">Action taken:</span>{" "}
              {point.action_taken}
              {point.page_number && ` (page ${point.page_number})`}
            </p>
          )}
        </>
      )}

      {canReview && !editing && (
        <div className="mt-2 flex flex-wrap gap-2">
          {point.status === "open" ? (
            <>
              <button type="button" onClick={onEdit} disabled={busy} className={smallButton}>
                Edit
              </button>
              <button
                type="button"
                onClick={() => run(() => deleteReviewPoint(syllabusId, point.id))}
                disabled={busy}
                className={`${smallButton} text-red-600`}
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => update({ action: "judge", status: "resolved" })}
                disabled={busy || point.status === "resolved"}
                className={`${smallButton} text-green-700`}
              >
                Resolved
              </button>
              <button
                type="button"
                onClick={() => update({ action: "judge", status: "unresolved" })}
                disabled={busy || point.status === "unresolved"}
                className={`${smallButton} text-red-700`}
              >
                Unresolved
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

type PointFormProps = {
  stage: number;
  initial?: Pick<PointInput, "review_point" | "code" | "remarks">;
  busy: boolean;
  submitLabel: string;
  onSubmit: (input: PointInput) => Promise<boolean>;
  onCancel?: () => void;
};

/** Raise or edit a point. Part B (stages 3 to 5) picks a legend code. */
function PointForm({
  stage,
  initial,
  busy,
  submitLabel,
  onSubmit,
  onCancel,
}: PointFormProps) {
  const [reviewPoint, setReviewPoint] = useState(initial?.review_point ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [remarks, setRemarks] = useState(initial?.remarks ?? "");
  const [error, setError] = useState<string | null>(null);
  const partB = partForStage(stage) === "B";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!reviewPoint.trim()) return setError("Write the review point.");
    if (partB && !code) return setError("Pick a code from the legend.");
    setError(null);
    await onSubmit({ review_point: reviewPoint, code, remarks });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2">
      {partB && (
        <Field>
          <Label className="block text-xs font-medium text-gray-700">
            Legend code
          </Label>
          <Select
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={busy}
            className={inputClass}
          >
            <option value="">Select a code…</option>
            {CURRENT_FORM18.partB.legend.map((group) => (
              <optgroup key={group.key} label={`${group.key}. ${group.title}`}>
                {group.entries.map((entry) => (
                  <option key={entry.code} value={entry.code}>
                    {entry.code} {entry.text}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>
      )}
      <Field>
        <Label className="block text-xs font-medium text-gray-700">
          Review point
        </Label>
        <Textarea
          rows={2}
          value={reviewPoint}
          onChange={(e) => setReviewPoint(e.target.value)}
          disabled={busy}
          className={inputClass}
        />
      </Field>
      <Field>
        <Label className="block text-xs font-medium text-gray-700">
          Remarks (optional)
        </Label>
        <Input
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          disabled={busy}
          className={inputClass}
        />
      </Field>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={busy} className={smallButton}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function NewPointForm({
  stage,
  busy,
  onAdd,
}: {
  stage: number;
  busy: boolean;
  onAdd: (input: PointInput) => Promise<boolean>;
}) {
  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <h3 className="text-sm font-semibold text-gray-900">
        Add a review point (Part {partForStage(stage)})
      </h3>
      <PointForm stage={stage} busy={busy} submitLabel="Add point" onSubmit={onAdd} />
    </div>
  );
}
