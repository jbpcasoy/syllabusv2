import type {
  ProgramReviewerInput,
  ProgramReviewerResponse,
  ProgramReviewerUpdateInput,
} from "@/types/program-reviewer";
import type { ListResult } from "pocketbase";

export type {
  ProgramReviewerInput,
  ProgramReviewerResponse,
  ProgramReviewerUpdateInput,
};

export type ProgramReviewerListParams = {
  page: number;
  perPage: number;
  search?: string;
  program?: string;
  /** Pass "me" to list only the signed-in user's assignments. */
  user?: string;
  /** "" = both. */
  active?: "" | "true" | "false";
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

export function listProgramReviewers(
  { page, perPage, search, program, user, active }: ProgramReviewerListParams,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (search) qs.set("search", search);
  if (program) qs.set("program", program);
  if (user) qs.set("user", user);
  if (active) qs.set("active", active);

  return request<ListResult<ProgramReviewerResponse>>(`/api/program-reviewer?${qs}`, {
    signal,
  });
}

export function createProgramReviewer(input: ProgramReviewerInput) {
  return request<ProgramReviewerResponse>("/api/program-reviewer", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProgramReviewer(id: string, input: ProgramReviewerUpdateInput) {
  return request<ProgramReviewerResponse>(`/api/program-reviewer/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteProgramReviewer(id: string) {
  return request<void>(`/api/program-reviewer/${id}`, { method: "DELETE" });
}
