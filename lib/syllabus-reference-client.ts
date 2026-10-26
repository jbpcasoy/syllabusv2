import type { ReferenceSourceRow } from "@/types/syllabus";
import type {
  ReferenceAction,
  ReferenceActionInput,
  ReferenceStatus,
  SyllabusReferenceInput,
  SyllabusReferenceResponse,
} from "@/types/syllabus-reference";
import type { ListResult } from "pocketbase";

export { MAX_REFERENCE_TEXT } from "@/types/syllabus-reference";
export type {
  ReferenceAction,
  ReferenceActionInput,
  ReferenceSourceRow,
  ReferenceStatus,
  SyllabusReferenceInput,
  SyllabusReferenceResponse,
};

export type ReferenceListParams = {
  page: number;
  perPage: number;
  search?: string;
  program?: string;
  syllabus?: string;
  /** "" = all statuses. */
  status?: "" | ReferenceStatus;
};

export type ReferenceSourceParams = {
  program: string;
  term: string;
  page: number;
  perPage: number;
  search?: string;
};

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

function query(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  return qs;
}

export function listReferences(
  params: ReferenceListParams,
  signal?: AbortSignal,
) {
  return request<ListResult<SyllabusReferenceResponse>>(
    `/api/syllabus-reference?${query(params)}`,
    { signal },
  );
}

export function listReferenceSources(
  params: ReferenceSourceParams,
  signal?: AbortSignal,
) {
  return request<ListResult<ReferenceSourceRow>>(
    `/api/syllabus-reference/sources?${query(params)}`,
    { signal },
  );
}

export function createReference(input: SyllabusReferenceInput) {
  return request<SyllabusReferenceResponse>("/api/syllabus-reference", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function actOnReference(id: string, input: ReferenceActionInput) {
  return request<SyllabusReferenceResponse>(`/api/syllabus-reference/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export const REFERENCE_STATUS_LABELS: Record<ReferenceStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  revoked: "Revoked",
};

export const REFERENCE_STATUS_STYLES: Record<ReferenceStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  withdrawn: "bg-gray-100 text-gray-600",
  revoked: "bg-gray-100 text-gray-600",
};

/** Which actions to offer; the API decides for real. */
export function referenceActionsFor(
  row: SyllabusReferenceResponse,
  viewer: { id: string; isAdmin: boolean; chairOfPrograms: readonly string[] },
): ReferenceAction[] {
  const decides = viewer.isAdmin || row.expand?.syllabus?.lead === viewer.id;
  const requests =
    viewer.isAdmin || viewer.chairOfPrograms.includes(row.program);
  const actions: ReferenceAction[] = [];
  if (row.status === "pending" && decides) actions.push("approve", "reject");
  if (row.status === "approved" && decides) actions.push("revoke");
  if ((row.status === "pending" || row.status === "approved") && requests) {
    actions.push("withdraw");
  }
  return actions;
}
