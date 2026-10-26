import type { SchoolYearInput, SchoolYearResponse } from "@/types/school-year";
import type { ListResult } from "pocketbase";

export type { SchoolYearInput, SchoolYearResponse };

export type SchoolYearListParams = {
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

export function listSchoolYears(
  { page, perPage, search }: SchoolYearListParams,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (search) qs.set("search", search);

  return request<ListResult<SchoolYearResponse>>(`/api/school-year?${qs}`, {
    signal,
  });
}

export function createSchoolYear(input: SchoolYearInput) {
  return request<SchoolYearResponse>("/api/school-year", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateSchoolYear(id: string, input: SchoolYearInput) {
  return request<SchoolYearResponse>(`/api/school-year/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteSchoolYear(id: string) {
  return request<void>(`/api/school-year/${id}`, { method: "DELETE" });
}
