import { anyOf } from "@/lib/syllabus";
import { eligibleAuthors, editError } from "@/lib/syllabus-justification";
import { findPreviousSyllabus } from "@/lib/syllabus-previous";
import type { Justification, JustificationResponse } from "@/types/justification";
import type { Syllabus, SyllabusAccess } from "@/types/syllabus";
import type { Term } from "@/types/term";
import type { AppUser } from "@/types/user";
import type PocketBase from "pocketbase";
import "server-only";

/** Referencing programs never see the justification. */
export function canViewJustification(access: SyllabusAccess | null): boolean {
  return (
    access === "lead" ||
    access === "coAuthor" ||
    access === "reviewer" ||
    access === "admin"
  );
}

/**
 * The syllabus's based_on, looking it up (and saving it) when empty: for
 * syllabi created before based_on existed, or whose previous syllabus was
 * approved after they were created.
 */
export async function ensureBasedOn(
  pb: PocketBase,
  syllabus: Pick<Syllabus, "id" | "course" | "program" | "term" | "based_on">,
): Promise<string> {
  if (syllabus.based_on) return syllabus.based_on;
  const term = await pb
    .collection("terms")
    .getOne<Term>(syllabus.term, { expand: "school_year" });
  const previous = await findPreviousSyllabus(pb, {
    course: syllabus.course,
    program: syllabus.program,
    semester: term.semester,
    schoolYearLabel: term.expand?.school_year?.label ?? "",
  });
  if (!previous) return "";
  await pb.collection("syllabi").update(syllabus.id, { based_on: previous.id });
  return previous.id;
}

export async function findJustification(
  pb: PocketBase,
  syllabusId: string,
): Promise<Justification | null> {
  const result = await pb
    .collection("syllabus_justifications")
    .getList<Justification>(1, 1, {
      skipTotal: true,
      expand: "returned_by",
      filter: pb.filter("syllabus = {:syllabusId}", { syllabusId }),
    });
  return result.items[0] ?? null;
}

/** Display names by user id. */
export async function userNames(
  pb: PocketBase,
  ids: readonly string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const users = await pb.collection("users").getFullList<AppUser>({
    fields: "id,name",
    filter: anyOf(pb, "id", unique, "u"),
  });
  return new Map(users.map((u) => [u.id, u.name]));
}

/** The name of an active holder of an assignment collection, or "". */
export async function activeHolderName(
  pb: PocketBase,
  collection: "citl_directors" | "program_chairs",
  programId?: string,
): Promise<string> {
  const result = await pb
    .collection(collection)
    .getList<{ expand?: { user?: AppUser } }>(1, 1, {
      skipTotal: true,
      expand: "user",
      filter: programId
        ? pb.filter("active = true && program = {:programId}", { programId })
        : "active = true",
    });
  return result.items[0]?.expand?.user?.name ?? "";
}

/**
 * Everything the panel needs: whether a previous syllabus applies, who may
 * be named, the justification, and what the caller may do.
 */
export async function loadJustificationResponse(
  pb: PocketBase,
  syllabus: Syllabus,
  caller: { access: SyllabusAccess; canReturn: boolean },
): Promise<JustificationResponse> {
  const basedOn = await ensureBasedOn(pb, syllabus);
  const [previous, record] = await Promise.all([
    basedOn
      ? pb
          .collection("syllabi")
          .getOne<Pick<Syllabus, "lead" | "co_authors">>(basedOn, {
            fields: "lead,co_authors",
          })
      : null,
    findJustification(pb, syllabus.id),
  ]);
  const eligible = previous ? eligibleAuthors(previous, syllabus) : [];
  const names = await userNames(pb, [
    ...eligible,
    ...(record?.entries ?? []).map((e) => e.author),
  ]);
  const name = (id: string) => ({ id, name: names.get(id) ?? "" });

  return {
    applies: !!previous,
    eligible_authors: eligible.map(name),
    justification: record && {
      id: record.id,
      status: record.status,
      entries: (record.entries ?? []).map((e) => ({
        author: name(e.author),
        reason: e.reason,
      })),
      has_scan: !!record.scan,
      submitted_at: record.submitted_at,
      return_reason: record.return_reason,
      returned_by: record.returned_by
        ? {
            id: record.returned_by,
            name: record.expand?.returned_by?.name ?? "",
          }
        : null,
      returned_at: record.returned_at,
      updated: record.updated,
    },
    can_edit:
      caller.access === "lead" &&
      !!previous &&
      !editError(syllabus.status, record?.status ?? null),
    can_return: caller.canReturn,
  };
}
