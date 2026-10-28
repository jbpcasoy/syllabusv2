import { CHAIN_ROLES, type SyllabusStatus } from "@/lib/syllabus-workflow";
import type { AuditEntry, AuditQuery, AuditResponse } from "@/types/audit";
import type { Syllabus } from "@/types/syllabus";
import type { AppUser } from "@/types/user";
import type PocketBase from "pocketbase";
import "server-only";

/** Builds the audit_log filter; pb.filter() binds every value. */
export function auditFilter(pb: PocketBase, query: AuditQuery): string {
  const parts: string[] = [];
  if (query.action) parts.push(pb.filter("action = {:action}", { action: query.action }));
  if (query.actor) parts.push(pb.filter("actor = {:actor}", { actor: query.actor }));
  if (query.syllabus) {
    parts.push(pb.filter("syllabus = {:syllabus}", { syllabus: query.syllabus }));
  }
  if (query.override !== undefined) {
    parts.push(pb.filter("override = {:override}", { override: query.override }));
  }
  if (query.from) parts.push(pb.filter("created >= {:from}", { from: query.from }));
  if (query.to) parts.push(pb.filter("created < {:to}", { to: query.to }));
  return parts.join(" && ");
}

/** Syllabus labels ("BSIT · IT 101") and user names, by id. */
export interface AuditNames {
  syllabi: ReadonlyMap<string, string>;
  users: ReadonlyMap<string, string>;
}

const STATUS_LABELS: Record<SyllabusStatus, string> = {
  draft: "Draft",
  submitted: "In review",
  returned: "Returned",
  approved: "Approved",
  filed: "Filed",
};

const UPLOAD_LABELS: Record<string, string> = {
  version: "Syllabus version",
  signed_copy: "Signed copy",
  justification_scan: "Justification scan",
};

const str = (value: unknown) => (typeof value === "string" ? value : "");

function stateLabel(value: unknown): string {
  const state = (value ?? {}) as { status?: SyllabusStatus; stage?: number };
  const status = state.status ? STATUS_LABELS[state.status] : "";
  if (!status) return "?";
  const stage =
    state.status === "submitted" || state.status === "returned"
      ? CHAIN_ROLES[(state.stage ?? 0) - 1]?.label
      : undefined;
  return stage ? `${status} (${stage})` : status;
}

/** A one-line summary of the row's `data`, with names instead of ids. */
export function auditDetail(
  record: Pick<AuditEntry, "action" | "data">,
  users: ReadonlyMap<string, string>,
): string {
  const data = record.data ?? {};
  switch (record.action) {
    case "lead.transferred": {
      const name = (id: unknown) => users.get(str(id)) || "a removed user";
      const kept = data.keep_previous === false ? "" : ", previous lead kept as co-author";
      return `From ${name(data.from_lead)} to ${name(data.to_lead)}${kept}`;
    }
    case "file.uploaded":
      return UPLOAD_LABELS[str(data.kind)] ?? "File";
    default: {
      const change = `${stateLabel(data.from)} → ${stateLabel(data.to)}`;
      const code = str(data.approval_code);
      return code ? `${change} · ${code}` : change;
    }
  }
}

/** Names only, never emails. */
export function toAuditResponse(
  record: AuditEntry,
  names: AuditNames,
): AuditResponse {
  return {
    id: record.id,
    action: record.action,
    actor_name: record.expand?.actor?.name ?? "",
    syllabus: record.syllabus,
    syllabus_label: names.syllabi.get(record.syllabus) ?? "",
    detail: auditDetail(record, names.users),
    override: record.override,
    reason: record.reason,
    data: record.data,
    created: record.created,
  };
}

/** `field = id0 || field = id1 ...`, every id bound. */
function anyOf(pb: PocketBase, field: string, ids: string[]): string {
  return ids
    .map((id, i) => pb.filter(`${field} = {:v${i}}`, { [`v${i}`]: id }))
    .join(" || ");
}

/**
 * "BSIT · IT 101" for each syllabus still on file. A deleted syllabus has
 * no label; its id stays on the row.
 */
async function syllabusLabels(
  pb: PocketBase,
  ids: string[],
): Promise<Map<string, string>> {
  const labels = new Map<string, string>();
  if (ids.length === 0) return labels;
  const rows = await pb.collection("syllabi").getFullList<Syllabus>({
    expand: "course,program",
    fields: "id,expand.course.code,expand.program.code",
    filter: anyOf(pb, "id", ids),
  });
  for (const row of rows) {
    const parts = [row.expand?.program?.code, row.expand?.course?.code].filter(
      (part): part is string => !!part,
    );
    labels.set(row.id, parts.join(" · "));
  }
  return labels;
}

/** Names of the users a row's `data` mentions (lead transfers). */
async function userNames(
  pb: PocketBase,
  ids: string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const rows = await pb.collection("users").getFullList<AppUser>({
    fields: "id,name",
    filter: anyOf(pb, "id", ids),
  });
  return new Map(rows.map((user) => [user.id, user.name]));
}

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

/** One page of the audit log, newest first. */
export async function listAudit(
  pb: PocketBase,
  query: AuditQuery,
  page: number,
  perPage: number,
) {
  const result = await pb
    .collection("audit_log")
    .getList<AuditEntry>(page, perPage, {
      sort: "-created,-id",
      expand: "actor",
      fields:
        "id,action,actor,syllabus,override,reason,data,created,expand.actor.name",
      filter: auditFilter(pb, query),
    });
  const [syllabi, users] = await Promise.all([
    syllabusLabels(pb, unique(result.items.map((r) => r.syllabus))),
    userNames(
      pb,
      unique(
        result.items
          .filter((r) => r.action === "lead.transferred")
          .flatMap((r) => [str(r.data?.from_lead), str(r.data?.to_lead)]),
      ),
    ),
  ]);
  return {
    ...result,
    items: result.items.map((record) =>
      toAuditResponse(record, { syllabi, users }),
    ),
  };
}
