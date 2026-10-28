import type {
  AvailableSyllabusRow,
  CoAuthorCandidate,
  LeadTransferInput,
  SyllabusAccess,
  SyllabusInput,
  SyllabusResponse,
  SyllabusStatus,
  SyllabusUpdateInput,
} from "@/types/syllabus";
import type { Form17ExportData, Form181ExportData } from "@/lib/forms/export";
import type { JustificationLetterData } from "@/lib/forms/justification";
import type { Form17Input, Form17Response } from "@/types/form17";
import type {
  JustificationEntry,
  JustificationResponse,
} from "@/types/justification";
import type { SignedCopyResponse } from "@/types/signed-copy";
import type {
  Form18PointResponse,
  Form18Response,
  PointInput,
  PointUpdateInput,
} from "@/types/form18";
import type { ReviewDecision, ReviewResult } from "@/types/syllabus-review";
import type {
  StandInCandidate,
  StandInInput,
  StandInResponse,
} from "@/types/syllabus-stand-in";
import type { SyllabusVersionResponse } from "@/types/syllabus-version";
import type {
  TimelineEntry,
  TimelineResponse,
} from "@/types/syllabus-timeline";
import type { ListResult } from "pocketbase";

export { MAX_PDF_BYTES } from "@/types/syllabus-version";
export type {
  AvailableSyllabusRow,
  CoAuthorCandidate,
  Form17Input,
  Form17Response,
  Form18PointResponse,
  Form18Response,
  PointInput,
  PointUpdateInput,
  ReviewDecision,
  ReviewResult,
  SignedCopyResponse,
  StandInCandidate,
  StandInInput,
  StandInResponse,
  SyllabusAccess,
  SyllabusInput,
  SyllabusResponse,
  SyllabusStatus,
  SyllabusUpdateInput,
  SyllabusVersionResponse,
  TimelineEntry,
  TimelineResponse,
};

export type SyllabusListParams = {
  page: number;
  perPage: number;
  search?: string;
  term?: string;
  program?: string;
  /** "" = all statuses. */
  status?: "" | SyllabusStatus;
  /** "review": only syllabi waiting on the caller's decision. */
  scope?: "" | "review";
};

export type AvailableListParams = {
  page: number;
  perPage: number;
  search?: string;
  term?: string;
  program?: string;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  // JSON bodies only: a FormData upload needs the browser's multipart boundary.
  const json = typeof init?.body === "string";
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(json && { "Content-Type": "application/json" }),
      ...init?.headers,
    },
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

export function listSyllabi(params: SyllabusListParams, signal?: AbortSignal) {
  return request<ListResult<SyllabusResponse>>(
    `/api/syllabus?${query(params)}`,
    { signal },
  );
}

export function listAvailableSyllabi(
  params: AvailableListParams,
  signal?: AbortSignal,
) {
  return request<ListResult<AvailableSyllabusRow>>(
    `/api/syllabus/available?${query(params)}`,
    { signal },
  );
}

export function getSyllabus(id: string, signal?: AbortSignal) {
  return request<SyllabusResponse>(`/api/syllabus/${id}`, { signal });
}

export function getSyllabusTimeline(id: string, signal?: AbortSignal) {
  return request<TimelineResponse>(`/api/syllabus/${id}/timeline`, { signal });
}

export function createSyllabus(input: SyllabusInput) {
  return request<SyllabusResponse>("/api/syllabus", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateSyllabusCoAuthors(id: string, input: SyllabusUpdateInput) {
  return request<SyllabusResponse>(`/api/syllabus/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteSyllabus(id: string) {
  return request<void>(`/api/syllabus/${id}`, { method: "DELETE" });
}

export function submitSyllabus(id: string) {
  return request<SyllabusResponse>(`/api/syllabus/${id}/submit`, {
    method: "POST",
  });
}

export function resubmitSyllabus(id: string) {
  return request<SyllabusResponse>(`/api/syllabus/${id}/resubmit`, {
    method: "POST",
  });
}

export function reviewSyllabus(id: string, decision: ReviewDecision) {
  return request<ReviewResult>(`/api/syllabus/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ decision }),
  });
}

export function listStandIns(id: string, signal?: AbortSignal) {
  return request<{ items: StandInResponse[] }>(`/api/syllabus/${id}/stand-in`, {
    signal,
  });
}

/** `user: null` clears the stage. Returns every stand-in afterwards. */
export function setStandIn(id: string, input: StandInInput) {
  return request<{ items: StandInResponse[] }>(`/api/syllabus/${id}/stand-in`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function listStandInCandidates(
  id: string,
  stage: number,
  search: string,
  signal?: AbortSignal,
) {
  return request<{ items: StandInCandidate[] }>(
    `/api/syllabus/${id}/stand-in-candidates?${query({ stage, search })}`,
    { signal },
  );
}

export function getForm17(id: string, version?: string, signal?: AbortSignal) {
  return request<Form17Response>(
    `/api/syllabus/${id}/form17?${query({ version })}`,
    { signal },
  );
}

export function saveForm17(id: string, input: Form17Input) {
  return request<Form17Response>(`/api/syllabus/${id}/form17`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function getForm18(id: string, signal?: AbortSignal) {
  return request<Form18Response>(`/api/syllabus/${id}/form18`, { signal });
}

export function createReviewPoint(id: string, input: PointInput) {
  return request<Form18PointResponse>(`/api/syllabus/${id}/form18`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateReviewPoint(
  id: string,
  pointId: string,
  input: PointUpdateInput,
) {
  return request<Form18PointResponse>(`/api/syllabus/${id}/form18/${pointId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteReviewPoint(id: string, pointId: string) {
  return request<void>(`/api/syllabus/${id}/form18/${pointId}`, {
    method: "DELETE",
  });
}

export function transferLead(id: string, input: LeadTransferInput) {
  return request<SyllabusResponse>(`/api/syllabus/${id}/lead`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function listLeadCandidates(
  id: string,
  search: string,
  signal?: AbortSignal,
) {
  return request<{ items: CoAuthorCandidate[] }>(
    `/api/syllabus/${id}/lead-candidates?${query({ search })}`,
    { signal },
  );
}

/** Copies last school year's latest PDF in as version 1 of a draft. */
export function startFromPrevious(id: string) {
  return request<SyllabusVersionResponse>(
    `/api/syllabus/${id}/version/from-previous`,
    { method: "POST" },
  );
}

export function getJustification(id: string, signal?: AbortSignal) {
  return request<JustificationResponse>(`/api/syllabus/${id}/justification`, {
    signal,
  });
}

/** Replaces the entries; [] deletes the justification. */
export function saveJustification(id: string, entries: JustificationEntry[]) {
  return request<JustificationResponse>(`/api/syllabus/${id}/justification`, {
    method: "PUT",
    body: JSON.stringify({ entries }),
  });
}

export function uploadJustificationScan(id: string, file: File) {
  const form = new FormData();
  form.set("file", file);
  return request<JustificationResponse>(
    `/api/syllabus/${id}/justification/scan`,
    { method: "POST", body: form },
  );
}

export function returnJustification(id: string, reason: string) {
  return request<JustificationResponse>(`/api/syllabus/${id}/justification`, {
    method: "PATCH",
    body: JSON.stringify({ action: "return", reason }),
  });
}

/** Scoped scan route. Use it as a link; the browser sends the session cookie. */
export function justificationScanUrl(id: string) {
  return `/api/syllabus/${id}/justification/scan`;
}

/** JustificationLetterData for the document export. Lead only. */
export function getJustificationLetter(id: string, signal?: AbortSignal) {
  return request<JustificationLetterData>(
    `/api/syllabus/${id}/export/justification`,
    { signal },
  );
}

export function listSignedCopies(id: string, signal?: AbortSignal) {
  return request<{ items: SignedCopyResponse[] }>(
    `/api/syllabus/${id}/signed-copy`,
    { signal },
  );
}

export function uploadSignedCopy(id: string, file: File) {
  const form = new FormData();
  form.set("file", file);
  return request<SignedCopyResponse>(`/api/syllabus/${id}/signed-copy`, {
    method: "POST",
    body: form,
  });
}

export function returnSignedCopy(id: string, copyId: string, reason: string) {
  return request<SignedCopyResponse>(
    `/api/syllabus/${id}/signed-copy/${copyId}`,
    { method: "PATCH", body: JSON.stringify({ reason }) },
  );
}

/** Scoped scan route. Use it as a link; the browser sends the session cookie. */
export function signedCopyFileUrl(id: string, copyId: string) {
  return `/api/syllabus/${id}/signed-copy/${copyId}/file`;
}

/** Form17ExportData for the document export; latest version by default. */
export function getForm17Export(
  id: string,
  signal?: AbortSignal,
  version?: string,
) {
  return request<Form17ExportData>(
    `/api/syllabus/${id}/export/form17?${query({ version })}`,
    { signal },
  );
}

/** Form181ExportData for the document export. */
export function getForm181Export(id: string, signal?: AbortSignal) {
  return request<Form181ExportData>(`/api/syllabus/${id}/export/form18`, {
    signal,
  });
}

export function listCoAuthorCandidates(
  id: string,
  search: string,
  signal?: AbortSignal,
) {
  return request<{ items: CoAuthorCandidate[] }>(
    `/api/syllabus/${id}/co-author-candidates?${query({ search })}`,
    { signal },
  );
}

export function listSyllabusVersions(
  id: string,
  { page, perPage }: { page: number; perPage: number },
  signal?: AbortSignal,
) {
  return request<ListResult<SyllabusVersionResponse>>(
    `/api/syllabus/${id}/version?${query({ page, perPage })}`,
    { signal },
  );
}

export function uploadSyllabusVersion(id: string, file: File, notes: string) {
  const form = new FormData();
  form.set("file", file);
  form.set("notes", notes);
  return request<SyllabusVersionResponse>(`/api/syllabus/${id}/version`, {
    method: "POST",
    body: form,
  });
}

/** Scoped PDF route. Use it as a link; the browser sends the session cookie. */
export function syllabusVersionFileUrl(id: string, versionId: string) {
  return `/api/syllabus/${id}/version/${versionId}/file`;
}
