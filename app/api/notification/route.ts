import { requireUser } from "@/lib/auth";
import {
  countUnread,
  NOTIFICATION_EXPAND,
  ownFilter,
  toNotificationResponse,
} from "@/lib/notification";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import type {
  Notification,
  NotificationListResponse,
} from "@/types/notification";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/notification?page=1&perPage=30&unread=true
// The signed-in user's own notifications, newest first, plus their unread
// total for the badge.
export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const perPage = Math.min(
      100,
      Math.max(1, Number(searchParams.get("perPage")) || 30),
    );
    const unreadOnly = searchParams.get("unread") === "true";

    const me = auth.user.id;
    const pb = await createAdminPb();
    const [result, unreadCount] = await Promise.all([
      pb.collection("notifications").getList<Notification>(page, perPage, {
        sort: "-created",
        expand: NOTIFICATION_EXPAND,
        filter: ownFilter(pb, me, unreadOnly),
      }),
      countUnread(pb, me),
    ]);

    const body: NotificationListResponse = {
      ...result,
      items: result.items.map(toNotificationResponse),
      unread_count: unreadCount,
    };
    return NextResponse.json(body);
  } catch (error) {
    return handlePbError(error);
  }
}
