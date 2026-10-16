import type { Program, ProgramInput } from "@/types/program";
import type { ListResult } from "pocketbase";

export type ProgramRecord = Program & { created?: string; updated?: string };

export type { ProgramInput };

export type ProgramListParams = {
  page: number;
  perPage: number;
  search?: string;
  department?: string;
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

export function listPrograms(
  { page, perPage, search, department }: ProgramListParams,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (search) qs.set("search", search);
  if (department) qs.set("department", department);

  return request<ListResult<ProgramRecord>>(`/api/program?${qs}`, { signal });
}

export function createProgram(input: ProgramInput) {
  return request<ProgramRecord>("/api/program", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProgram(id: string, input: Partial<ProgramInput>) {
  return request<ProgramRecord>(`/api/program/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteProgram(id: string) {
  return request<void>(`/api/program/${id}`, { method: "DELETE" });
}
