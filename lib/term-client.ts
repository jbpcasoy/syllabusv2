import type {
  Semester,
  TermInput,
  TermResponse,
  TermUpdateInput,
} from "@/types/term";
import type { ListResult } from "pocketbase";

export type { TermInput, TermResponse, TermUpdateInput };

export type TermListParams = {
  page: number;
  perPage: number;
  search?: string;
  schoolYear?: string;
  /** "" = all. */
  semester?: Semester | "";
  /** "" = both. */
  open?: "" | "true" | "false";
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

export function listTerms(
  { page, perPage, search, schoolYear, semester, open }: TermListParams,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (search) qs.set("search", search);
  if (schoolYear) qs.set("school_year", schoolYear);
  if (semester) qs.set("semester", semester);
  if (open) qs.set("open", open);

  return request<ListResult<TermResponse>>(`/api/term?${qs}`, { signal });
}

export function createTerm(input: TermInput) {
  return request<TermResponse>("/api/term", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTerm(id: string, input: TermUpdateInput) {
  return request<TermResponse>(`/api/term/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteTerm(id: string) {
  return request<void>(`/api/term/${id}`, { method: "DELETE" });
}
