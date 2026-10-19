import type {
  DepartmentHeadInput,
  DepartmentHeadResponse,
  DepartmentHeadUpdateInput,
} from "@/types/department-head";
import type { ListResult } from "pocketbase";

export type {
  DepartmentHeadInput,
  DepartmentHeadResponse,
  DepartmentHeadUpdateInput,
};

export type DepartmentHeadListParams = {
  page: number;
  perPage: number;
  search?: string;
  department?: string;
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

export function listDepartmentHeads(
  { page, perPage, search, department, user, active }: DepartmentHeadListParams,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (search) qs.set("search", search);
  if (department) qs.set("department", department);
  if (user) qs.set("user", user);
  if (active) qs.set("active", active);

  return request<ListResult<DepartmentHeadResponse>>(
    `/api/department-head?${qs}`,
    { signal },
  );
}

export function createDepartmentHead(input: DepartmentHeadInput) {
  return request<DepartmentHeadResponse>("/api/department-head", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateDepartmentHead(
  id: string,
  input: DepartmentHeadUpdateInput,
) {
  return request<DepartmentHeadResponse>(`/api/department-head/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteDepartmentHead(id: string) {
  return request<void>(`/api/department-head/${id}`, { method: "DELETE" });
}
