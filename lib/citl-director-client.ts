import type {
  CitlDirectorInput,
  CitlDirectorResponse,
  CitlDirectorUpdateInput,
} from "@/types/citl-director";
import type { ListResult } from "pocketbase";

export type {
  CitlDirectorInput,
  CitlDirectorResponse,
  CitlDirectorUpdateInput,
};

export type CitlDirectorListParams = {
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

export function listCitlDirectors(
  { page, perPage, search, user, active }: CitlDirectorListParams,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (search) qs.set("search", search);
  if (user) qs.set("user", user);
  if (active) qs.set("active", active);

  return request<ListResult<CitlDirectorResponse>>(`/api/citl-director?${qs}`, {
    signal,
  });
}

export function createCitlDirector(input: CitlDirectorInput) {
  return request<CitlDirectorResponse>("/api/citl-director", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCitlDirector(id: string, input: CitlDirectorUpdateInput) {
  return request<CitlDirectorResponse>(`/api/citl-director/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteCitlDirector(id: string) {
  return request<void>(`/api/citl-director/${id}`, { method: "DELETE" });
}
