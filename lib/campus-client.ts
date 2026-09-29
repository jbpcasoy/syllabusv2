import type { Campus } from "@/types/campus";
import type { ListResult } from "pocketbase";

// PocketBase adds these to every record; widen the type in case Campus omits them.
export type CampusRecord = Campus & { created?: string; updated?: string };

export type CampusInput = { name: string };

export type ListParams = {
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

export function listCampuses(
  { page, perPage, search }: ListParams,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (search) qs.set("search", search);

  return request<ListResult<CampusRecord>>(`/api/campus?${qs}`, { signal });
}

export function createCampus(input: CampusInput) {
  return request<CampusRecord>("/api/campus", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCampus(id: string, input: Partial<CampusInput>) {
  return request<CampusRecord>(`/api/campus/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteCampus(id: string) {
  return request<void>(`/api/campus/${id}`, { method: "DELETE" });
}
