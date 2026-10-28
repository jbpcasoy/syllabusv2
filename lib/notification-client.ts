import type {
  NotificationListResponse,
  NotificationResponse,
} from "@/types/notification";

export type { NotificationListResponse, NotificationResponse };

export type NotificationListParams = {
  page: number;
  perPage: number;
  /** Only unread notifications. */
  unread?: boolean;
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

export function listNotifications(
  { page, perPage, unread }: NotificationListParams,
  signal?: AbortSignal,
) {
  const qs = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (unread) qs.set("unread", "true");

  return request<NotificationListResponse>(`/api/notification?${qs}`, {
    signal,
  });
}

export function setNotificationRead(id: string, read: boolean) {
  return request<NotificationResponse>(`/api/notification/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ read }),
  });
}

export function markAllNotificationsRead() {
  return request<void>("/api/notification/read-all", { method: "POST" });
}
