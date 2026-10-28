import type {
  Notification,
  NotificationResponse,
} from "@/types/notification";
import type PocketBase from "pocketbase";
import "server-only";

// Writing notifications is lib/notifications.ts (pure, batch-only). This
// module reads them for the signed-in user.

export const NOTIFICATION_EXPAND = "actor";

/** PocketBase allows 50 requests per batch by default. */
const BATCH_SIZE = 50;

export function toNotificationResponse(
  record: Notification,
): NotificationResponse {
  return {
    id: record.id,
    syllabus: record.syllabus,
    kind: record.kind,
    stage: record.stage,
    title: record.title,
    body: record.body,
    link: record.link,
    read: !!record.read_at,
    actor_name: record.expand?.actor?.name ?? "",
    created: record.created,
  };
}

/** Filter for the user's own rows, optionally only the unread ones. */
export function ownFilter(
  pb: PocketBase,
  userId: string,
  unreadOnly = false,
): string {
  return pb.filter(
    unreadOnly ? "user = {:userId} && read_at = ''" : "user = {:userId}",
    { userId },
  );
}

export async function countUnread(
  pb: PocketBase,
  userId: string,
): Promise<number> {
  const result = await pb.collection("notifications").getList(1, 1, {
    fields: "id",
    filter: ownFilter(pb, userId, true),
  });
  return result.totalItems;
}

/** Stamps every unread row of the user as read, 50 per batch. */
export async function markAllRead(
  pb: PocketBase,
  userId: string,
  now: string,
): Promise<void> {
  const unread = await pb
    .collection("notifications")
    .getFullList<{ id: string }>({
      fields: "id",
      filter: ownFilter(pb, userId, true),
    });
  for (let i = 0; i < unread.length; i += BATCH_SIZE) {
    const batch = pb.createBatch();
    for (const row of unread.slice(i, i + BATCH_SIZE)) {
      batch.collection("notifications").update(row.id, { read_at: now });
    }
    await batch.send();
  }
}
