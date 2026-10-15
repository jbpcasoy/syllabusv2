import type {
  FacultyInput,
  FacultyResponse,
  FacultyUpdateInput,
} from "@/types/faculty";
import type { ListResult } from "pocketbase";

export type { FacultyInput, FacultyResponse, FacultyUpdateInput };

export type FacultyListParams = {
  page: number;
  perPage: number;
  search?: string;
  department?: string;
  /** Pass "me" to list only the signed-in user's memberships. */
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

export function listFaculty(
  { page, perPage, search, department, user, active }: FacultyListParams,
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

  return request<ListResult<FacultyResponse>>(`/api/faculty?${qs}`, { signal });
}

export function createFaculty(input: FacultyInput) {
  return request<FacultyResponse>("/api/faculty", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateFaculty(id: string, input: FacultyUpdateInput) {
  return request<FacultyResponse>(`/api/faculty/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteFaculty(id: string) {
  return request<void>(`/api/faculty/${id}`, { method: "DELETE" });
}
