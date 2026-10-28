import type {
  QueueStatus,
  ReviewQueueItem,
  ReviewQueueResponse,
} from "@/types/review-queue";

export { QUEUE_STATUSES } from "@/types/review-queue";
export type { QueueStatus, ReviewQueueItem, ReviewQueueResponse };

export type ReviewQueueParams = {
  page: number;
  perPage: number;
  /** Omit for the caller's first stage. */
  stage?: number;
  status: QueueStatus;
  program?: string;
  term?: string;
  search?: string;
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

export function listReviewQueue(
  params: ReviewQueueParams,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  return request<ReviewQueueResponse>(`/api/review-queue?${qs}`, { signal });
}
