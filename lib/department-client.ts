import type { Department, DepartmentInput } from "@/types/department";
import type { ListResult } from "pocketbase";

export type DepartmentRecord = Department & {
  created?: string;
  updated?: string;
};

export type { DepartmentInput };

export type DepartmentListParams = {
  page: number;
  perPage: number;
  search?: string;
  college?: string;
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

export function listDepartments(
  { page, perPage, search, college }: DepartmentListParams,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (search) qs.set("search", search);
  if (college) qs.set("college", college);

  return request<ListResult<DepartmentRecord>>(`/api/department?${qs}`, {
    signal,
  });
}

export function createDepartment(input: DepartmentInput) {
  return request<DepartmentRecord>("/api/department", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateDepartment(id: string, input: Partial<DepartmentInput>) {
  return request<DepartmentRecord>(`/api/department/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteDepartment(id: string) {
  return request<void>(`/api/department/${id}`, { method: "DELETE" });
}
