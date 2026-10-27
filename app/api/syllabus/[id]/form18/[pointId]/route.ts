import { requireUser } from "@/lib/auth";
import { POINT_EXPAND, toPointResponse } from "@/lib/form18";
import {
  pointActionError,
  pointCodeError,
  type PointAction,
} from "@/lib/form18-rules";
import { getForm18 } from "@/lib/forms";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { resolveSyllabusAccess } from "@/lib/syllabus";
import { loadChainHolders, loadStandIns } from "@/lib/syllabus-chain";
import { resolveActor } from "@/lib/syllabus-review";
import { latestVersion } from "@/lib/syllabus-version";
import { parsePointUpdate } from "@/lib/validators/form18";
import type { Form18Point } from "@/types/form18";
import type { Syllabus } from "@/types/syllabus";
import type PocketBase from "pocketbase";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string; pointId: string }> };

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });
const conflict = (error: string) =>
  NextResponse.json({ error }, { status: 409 });

type Loaded =
  | { ok: false; response: NextResponse }
  | {
      ok: true;
      pb: PocketBase;
      syllabus: Syllabus;
      point: Form18Point;
      latestVersionId: string;
      /** The stage the caller may decide now, or null. */
      actorStage: number | null;
      isLead: boolean;
    };

/** Loads the point, hiding it (404) from callers without access. */
async function load(id: string, pointId: string, me: string): Promise<Loaded> {
  const pb = await createAdminPb();
  const [syllabus, point, roles] = await Promise.all([
    pb.collection("syllabi").getOne<Syllabus>(id),
    pb.collection("form18_points").getOne<Form18Point>(pointId),
    getUserRoles(me),
  ]);
  const access = await resolveSyllabusAccess(pb, me, roles, syllabus);
  if (point.syllabus !== id || !access) {
    return { ok: false, response: notFound() };
  }
  const [holders, standIns, version] = await Promise.all([
    loadChainHolders(pb, syllabus.program),
    loadStandIns(pb, id),
    latestVersion(pb, id),
  ]);
  return {
    ok: true,
    pb,
    syllabus,
    point,
    latestVersionId: version?.id ?? "",
    actorStage: resolveActor(me, syllabus, holders, standIns)?.stage ?? null,
    isLead: access === "lead",
  };
}

/**
 * The point's stage reviewer may edit, judge and delete it; anyone else
 * gets 403 while it's in review there, else the rule's 409.
 */
function reviewerCheck(
  loaded: Extract<Loaded, { ok: true }>,
  action: PointAction,
): NextResponse | null {
  const ruleError = pointActionError(
    action,
    loaded.point,
    loaded.syllabus,
    loaded.latestVersionId,
  );
  if (loaded.actorStage === loaded.point.stage) {
    return ruleError ? conflict(ruleError) : null;
  }
  if (
    loaded.syllabus.status === "submitted" &&
    loaded.syllabus.stage === loaded.point.stage
  ) {
    return NextResponse.json(
      { error: "Only the reviewer at this point's stage can change it." },
      { status: 403 },
    );
  }
  return conflict(ruleError ?? "This review point can't be changed now.");
}

// PATCH /api/syllabus/:id/form18/:pointId
//   { "action": "edit", "review_point": "", "code"?: "", "remarks"?: "" }  reviewer, before returning
//   { "action": "respond", "action_taken": "", "page_number"?: "" }       lead, while returned
//   { "action": "judge", "status": "resolved" | "unresolved", "remarks"?: "" }  reviewer, once answered
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id, pointId } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parsePointUpdate(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const input = parsed.data;
    const me = auth.user.id;

    const loaded = await load(id, pointId, me);
    if (!loaded.ok) return loaded.response;
    const { pb, point } = loaded;

    let data: Record<string, unknown>;
    if (input.action === "respond") {
      if (!loaded.isLead) {
        return NextResponse.json(
          { error: "Only the lead can answer review points." },
          { status: 403 },
        );
      }
      const ruleError = pointActionError(
        "respond",
        point,
        loaded.syllabus,
        loaded.latestVersionId,
      );
      if (ruleError) return conflict(ruleError);
      data = {
        action_taken: input.action_taken,
        page_number: input.page_number,
        status: "responded",
        responded_by: me,
      };
    } else {
      const denied = reviewerCheck(loaded, input.action);
      if (denied) return denied;
      if (input.action === "edit") {
        const form = getForm18(point.form_revision);
        const codeError = form
          ? pointCodeError(form, point.stage, input.code)
          : "This point's form revision is no longer known.";
        if (codeError) {
          return NextResponse.json({ error: codeError }, { status: 400 });
        }
        data = {
          review_point: input.review_point,
          code: input.code,
          remarks: input.remarks,
        };
      } else {
        data = {
          status: input.status,
          judged_by: me,
          ...(input.remarks !== undefined && { remarks: input.remarks }),
        };
      }
    }

    const updated = await pb
      .collection("form18_points")
      .update<Form18Point>(pointId, data, { expand: POINT_EXPAND });
    return NextResponse.json(toPointResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/syllabus/:id/form18/:pointId
// The reviewer who could still edit it: its stage, before returning.
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id, pointId } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const loaded = await load(id, pointId, auth.user.id);
    if (!loaded.ok) return loaded.response;
    const denied = reviewerCheck(loaded, "delete");
    if (denied) return denied;

    await loaded.pb.collection("form18_points").delete(pointId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
