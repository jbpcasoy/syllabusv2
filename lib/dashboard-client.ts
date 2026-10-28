import type {
  DashboardFilters,
  DashboardScopeResponse,
  DashboardSummary,
  ExportView,
  JustificationRow,
  JustificationState,
  SignedCopyRow,
} from "@/types/dashboard";
import type { ListResult } from "pocketbase";

export type {
  CompletionRow,
  DashboardCounts,
  DashboardFilters,
  DashboardScopeResponse,
  DashboardSummary,
  JustificationRow,
  JustificationState,
  ProgramOrg,
  SignedCopyRow,
} from "@/types/dashboard";

/** The term plus the optional scope filters every dashboard call takes. */
export type DashboardParams = DashboardFilters & { term: string };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof data.error === "string"
      ) {
        message = data.error;
      }
    } catch {
      // body wasn't JSON; keep the default message
    }
    throw new Error(message);
  }

  return (res.status === 204 ? undefined : await res.json()) as T;
}

function query(params: DashboardParams, extra: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams({ term: params.term });
  if (params.college) qs.set("college", params.college);
  if (params.department) qs.set("department", params.department);
  if (params.program) qs.set("program", params.program);
  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  return qs;
}

export function getDashboardScope(signal?: AbortSignal) {
  return request<DashboardScopeResponse>("/api/dashboard/scope", { signal });
}

export function getDashboardSummary(params: DashboardParams, signal?: AbortSignal) {
  return request<DashboardSummary>(`/api/dashboard/summary?${query(params)}`, {
    signal,
  });
}

export function listSignedCopies(
  params: DashboardParams & { page: number; perPage: number },
  signal?: AbortSignal,
) {
  const qs = query(params, { page: params.page, perPage: params.perPage });
  return request<ListResult<SignedCopyRow>>(`/api/dashboard/signed-copies?${qs}`, {
    signal,
  });
}

export function listJustificationRows(
  params: DashboardParams & {
    page: number;
    perPage: number;
    state?: JustificationState;
  },
  signal?: AbortSignal,
) {
  const qs = query(params, {
    page: params.page,
    perPage: params.perPage,
    state: params.state,
  });
  return request<ListResult<JustificationRow>>(
    `/api/dashboard/justifications?${qs}`,
    { signal },
  );
}

/** A link that downloads a CSV of one panel, with the panel's filters. */
export function exportUrl(
  view: ExportView,
  params: DashboardParams,
  extra: {
    status?: string;
    stage?: number;
    overdue?: "review" | "submission";
    state?: JustificationState;
  } = {},
): string {
  return `/api/dashboard/export?${query(params, { view, ...extra })}`;
}
