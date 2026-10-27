import { requireUser } from "@/lib/auth";
import { listPoints } from "@/lib/form18";
import { CURRENT_FORM18, getForm18 } from "@/lib/forms";
import { buildForm181Export } from "@/lib/forms/export";
import { listApprovals, loadExportSyllabus } from "@/lib/forms-export";
import { canViewJustification, findJustification } from "@/lib/justification";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { resolveSyllabusAccess } from "@/lib/syllabus";
import type { Syllabus } from "@/types/syllabus";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/syllabus/:id/export/form18
// Anyone with access. Form181ExportData (lib/forms/export.ts): every point
// of both parts, printed against the revision the points used, and the
// justification state for F.3.
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
    const access = await resolveSyllabusAccess(pb, auth.user.id, roles, syllabus);
    if (!access) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // Referencers never learn whether a justification exists.
    const seesJustification = canViewJustification(access);

    const [points, exportSyllabus, approvals, justification] = await Promise.all([
      listPoints(pb, id),
      loadExportSyllabus(pb, id),
      listApprovals(pb, id),
      seesJustification && syllabus.based_on ? findJustification(pb, id) : null,
    ]);
    return NextResponse.json(
      buildForm181Export({
        definition: getForm18(points[0]?.form_revision ?? "") ?? CURRENT_FORM18,
        syllabus: exportSyllabus,
        points,
        approvals,
        justification: !seesJustification
          ? null
          : !syllabus.based_on
            ? "not_applicable"
            : (justification?.status ?? "missing"),
      }),
    );
  } catch (error) {
    return handlePbError(error);
  }
}
