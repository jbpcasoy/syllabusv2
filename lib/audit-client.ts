import type { AuditAction, AuditResponse } from "@/types/audit";

export { AUDIT_ACTIONS } from "@/types/audit";
export type { AuditAction, AuditResponse };

export type AuditListResponse = {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: AuditResponse[];
};

export type AuditParams = {
  page: number;
  perPage: number;
  action?: AuditAction | "";
  syllabus?: string;
  /** "true", "false" or "" for both. */
  override?: string;
  /** YYYY-MM-DD, Philippine time, inclusive. */
  from?: string;
  to?: string;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);

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

  return (await res.json()) as T;
}

export function listAudit(params: AuditParams, signal?: AbortSignal) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  return request<AuditListResponse>(`/api/audit?${qs}`, { signal });
}
