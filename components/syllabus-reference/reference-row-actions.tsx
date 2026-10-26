"use client";

import {
  actOnReference,
  referenceActionsFor,
  type SyllabusReferenceResponse,
} from "@/lib/syllabus-reference-client";
import { useState } from "react";
import {
  ReferenceActionDialog,
  type DialogAction,
} from "./reference-action-dialog";

export type ReferenceViewer = {
  id: string;
  isAdmin: boolean;
  chairOfPrograms: readonly string[];
};

type ReferenceRowActionsProps = {
  row: SyllabusReferenceResponse;
  viewer: ReferenceViewer;
  onChanged: () => void;
  onError: (message: string) => void;
};

const ACTION_LABELS: Record<DialogAction, string> = {
  reject: "Reject",
  revoke: "Revoke",
  withdraw: "Withdraw",
};

/** The buttons a viewer gets for one reference. Approve runs inline. */
export function ReferenceRowActions({
  row,
  viewer,
  onChanged,
  onError,
}: ReferenceRowActionsProps) {
  const [approving, setApproving] = useState(false);
  const [dialog, setDialog] = useState<{
    open: boolean;
    action: DialogAction;
    key: number;
  }>({ open: false, action: "withdraw", key: 0 });

  const actions = referenceActionsFor(row, viewer);
  if (actions.length === 0) return null;

  async function approve() {
    setApproving(true);
    try {
      await actOnReference(row.id, { action: "approve" });
      onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setApproving(false);
    }
  }

  return (
    <>
      <div className="flex justify-end gap-4">
        {actions.includes("approve") && (
          <button
            type="button"
            onClick={approve}
            disabled={approving}
            className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
          >
            {approving ? "Approving…" : "Approve"}
          </button>
        )}
        {(["reject", "revoke", "withdraw"] as const)
          .filter((action) => actions.includes(action))
          .map((action) => (
            <button
              key={action}
              type="button"
              onClick={() =>
                setDialog((prev) => ({ open: true, action, key: prev.key + 1 }))
              }
              disabled={approving}
              className="font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
            >
              {ACTION_LABELS[action]}
            </button>
          ))}
      </div>

      <ReferenceActionDialog
        key={`action-${dialog.key}`}
        open={dialog.open}
        action={dialog.action}
        reference={row}
        onClose={() => setDialog((prev) => ({ ...prev, open: false }))}
        onDone={() => {
          setDialog((prev) => ({ ...prev, open: false }));
          onChanged();
        }}
      />
    </>
  );
}
