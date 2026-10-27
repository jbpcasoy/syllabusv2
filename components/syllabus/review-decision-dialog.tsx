"use client";

import {
  reviewSyllabus,
  type ReviewDecision,
  type ReviewResult,
  type SyllabusResponse,
} from "@/lib/syllabus-client";
import { CHAIN_ROLES } from "@/lib/syllabus-workflow";
import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useState } from "react";

type ReviewDecisionDialogProps = {
  open: boolean;
  syllabus: SyllabusResponse;
  decision: ReviewDecision;
  onClose: () => void;
  /** Called once the reviewer has seen the outcome. */
  onDecided: (result: ReviewResult) => void;
};

export function ReviewDecisionDialog({
  open,
  syllabus,
  decision,
  onClose,
  onDecided,
}: ReviewDecisionDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReviewResult | null>(null);

  const stageLabel = CHAIN_ROLES[syllabus.stage - 1]?.label ?? "";
  const course = syllabus.expand?.course?.code || "this syllabus";
  const approve = decision === "approve";

  async function handleConfirm() {
    setSaving(true);
    setError(null);
    try {
      const decided = await reviewSyllabus(syllabus.id, decision);
      // Approvals show their code before closing; returns close at once.
      if (decided.review.approval_code) {
        setResult(decided);
        setSaving(false);
      } else {
        onDecided(decided);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? () => {} : result ? () => onDecided(result) : onClose}
      className="relative z-50"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-900/50 transition-opacity duration-200 data-closed:opacity-0"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl transition duration-200 data-closed:scale-95 data-closed:opacity-0"
        >
          {result ? (
            <>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Approved
              </DialogTitle>
              <Description className="mt-2 text-sm text-gray-600">
                Write this approval code beside your signature on the paper
                form:
              </Description>
              <p className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-center font-mono text-lg font-semibold tracking-wide text-gray-900">
                {result.review.approval_code}
              </p>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => onDecided(result)}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Done
                </button>
              </div>
            </>
          ) : (
            <>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                {approve ? "Approve" : "Return for revision"}
              </DialogTitle>
              <Description className="mt-2 text-sm text-gray-600">
                {approve ? (
                  <>
                    Approve{" "}
                    <span className="font-medium text-gray-900">{course}</span>{" "}
                    at stage {syllabus.stage} ({stageLabel})? It moves on to
                    the next reviewer, and you get an approval code for your
                    signature.
                  </>
                ) : (
                  <>
                    Return{" "}
                    <span className="font-medium text-gray-900">{course}</span>{" "}
                    to its lead? They revise it against your Form 18-1 review
                    points and resubmit, and it comes back to you at stage{" "}
                    {syllabus.stage}.
                  </>
                )}
              </Description>

              {error && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={saving}
                  className={`rounded-md px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                    approve
                      ? "bg-indigo-600 hover:bg-indigo-500"
                      : "bg-amber-600 hover:bg-amber-500"
                  }`}
                >
                  {saving ? "Saving…" : approve ? "Approve" : "Return"}
                </button>
              </div>
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
