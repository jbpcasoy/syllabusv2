import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { resolveSyllabusAccess } from "@/lib/syllabus";
import {
  buildTimeline,
  type TimelineEvent,
  type TimelineVersion,
} from "@/lib/syllabus-timeline";
import type { Syllabus } from "@/types/syllabus";
import type { TimelineResponse } from "@/types/syllabus-timeline";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/syllabus/:id/timeline
// Anyone with access to the syllabus (others get 404). Creation, uploads
// and workflow events, oldest first, with people's names only.
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id, {
        fields: "id,lead,co_authors,status,program,created",
      }),
      getUserRoles(auth.user.id),
    ]);
    if (!(await resolveSyllabusAccess(pb, auth.user.id, roles, syllabus))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const filter = pb.filter("syllabus = {:id}", { id });
    const [versions, events] = await Promise.all([
      pb.collection("syllabus_versions").getFullList<TimelineVersion>({
        filter,
        sort: "version_no",
        expand: "uploaded_by",
        fields: "id,version_no,created,expand.uploaded_by.name",
      }),
      pb.collection("syllabus_events").getFullList<TimelineEvent>({
        filter,
        sort: "created",
        expand: "actor",
        fields:
          "type,created,stage,version,approval_code,reason,expand.actor.name",
      }),
    ]);

    const body: TimelineResponse = {
      items: buildTimeline({ createdAt: syllabus.created, versions, events }),
    };
    return NextResponse.json(body);
  } catch (error) {
    return handlePbError(error);
  }
}
