import type {
  ProgramChairInput,
  ProgramChairResponse,
  ProgramChairUpdateInput,
} from "@/types/program-chair";
import type { ListResult } from "pocketbase";

export type {
  ProgramChairInput,
  ProgramChairResponse,
  ProgramChairUpdateInput,
};

export type ProgramChairListParams = {
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

export function listProgramChairs(
  { page, perPage, search, program, user, active }: ProgramChairListParams,
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

  return request<ListResult<ProgramChairResponse>>(`/api/program-chair?${qs}`, {
    signal,
  });
}

export function createProgramChair(input: ProgramChairInput) {
  return request<ProgramChairResponse>("/api/program-chair", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProgramChair(id: string, input: ProgramChairUpdateInput) {
  return request<ProgramChairResponse>(`/api/program-chair/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteProgramChair(id: string) {
  return request<void>(`/api/program-chair/${id}`, { method: "DELETE" });
}
