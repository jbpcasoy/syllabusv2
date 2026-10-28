import { requireUser } from "@/lib/auth";
import {
  NOTIFICATION_EXPAND,
  ownFilter,
  toNotificationResponse,
} from "@/lib/notification";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { parseNotificationUpdateInput } from "@/lib/validators/notification";
import type { Notification } from "@/types/notification";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/notification/:id  { "read": true | false }
// Own rows only. Another user's row answers 404, the same as a missing one.
// Marking a read row read again keeps its first read time.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseNotificationUpdateInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();
    const notification = await pb
      .collection("notifications")
      .getFirstListItem<Notification>(
        `${pb.filter("id = {:id}", { id })} && ${ownFilter(pb, auth.user.id)}`,
        { fields: "id,read_at" },
      );

    const { read } = parsed.data;
    if (read !== !!notification.read_at) {
      await pb
        .collection("notifications")
        .update(id, { read_at: read ? new Date().toISOString() : "" });
    }

    const updated = await pb
      .collection("notifications")
      .getOne<Notification>(id, { expand: NOTIFICATION_EXPAND });
    return NextResponse.json(toNotificationResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}
