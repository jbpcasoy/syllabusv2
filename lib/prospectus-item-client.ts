import type {
  ProspectusItemInput,
  ProspectusItemResponse,
  ProspectusItemUpdateInput,
  Semester,
  YearLevel,
} from "@/types/prospectus-item";
import type { ListResult } from "pocketbase";

export type {
  ProspectusItemInput,
  ProspectusItemResponse,
  ProspectusItemUpdateInput,
};

export type ProspectusItemListParams = {
  page: number;
  perPage: number;
  search?: string;
  prospectus?: string;
  /** "" = all. */
  semester?: Semester | "";
  /** "" = all. */
  yearLevel?: YearLevel | "";
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

export function listProspectusItems(
  {
    page,
    perPage,
    search,
    prospectus,
    semester,
    yearLevel,
  }: ProspectusItemListParams,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (search) qs.set("search", search);
  if (prospectus) qs.set("prospectus", prospectus);
  if (semester) qs.set("semester", semester);
  if (yearLevel) qs.set("year_level", yearLevel);

  return request<ListResult<ProspectusItemResponse>>(
    `/api/prospectus-item?${qs}`,
    { signal },
  );
}

export function createProspectusItem(input: ProspectusItemInput) {
  return request<ProspectusItemResponse>("/api/prospectus-item", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProspectusItem(
  id: string,
  input: ProspectusItemUpdateInput,
) {
  return request<ProspectusItemResponse>(`/api/prospectus-item/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteProspectusItem(id: string) {
  return request<void>(`/api/prospectus-item/${id}`, { method: "DELETE" });
}
