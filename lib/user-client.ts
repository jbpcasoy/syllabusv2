import type { UserInput, UserKind, UserResponse } from "@/types/user";
import type { ListResult } from "pocketbase";

export type { UserInput, UserKind, UserResponse };

export type UserListParams = {
  page: number;
  perPage: number;
  search?: string;
  kind?: UserKind | "";
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

export function listUsers(
  { page, perPage, search, kind }: UserListParams,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (search) qs.set("search", search);
  if (kind) qs.set("kind", kind);

  return request<ListResult<UserResponse>>(`/api/user?${qs}`, { signal });
}

export function createUser(input: UserInput) {
  return request<UserResponse>("/api/user", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateUser(id: string, input: Partial<UserInput>) {
  return request<UserResponse>(`/api/user/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteUser(id: string) {
  return request<void>(`/api/user/${id}`, { method: "DELETE" });
}
