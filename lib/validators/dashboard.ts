import {
  FINAL_STAGE,
  SYLLABUS_STATUSES,
  type SyllabusStatus,
} from "@/lib/syllabus-workflow";
import {
  EXPORT_VIEWS,
  JUSTIFICATION_STATES,
  type DashboardFilters,
  type ExportView,
  type JustificationState,
} from "@/types/dashboard";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;

export interface DashboardQuery {
  term: string;
  filters: DashboardFilters;
}

/**
 * ?term=<id>&college=<id>&department=<id>&program=<id>. The term is
 * required; the others narrow the scope and are optional ("" means none).
 */
export function parseDashboardQuery(
  params: URLSearchParams,
): ParseResult<DashboardQuery> {
  const term = params.get("term")?.trim() ?? "";
  if (!PB_ID.test(term)) {
    return { ok: false, error: "`term` must be a valid term id" };
  }

  const filters: DashboardFilters = {};
  for (const key of ["college", "department", "program"] as const) {
    const value = params.get(key)?.trim();
    if (!value) continue;
    if (!PB_ID.test(value)) {
      return { ok: false, error: `\`${key}\` must be a valid ${key} id` };
    }
    filters[key] = value;
  }

  return { ok: true, data: { term, filters } };
}

/** ?state=none|draft|submitted|returned, or "" / absent for all. */
export function parseJustificationState(
  value: string | null,
): ParseResult<JustificationState | undefined> {
  const state = value?.trim() ?? "";
  if (!state) return { ok: true, data: undefined };
  if (!(JUSTIFICATION_STATES as readonly string[]).includes(state)) {
    return {
      ok: false,
      error: `\`state\` must be one of: ${JUSTIFICATION_STATES.join(", ")}`,
    };
  }
  return { ok: true, data: state as JustificationState };
}

export interface SyllabusExportFilters {
  status?: SyllabusStatus;
  /** 1 to 5. */
  stage?: number;
  /** review: waiting past the term's review limit; submission: a draft past the deadline. */
  overdue?: "review" | "submission";
}

/** ?view=completion|syllabi|signed-copies|justifications */
export function parseExportView(value: string | null): ParseResult<ExportView> {
  const view = value?.trim() ?? "";
  if (!(EXPORT_VIEWS as readonly string[]).includes(view)) {
    return {
      ok: false,
      error: `\`view\` must be one of: ${EXPORT_VIEWS.join(", ")}`,
    };
  }
  return { ok: true, data: view as ExportView };
}

/** ?status=&stage=&overdue= for view=syllabi; each optional. */
export function parseSyllabusExportFilters(
  params: URLSearchParams,
): ParseResult<SyllabusExportFilters> {
  const filters: SyllabusExportFilters = {};

  const status = params.get("status")?.trim();
  if (status) {
    if (!(SYLLABUS_STATUSES as readonly string[]).includes(status)) {
      return {
        ok: false,
        error: `\`status\` must be one of: ${SYLLABUS_STATUSES.join(", ")}`,
      };
    }
    filters.status = status as SyllabusStatus;
  }

  const stage = params.get("stage")?.trim();
  if (stage) {
    const value = Number(stage);
    if (!Number.isInteger(value) || value < 1 || value > FINAL_STAGE) {
      return { ok: false, error: `\`stage\` must be 1 to ${FINAL_STAGE}` };
    }
    filters.stage = value;
  }

  const overdue = params.get("overdue")?.trim();
  if (overdue) {
    if (overdue !== "review" && overdue !== "submission") {
      return { ok: false, error: "`overdue` must be review or submission" };
    }
    filters.overdue = overdue;
  }

  return { ok: true, data: filters };
}
