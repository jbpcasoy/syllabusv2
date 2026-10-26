import type {
  AvailableSyllabusRow,
  CoAuthorCandidate,
  SyllabusAccess,
  SyllabusInput,
  SyllabusResponse,
  SyllabusStatus,
  SyllabusUpdateInput,
} from "@/types/syllabus";
import type { SyllabusVersionResponse } from "@/types/syllabus-version";
import type { ListResult } from "pocketbase";

export { MAX_PDF_BYTES } from "@/types/syllabus-version";
export type {
  AvailableSyllabusRow,
  CoAuthorCandidate,
  SyllabusAccess,
  SyllabusInput,
  SyllabusResponse,
  SyllabusStatus,
  SyllabusUpdateInput,
  SyllabusVersionResponse,
};

export type SyllabusListParams = {
  page: number;
  perPage: number;
  search?: string;
  term?: string;
  program?: string;
  /** "" = all statuses. */
  status?: "" | SyllabusStatus;
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
