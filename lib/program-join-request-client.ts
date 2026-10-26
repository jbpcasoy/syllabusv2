import type {
  JoinRequestStatus,
  ProgramJoinRequestDecision,
  ProgramJoinRequestInput,
  ProgramJoinRequestResponse,
} from "@/types/program-join-request";
import type { ListResult } from "pocketbase";

export type {
  JoinRequestStatus,
  ProgramJoinRequestDecision,
  ProgramJoinRequestInput,
  ProgramJoinRequestResponse,
};

export type ProgramJoinRequestListParams = {
  page: number;
  perPage: number;
  search?: string;
  program?: string;
  /** "" = all statuses. */
  status?: "" | JoinRequestStatus;
  /** Pass "me" to list only the signed-in user's requests. */
  user?: string;
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

export function listProgramJoinRequests(
  { page, perPage, search, program, status, user }: ProgramJoinRequestListParams,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (search) qs.set("search", search);
  if (program) qs.set("program", program);
  if (status) qs.set("status", status);
  if (user) qs.set("user", user);

  return request<ListResult<ProgramJoinRequestResponse>>(
    `/api/program-join-request?${qs}`,
    { signal },
  );
}

export function createProgramJoinRequest(input: ProgramJoinRequestInput) {
  return request<ProgramJoinRequestResponse>("/api/program-join-request", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function decideProgramJoinRequest(
  id: string,
  decision: ProgramJoinRequestDecision,
) {
  return request<ProgramJoinRequestResponse>(
    `/api/program-join-request/${id}`,
    { method: "PATCH", body: JSON.stringify(decision) },
  );
}

export function withdrawProgramJoinRequest(id: string) {
  return request<void>(`/api/program-join-request/${id}`, {
    method: "DELETE",
  });
}
