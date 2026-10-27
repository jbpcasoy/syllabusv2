import { requireUser } from "@/lib/auth";
import { loadForm17, saveForm17 } from "@/lib/form17";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { resolveSyllabusAccess } from "@/lib/syllabus";
import { loadChainHolders, loadStandIns } from "@/lib/syllabus-chain";
import { isAuthor, resolveActor } from "@/lib/syllabus-review";
import { latestVersion } from "@/lib/syllabus-version";
import { parseForm17Input } from "@/lib/validators/form17";
import type { Syllabus } from "@/types/syllabus";
import type { SyllabusVersion } from "@/types/syllabus-version";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });
const VERSION_FIELDS = "id,syllabus,version_no,form17_suggestions";

// GET /api/syllabus/:id/form17?version=<versionId>
// Anyone with access to the syllabus. Defaults to the latest version.
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const versionParam = request.nextUrl.searchParams.get("version")?.trim();
    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id),
      getUserRoles(auth.user.id),
    ]);
    if (!(await resolveSyllabusAccess(pb, auth.user.id, roles, syllabus))) {
      return notFound();
    }

    const latest = versionParam ? null : await latestVersion(pb, id);
    const versionId = versionParam || latest?.id;
    if (!versionId) {
      return NextResponse.json(
        { error: "This syllabus has no version yet." },
        { status: 409 },
      );
    }
    const version = await pb
      .collection("syllabus_versions")
      .getOne<SyllabusVersion>(versionId, { fields: VERSION_FIELDS });
    // A version id from another syllabus answers like a missing one.
    if (version.syllabus !== id) return notFound();

    return NextResponse.json(await loadForm17(pb, version));
  } catch (error) {
    return handlePbError(error);
  }
}

// PUT /api/syllabus/:id/form17
//   { "answers": [{ "criterion": "A1", "answer": "yes" | "no", "remarks"?: "" }], "suggestions"?: "" }
// The reviewer at the current stage, on the latest version only. Upserts the
// listed criteria; edits after stage 1 are logged. A "No" needs remarks.
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseForm17Input(body);
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
          { error: "Form 17 can only be changed while the syllabus is in review." },
          { status: 409 },
        );
      }
      return NextResponse.json(
        {
          error: isAuthor(me, syllabus)
            ? "You can't review a syllabus you lead or co-author."
            : "Only the reviewer at the current stage can change Form 17.",
        },
        { status: 403 },
      );
    }

    const latest = await latestVersion(pb, id);
    if (!latest) {
      return NextResponse.json(
        { error: "This syllabus has no version yet." },
        { status: 409 },
      );
    }
    await saveForm17(pb, {
      versionId: latest.id,
      stage: actor.stage,
      by: me,
      input: parsed.data,
    });

    const version = await pb
      .collection("syllabus_versions")
      .getOne<SyllabusVersion>(latest.id, { fields: VERSION_FIELDS });
    return NextResponse.json(await loadForm17(pb, version));
  } catch (error) {
    return handlePbError(error);
  }
}
