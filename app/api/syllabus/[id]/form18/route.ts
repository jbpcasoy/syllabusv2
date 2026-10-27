import { requireUser } from "@/lib/auth";
import { loadForm18, POINT_EXPAND, toPointResponse } from "@/lib/form18";
import { pointCodeError } from "@/lib/form18-rules";
import { CURRENT_FORM18, partForStage } from "@/lib/forms";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { resolveSyllabusAccess } from "@/lib/syllabus";
import { loadChainHolders, loadStandIns } from "@/lib/syllabus-chain";
import { isAuthor, resolveActor } from "@/lib/syllabus-review";
import { latestVersion } from "@/lib/syllabus-version";
import { parsePointInput } from "@/lib/validators/form18";
import type { Form18Point } from "@/types/form18";
import type { Syllabus } from "@/types/syllabus";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

// GET /api/syllabus/:id/form18
// Anyone with access to the syllabus. Every point, both parts.
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id),
      getUserRoles(auth.user.id),
    ]);
    if (!(await resolveSyllabusAccess(pb, auth.user.id, roles, syllabus))) {
      return notFound();
    }

    return NextResponse.json(await loadForm18(pb, id));
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/syllabus/:id/form18  { "review_point": "", "code"?: "B.3", "remarks"?: "" }
// The reviewer at the current stage, while in review. Part from the stage:
// A (stages 1 and 2) takes no code, B (3 to 5) needs a legend code.
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parsePointInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const me = auth.user.id;
    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id),
      getUserRoles(me),
    ]);
    const [holders, standIns] = await Promise.all([
      loadChainHolders(pb, syllabus.program),
      loadStandIns(pb, id),
    ]);
    const actor = resolveActor(me, syllabus, holders, standIns);
    if (!actor) {
      if (!(await resolveSyllabusAccess(pb, me, roles, syllabus))) {
        return notFound();
      }
      if (syllabus.status !== "submitted") {
        return NextResponse.json(
          { error: "Review points can only be raised while the syllabus is in review." },
          { status: 409 },
        );
      }
      return NextResponse.json(
        {
          error: isAuthor(me, syllabus)
            ? "You can't review a syllabus you lead or co-author."
            : "Only the reviewer at the current stage can raise review points.",
        },
        { status: 403 },
      );
    }

    const codeError = pointCodeError(CURRENT_FORM18, actor.stage, parsed.data.code);
    if (codeError) {
      return NextResponse.json({ error: codeError }, { status: 400 });
    }
    const version = await latestVersion(pb, id);
    if (!version) {
      return NextResponse.json(
        { error: "This syllabus has no version yet." },
        { status: 409 },
      );
    }

    const created = await pb.collection("form18_points").create<Form18Point>(
      {
        syllabus: id,
        version: version.id,
        part: partForStage(actor.stage),
        stage: actor.stage,
        ...parsed.data,
        status: "open",
        form_revision: CURRENT_FORM18.revision,
        raised_by: me,
      },
      { expand: POINT_EXPAND },
    );
    return NextResponse.json(toPointResponse(created), { status: 201 });
  } catch (error) {
    return handlePbError(error);
  }
}
