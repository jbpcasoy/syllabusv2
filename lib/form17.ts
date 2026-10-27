import { CURRENT_FORM17, form17Status, getForm17 } from "@/lib/forms";
import type {
  Form17AnswerRecord,
  Form17ChangeRecord,
  Form17Input,
  Form17Response,
} from "@/types/form17";
import type { SyllabusVersion } from "@/types/syllabus-version";
import type PocketBase from "pocketbase";
import "server-only";

type Batch = ReturnType<PocketBase["createBatch"]>;

type Version = Pick<SyllabusVersion, "id" | "version_no"> & {
  form17_suggestions?: string;
};

/** A PocketBase-style id, so a batch can create a row and refer to it. */
export function newRecordId(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(15));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function listForm17Answers(
  pb: PocketBase,
  versionId: string,
): Promise<Form17AnswerRecord[]> {
  return pb.collection("form17_answers").getFullList<Form17AnswerRecord>({
    expand: "last_edited_by",
    filter: pb.filter("version = {:versionId}", { versionId }),
  });
}

/** Complete and "No" flags for the workflow. */
export async function form17Facts(
  pb: PocketBase,
  versionId: string,
): Promise<{ complete: boolean; hasNo: boolean }> {
  const answers = await listForm17Answers(pb, versionId);
  const form = getForm17(answers[0]?.form_revision ?? "") ?? CURRENT_FORM17;
  const { complete, hasNo } = form17Status(form, answers);
  return { complete, hasNo };
}

/** The checklist of a version, with its change log. */
export async function loadForm17(
  pb: PocketBase,
  version: Version,
): Promise<Form17Response> {
  const [answers, changes] = await Promise.all([
    listForm17Answers(pb, version.id),
    pb.collection("form17_changes").getFullList<Form17ChangeRecord>({
      expand: "by,answer",
      sort: "created",
      filter: pb.filter("answer.version = {:versionId}", {
        versionId: version.id,
      }),
    }),
  ]);
  const revision = answers[0]?.form_revision ?? CURRENT_FORM17.revision;
  const form = getForm17(revision) ?? CURRENT_FORM17;
  const { complete, hasNo } = form17Status(form, answers);

  return {
    version: { id: version.id, version_no: version.version_no },
    form_revision: revision,
    answers: answers.map((a) => ({
      criterion: a.criterion,
      answer: a.answer,
      remarks: a.remarks,
      last_edited_by: {
        id: a.last_edited_by,
        name: a.expand?.last_edited_by?.name ?? "",
      },
      updated: a.updated,
    })),
    suggestions: version.form17_suggestions ?? "",
    complete,
    has_no: hasNo,
    changes: changes.map((c) => ({
      criterion: c.expand?.answer?.criterion ?? "",
      stage: c.stage,
      by: { id: c.by, name: c.expand?.by?.name ?? "" },
      from_answer: c.from_answer,
      to_answer: c.to_answer,
      from_remarks: c.from_remarks,
      to_remarks: c.to_remarks,
      created: c.created,
    })),
  };
}

export interface SaveForm17 {
  versionId: string;
  /** The stage of the reviewer saving; edits after stage 1 are logged. */
  stage: number;
  by: string;
  input: Form17Input;
}

/**
 * Upserts the listed answers (and the suggestions, when given) in one
 * batch. After stage 1 every real change also appends a form17_changes row.
 */
export async function saveForm17(
  pb: PocketBase,
  { versionId, stage, by, input }: SaveForm17,
): Promise<void> {
  const existing = await listForm17Answers(pb, versionId);
  const byCriterion = new Map(existing.map((a) => [a.criterion, a]));
  const batch = pb.createBatch();
  let writes = 0;

  for (const { criterion, answer, remarks } of input.answers) {
    const current = byCriterion.get(criterion);
    if (current && current.answer === answer && current.remarks === remarks) {
      continue;
    }
    const id = current?.id ?? newRecordId();
    if (current) {
      batch
        .collection("form17_answers")
        .update(id, { answer, remarks, last_edited_by: by });
    } else {
      batch.collection("form17_answers").create({
        id,
        version: versionId,
        criterion,
        answer,
        remarks,
        form_revision: CURRENT_FORM17.revision,
        last_edited_by: by,
      });
    }
    if (stage > 1) {
      batch.collection("form17_changes").create({
        answer: id,
        stage,
        by,
        from_answer: current?.answer ?? "",
        to_answer: answer,
        from_remarks: current?.remarks ?? "",
        to_remarks: remarks,
      });
    }
    writes++;
  }

  if (input.suggestions !== undefined) {
    batch
      .collection("syllabus_versions")
      .update(versionId, { form17_suggestions: input.suggestions });
    writes++;
  }

  if (writes > 0) await batch.send();
}

/**
 * Adds creates to `batch` that copy one version's answers and suggestions
 * to another, so reviewers re-check rather than start over. The copies
 * keep their form revision and last editor, and carry no change history.
 */
export function copyForm17(
  batch: Batch,
  from: { answers: Form17AnswerRecord[]; suggestions: string },
  toVersionId: string,
): void {
  for (const answer of from.answers) {
    batch.collection("form17_answers").create({
      version: toVersionId,
      criterion: answer.criterion,
      answer: answer.answer,
      remarks: answer.remarks,
      form_revision: answer.form_revision,
      last_edited_by: answer.last_edited_by,
    });
  }
  if (from.suggestions) {
    batch
      .collection("syllabus_versions")
      .update(toVersionId, { form17_suggestions: from.suggestions });
  }
}
