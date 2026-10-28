import type {
  UserInput,
  UserKind,
  UserOption,
  UserResponse,
} from "@/types/user";
import type { ListResult } from "pocketbase";

export type { UserInput, UserKind, UserOption, UserResponse };

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

/** Users to choose from when assigning a role. Open to any manager. */
export function listUserOptions(
  { search, perPage = 100 }: { search?: string; perPage?: number },
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({ perPage: String(perPage) });
  if (search) qs.set("search", search);

  return request<{ items: UserOption[]; totalItems: number }>(
    `/api/user/options?${qs}`,
    { signal },
  );
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
