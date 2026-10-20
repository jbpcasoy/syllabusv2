import type { DeanInput, DeanResponse, DeanUpdateInput } from "@/types/dean";
import type { ListResult } from "pocketbase";

export type { DeanInput, DeanResponse, DeanUpdateInput };

export type DeanListParams = {
  page: number;
  perPage: number;
  search?: string;
  college?: string;
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

export function listDeans(
  { page, perPage, search, college, user, active }: DeanListParams,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (search) qs.set("search", search);
  if (college) qs.set("college", college);
  if (user) qs.set("user", user);
  if (active) qs.set("active", active);

  return request<ListResult<DeanResponse>>(`/api/dean?${qs}`, { signal });
}

export function createDean(input: DeanInput) {
  return request<DeanResponse>("/api/dean", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateDean(id: string, input: DeanUpdateInput) {
  return request<DeanResponse>(`/api/dean/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteDean(id: string) {
  return request<void>(`/api/dean/${id}`, { method: "DELETE" });
}
