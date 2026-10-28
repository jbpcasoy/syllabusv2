import type { NotificationUpdateInput } from "@/types/notification";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function parseNotificationUpdateInput(
  body: unknown,
): ParseResult<NotificationUpdateInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { read } = body as Record<string, unknown>;
  if (typeof read !== "boolean") {
    return { ok: false, error: "`read` must be true or false" };
  }

  return { ok: true, data: { read } };
}
