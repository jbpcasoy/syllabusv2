import type { UserInput, UserResponse, UserRole } from "@/types/user";
import type { ListResult } from "pocketbase";

export type { UserInput, UserResponse };

export type UserListParams = {
  page: number;
  perPage: number;
  search?: string;
  role?: UserRole | "";
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
  { page, perPage, search, role }: UserListParams,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (search) qs.set("search", search);
  if (role) qs.set("role", role);

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
