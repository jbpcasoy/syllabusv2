import { FORM17_REV04 } from "@/lib/forms/form17/rev04";
import { FORM18_REV01 } from "@/lib/forms/form18-1/rev01";
import type {
  ChecklistCriterion,
  ChecklistDefinition,
  LegendEntry,
  ReviewPointsDefinition,
} from "@/lib/forms/types";

export type * from "@/lib/forms/types";

/**
 * Every revision ever used, by revision. Add a new module and entry when
 * the university revises a form; never edit or remove an old one.
 */
const FORM17_REVISIONS: Record<string, ChecklistDefinition> = {
  [FORM17_REV04.revision]: FORM17_REV04,
};
const FORM18_REVISIONS: Record<string, ReviewPointsDefinition> = {
  [FORM18_REV01.revision]: FORM18_REV01,
};

/** The revisions new answers and points are recorded against. */
export const CURRENT_FORM17 = FORM17_REV04;
export const CURRENT_FORM18 = FORM18_REV01;

/** The Form 17 revision stored answers used, or null if unknown. */
export function getForm17(revision: string): ChecklistDefinition | null {
  return FORM17_REVISIONS[revision] ?? null;
}

/** The Form 18-1 revision stored points used, or null if unknown. */
export function getForm18(revision: string): ReviewPointsDefinition | null {
  return FORM18_REVISIONS[revision] ?? null;
}

/** Every criterion of a checklist, in printed order. */
export function checklistCriteria(
  form: ChecklistDefinition,
): ChecklistCriterion[] {
  return form.sections.flatMap((section) => section.criteria);
}

/** Every Part B code of a revision, in printed order. */
export function legendEntries(form: ReviewPointsDefinition): LegendEntry[] {
  return form.partB.legend.flatMap((group) => group.entries);
}

export function isLegendCode(
  form: ReviewPointsDefinition,
  code: string,
): boolean {
  return legendEntries(form).some((entry) => entry.code === code);
}

/**
 * Where a version's checklist stands: complete when every criterion of the
 * form is answered, and blocked from approval by any "No".
 */
export function form17Status(
  form: ChecklistDefinition,
  answers: readonly { criterion: string; answer: string }[],
): { complete: boolean; hasNo: boolean; missing: string[] } {
  const answered = new Set(answers.map((a) => a.criterion));
  const missing = checklistCriteria(form)
    .map((c) => c.key)
    .filter((key) => !answered.has(key));
  return {
    complete: missing.length === 0,
    hasNo: answers.some((a) => a.answer === "no"),
    missing,
  };
}

/**
 * The part a stage writes its points in: A for the Program Reviewer and
 * the Dean (stages 1 and 2), B for the FDIS Chair, CITL Director and VPAA.
 */
export function partForStage(stage: number): "A" | "B" {
  return stage <= 2 ? "A" : "B";
}
