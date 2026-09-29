import type { College, CollegeInput } from "@/types/college";
import type { ListResult } from "pocketbase";

export type CollegeRecord = College & { created?: string; updated?: string };

export type { CollegeInput };

export type CollegeListParams = {
  page: number;
  perPage: number;
  search?: string;
  campus?: string;
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

export function listColleges(
  { page, perPage, search, campus }: CollegeListParams,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (search) qs.set("search", search);
  if (campus) qs.set("campus", campus);

  return request<ListResult<CollegeRecord>>(`/api/college?${qs}`, { signal });
}

export function createCollege(input: CollegeInput) {
  return request<CollegeRecord>("/api/college", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCollege(id: string, input: Partial<CollegeInput>) {
  return request<CollegeRecord>(`/api/college/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteCollege(id: string) {
  return request<void>(`/api/college/${id}`, { method: "DELETE" });
}
