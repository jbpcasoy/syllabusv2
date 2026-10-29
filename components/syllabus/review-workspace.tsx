"use client";

import type { ReviewDecision } from "@/lib/syllabus-client";
import { CHAIN_ROLES } from "@/lib/syllabus-workflow";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Form17Panel } from "./form17-panel";
import { Form18Panel } from "./form18-panel";
import { PdfPane } from "./pdf-pane";
import { ReviewDecisionDialog } from "./review-decision-dialog";
import { StandInsPanel } from "./stand-ins-panel";
import { termLabel } from "./syllabus-status";
import { useSyllabusWorkspace } from "./use-syllabus-workspace";

const tabClass =
  "-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none data-focus:ring-2 data-focus:ring-indigo-600 data-selected:border-indigo-600 data-selected:text-indigo-700";

/** The PDF beside Forms 17 and 18-1, with Approve and Return. */
export function ReviewWorkspace({ id }: { id: string }) {
  const router = useRouter();
  const [reloadKey, setReloadKey] = useState(0);
  const { syllabus, versions, error } = useSyllabusWorkspace(id, reloadKey);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [decide, setDecide] = useState({
    open: false,
    key: 0,
    decision: "approve" as ReviewDecision,
  });

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

  const review = syllabus.review;
  const actorStage = review?.actorStage ?? null;
  const course = syllabus.expand?.course;
  const stageLabel = CHAIN_ROLES[syllabus.stage - 1]?.label ?? "";
  const openDecision = (decision: ReviewDecision) =>
    setDecide((prev) => ({ open: true, key: prev.key + 1, decision }));

  return (
    <div>
      {hub}
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold text-gray-900">
          {course ? `${course.code} — ${course.title}` : "Syllabus"}
        </h1>
        <p className="text-sm text-gray-600">
          {syllabus.expand?.program?.code} · {termLabel(syllabus.expand?.term)} · Lead:{" "}
          {syllabus.expand?.lead?.name || "—"}
        </p>
      </div>

      {!actorStage && review?.proxyNeeded && syllabus.status === "submitted" ? (
        <div className="mt-4">
          <p
            role="alert"
            className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            {syllabus.access === "lead" || syllabus.access === "coAuthor"
              ? "You lead or co-author this syllabus, so you can't review it."
              : "The program reviewer leads or co-authors this syllabus, so they can't review it."}{" "}
            {review.designatableStages.includes(1)
              ? "Name a proxy from the program's faculty below to review stage 1 in their place."
              : "Stage 1 waits until the program reviewer, the dean or a later-stage reviewer names a proxy."}
          </p>
          {review.designatableStages.includes(1) && (
            <div className="mt-4">
              <StandInsPanel
                syllabusId={id}
                designatableStages={[1]}
                onChanged={() => setReloadKey((k) => k + 1)}
              />
            </div>
          )}
        </div>
      ) : !actorStage ? (
        <p className="mt-4 rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-700">
          {syllabus.status === "submitted"
            ? `This syllabus is at stage ${syllabus.stage} (${stageLabel}) and isn't waiting on you. If a stand-in covers that stage, only they can decide.`
            : "This syllabus isn't in review right now."}{" "}
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
              selectedId={versionId}
              onSelect={setVersionId}
            />
          </div>

          <div className="flex flex-col lg:min-h-0">
            <p className="text-sm text-gray-600">
              Reviewing at stage {actorStage} ({stageLabel}
              {review?.actingAs === "proxy" && ", as proxy"}
              {review?.actingAs === "standIn" && ", as stand-in"}). Forms
              apply to the latest version.
            </p>
            <TabGroup className="mt-2 flex min-h-0 flex-1 flex-col">
              <TabList className="flex gap-1 border-b border-gray-200">
                <Tab className={tabClass}>Form 17</Tab>
                <Tab className={tabClass}>Form 18-1</Tab>
              </TabList>
              {/* Panels stay mounted so unsaved Form 17 edits survive a tab switch. */}
              <TabPanels className="mt-3 min-h-0 flex-1 overflow-y-auto">
                <TabPanel unmount={false}>
                  <Form17Panel key={`form17-${reloadKey}`} syllabusId={id} editable />
                </TabPanel>
                <TabPanel unmount={false}>
                  <Form18Panel
                    key={`form18-${reloadKey}`}
                    syllabusId={id}
                    status={syllabus.status}
                    stage={syllabus.stage}
                    actorStage={actorStage}
                  />
                </TabPanel>
              </TabPanels>
            </TabGroup>

            <div className="sticky bottom-0 mt-3 flex flex-wrap justify-end gap-2 border-t border-gray-200 bg-white py-3">
              <button
                type="button"
                onClick={() => openDecision("return")}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-amber-700 ring-1 ring-inset ring-amber-300 hover:bg-amber-50"
              >
                Return for revision
              </button>
              <button
                type="button"
                onClick={() => openDecision("approve")}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Approve
              </button>
            </div>
          </div>

          <ReviewDecisionDialog
            key={`decide-${decide.key}`}
            open={decide.open}
            syllabus={syllabus}
            decision={decide.decision}
            onClose={() => setDecide((prev) => ({ ...prev, open: false }))}
            onDecided={() => router.push("/review")}
          />
        </div>
      )}
    </div>
  );
}
