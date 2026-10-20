import type {
  FdisChairInput,
  FdisChairResponse,
  FdisChairUpdateInput,
} from "@/types/fdis-chair";
import type { ListResult } from "pocketbase";

export type { FdisChairInput, FdisChairResponse, FdisChairUpdateInput };

export type FdisChairListParams = {
  page: number;
  perPage: number;
  search?: string;
  /** Pass "me" to list only the signed-in user's records. */
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

export function listFdisChairs(
  { page, perPage, search, user, active }: FdisChairListParams,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (search) qs.set("search", search);
  if (user) qs.set("user", user);
  if (active) qs.set("active", active);

  return request<ListResult<FdisChairResponse>>(`/api/fdis-chair?${qs}`, {
    signal,
  });
}

export function createFdisChair(input: FdisChairInput) {
  return request<FdisChairResponse>("/api/fdis-chair", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateFdisChair(id: string, input: FdisChairUpdateInput) {
  return request<FdisChairResponse>(`/api/fdis-chair/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteFdisChair(id: string) {
  return request<void>(`/api/fdis-chair/${id}`, { method: "DELETE" });
}
