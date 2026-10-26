import type {
  CourseInput,
  CourseResponse,
  CourseUpdateInput,
} from "@/types/course";
import type { ListResult } from "pocketbase";

export type { CourseInput, CourseResponse, CourseUpdateInput };

export type CourseListParams = {
  page: number;
  perPage: number;
  search?: string;
  program?: string;
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

export function listCourses(
  { page, perPage, search, program }: CourseListParams,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (search) qs.set("search", search);
  if (program) qs.set("program", program);

  return request<ListResult<CourseResponse>>(`/api/course?${qs}`, { signal });
}

export function createCourse(input: CourseInput) {
  return request<CourseResponse>("/api/course", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCourse(id: string, input: CourseUpdateInput) {
  return request<CourseResponse>(`/api/course/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteCourse(id: string) {
  return request<void>(`/api/course/${id}`, { method: "DELETE" });
}
