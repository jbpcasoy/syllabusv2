import type {
  ProspectusInput,
  ProspectusResponse,
  ProspectusUpdateInput,
} from "@/types/prospectus";
import type {
  ProspectusDuplicateInput,
  ProspectusDuplicateResponse,
} from "@/types/prospectus-duplicate";
import type { ListResult } from "pocketbase";

export type {
  ProspectusDuplicateInput,
  ProspectusDuplicateResponse,
  ProspectusInput,
  ProspectusResponse,
  ProspectusUpdateInput,
};

export type ProspectusListParams = {
  page: number;
  perPage: number;
  search?: string;
  program?: string;
  schoolYear?: string;
  /** "" = both. Ignored by the server for non-managers. */
  published?: "" | "true" | "false";
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

export function listProspectuses(
  {
    page,
    perPage,
    search,
    program,
    schoolYear,
    published,
  }: ProspectusListParams,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (search) qs.set("search", search);
  if (program) qs.set("program", program);
  if (schoolYear) qs.set("school_year", schoolYear);
  if (published) qs.set("published", published);

  return request<ListResult<ProspectusResponse>>(`/api/prospectus?${qs}`, {
    signal,
  });
}

export function createProspectus(input: ProspectusInput) {
  return request<ProspectusResponse>("/api/prospectus", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProspectus(id: string, input: ProspectusUpdateInput) {
  return request<ProspectusResponse>(`/api/prospectus/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteProspectus(id: string) {
  return request<void>(`/api/prospectus/${id}`, { method: "DELETE" });
}

export function previewProspectusDuplicate(
  input: ProspectusDuplicateInput,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({ ...input });
  return request<ProspectusDuplicateResponse>(
    `/api/prospectus/duplicate?${qs}`,
    { signal },
  );
}

export function duplicateProspectus(input: ProspectusDuplicateInput) {
  return request<
    ProspectusDuplicateResponse & { prospectus: ProspectusResponse }
  >("/api/prospectus/duplicate", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
