import type { Course } from "@/types/course";
import type { Prospectus } from "@/types/prospectus";
import type {
  ProspectusDuplicateInput,
  ProspectusDuplicateItem,
  ProspectusDuplicateResponse,
} from "@/types/prospectus-duplicate";
import {
  SEMESTERS,
  YEAR_LEVELS,
  type ProspectusItem,
} from "@/types/prospectus-item";
import type { SchoolYear } from "@/types/school-year";
import { randomInt } from "node:crypto";
import type PocketBase from "pocketbase";
import "server-only";

/** Must not exceed settings.batch.maxRequests (see pb_migrations/1793000006_updated_settings_batch.js). */
export const MAX_BATCH_REQUESTS = 500;

type SourceItem = ProspectusItem & { expand: { course: Course } };

export type DuplicatePlan = {
  input: ProspectusDuplicateInput;
  source: Prospectus;
  targetSchoolYear: SchoolYear;
  /** The existing target prospectus, or null when it must be created. */
  target: Prospectus | null;
  copy: SourceItem[];
  skip: SourceItem[];
};

/** Number of batch requests applyDuplicate() will send. */
export function batchSize(plan: DuplicatePlan): number {
  return plan.copy.length + (plan.target ? 0 : 1);
}

/**
 * Works out what a duplicate would do without writing anything. A missing
 * source prospectus or target school year throws PocketBase's 404.
 */
export async function planDuplicate(
  pb: PocketBase,
  input: ProspectusDuplicateInput,
): Promise<DuplicatePlan> {
  const [source, targetSchoolYear, targets] = await Promise.all([
    pb.collection("prospectuses").getFirstListItem<Prospectus>(
      pb.filter("program = {:program} && school_year = {:schoolYear}", {
        program: input.program,
        schoolYear: input.source_school_year,
      }),
      { expand: "program,school_year" },
    ),
    pb
      .collection("school_years")
      .getOne<SchoolYear>(input.target_school_year),
    pb.collection("prospectuses").getList<Prospectus>(1, 1, {
      skipTotal: true,
      filter: pb.filter("program = {:program} && school_year = {:schoolYear}", {
        program: input.program,
        schoolYear: input.target_school_year,
      }),
    }),
  ]);
  const target = targets.items[0] ?? null;

  const [sourceItems, targetItems] = await Promise.all([
    pb.collection("prospectus_items").getFullList<SourceItem>({
      filter: pb.filter("prospectus = {:id}", { id: source.id }),
      expand: "course",
      sort: "course.code",
    }),
    target
      ? pb.collection("prospectus_items").getFullList<ProspectusItem>({
          filter: pb.filter("prospectus = {:id}", { id: target.id }),
          fields: "course",
        })
      : Promise.resolve([]),
  ]);

  // Curriculum order. PocketBase would sort the select values alphabetically.
  sourceItems.sort(
    (a, b) =>
      YEAR_LEVELS.indexOf(a.year_level) - YEAR_LEVELS.indexOf(b.year_level) ||
      SEMESTERS.indexOf(a.semester) - SEMESTERS.indexOf(b.semester),
  );

  const present = new Set(targetItems.map((item) => item.course));
  return {
    input,
    source,
    targetSchoolYear,
    target,
    copy: sourceItems.filter((item) => !present.has(item.course)),
    skip: sourceItems.filter((item) => present.has(item.course)),
  };
}

function toItem(item: SourceItem): ProspectusDuplicateItem {
  const course = item.expand.course;
  return {
    course: { id: course.id, code: course.code, title: course.title },
    year_level: item.year_level,
    semester: item.semester,
  };
}

export function toProspectusDuplicateResponse(
  plan: DuplicatePlan,
): ProspectusDuplicateResponse {
  const program = plan.source.expand?.program;
  const schoolYear = plan.source.expand?.school_year;
  return {
    source: {
      id: plan.source.id,
      program: {
        id: plan.source.program,
        name: program?.name ?? "",
        code: program?.code ?? "",
      },
      school_year: {
        id: plan.source.school_year,
        label: schoolYear?.label ?? "",
      },
    },
    target_school_year: {
      id: plan.targetSchoolYear.id,
      label: plan.targetSchoolYear.label,
    },
    target: plan.target
      ? { id: plan.target.id, published: plan.target.published }
      : null,
    copy: plan.copy.map(toItem),
    skip: plan.skip.map(toItem),
  };
}

const ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

/** A PocketBase-style id, so the batch can reference a prospectus it creates. */
export function newRecordId(): string {
  let id = "";
  for (let i = 0; i < 15; i++) id += ID_CHARS[randomInt(ID_CHARS.length)];
  return id;
}

/**
 * Creates the target prospectus (unpublished) if needed and copies the
 * planned items as course references, all in one atomic batch. Returns the
 * target prospectus id. Unique indexes reject the whole batch on a race.
 */
export async function applyDuplicate(
  pb: PocketBase,
  plan: DuplicatePlan,
): Promise<string> {
  const batch = pb.createBatch();
  const targetId = plan.target?.id ?? newRecordId();

  if (!plan.target) {
    batch.collection("prospectuses").create({
      id: targetId,
      program: plan.input.program,
      school_year: plan.input.target_school_year,
      published: false,
    });
  }
  for (const item of plan.copy) {
    batch.collection("prospectus_items").create({
      prospectus: targetId,
      course: item.course,
      year_level: item.year_level,
      semester: item.semester,
    });
  }

  await batch.send();
  return targetId;
}
