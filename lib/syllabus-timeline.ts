import type { SyllabusEvent } from "@/types/syllabus-event";
import type { TimelineEntry } from "@/types/syllabus-timeline";
import type { AppUser } from "@/types/user";

type Named = { expand?: { [key: string]: Pick<AppUser, "name"> | undefined } };

export type TimelineVersion = {
  id: string;
  version_no: number;
  created: string;
  expand?: { uploaded_by?: Pick<AppUser, "name"> };
};

export type TimelineEvent = Pick<
  SyllabusEvent,
  "type" | "created" | "stage" | "version" | "approval_code" | "reason"
> & { expand?: { actor?: Pick<AppUser, "name"> } };

const name = (record: Named, key: string) => record.expand?.[key]?.name ?? "";

/**
 * One list, oldest first: the draft's creation, each PDF upload and each
 * workflow event. Pure: the route loads the rows. Ties keep that order, so
 * an upload sorts before an event stamped the same instant.
 */
export function buildTimeline(input: {
  createdAt: string;
  versions: readonly TimelineVersion[];
  events: readonly TimelineEvent[];
}): TimelineEntry[] {
  const versionNo = new Map(input.versions.map((v) => [v.id, v.version_no]));
  const entries: TimelineEntry[] = [
    {
      kind: "created",
      at: input.createdAt,
      stage: 0,
      version_no: null,
      actor_name: "",
      approval_code: "",
      reason: "",
    },
    ...input.versions.map(
      (v): TimelineEntry => ({
        kind: "uploaded",
        at: v.created,
        stage: 0,
        version_no: v.version_no,
        actor_name: name(v, "uploaded_by"),
        approval_code: "",
        reason: "",
      }),
    ),
    ...input.events.map(
      (e): TimelineEntry => ({
        kind: e.type,
        at: e.created,
        stage: e.stage,
        version_no: (e.version && versionNo.get(e.version)) || null,
        actor_name: name(e, "actor"),
        approval_code: e.approval_code ?? "",
        reason: e.reason ?? "",
      }),
    ),
  ];
  // PocketBase datetimes share one format, so they compare as strings.
  return entries.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
}
