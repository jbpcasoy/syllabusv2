import { requireUser } from "@/lib/auth";
import { listForm17Answers } from "@/lib/form17";
import { CURRENT_FORM17, getForm17 } from "@/lib/forms";
import { buildForm17Export } from "@/lib/forms/export";
import { listApprovals, loadExportSyllabus } from "@/lib/forms-export";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { resolveSyllabusAccess } from "@/lib/syllabus";
import { latestVersion } from "@/lib/syllabus-version";
import type { Syllabus } from "@/types/syllabus";
import type { SyllabusVersion } from "@/types/syllabus-version";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

// GET /api/syllabus/:id/export/form17?version=<versionId>
// Anyone with access. Form17ExportData (lib/forms/export.ts) for the
// version (default: latest), printed against the revision its answers used.
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

    const versionId = versionParam || (await latestVersion(pb, id))?.id;
    if (!versionId) {
      return NextResponse.json(
        { error: "This syllabus has no version yet." },
        { status: 409 },
      );
    }
    const version = await pb
      .collection("syllabus_versions")
      .getOne<SyllabusVersion>(versionId, {
        fields: "id,syllabus,version_no,form17_suggestions",
      });
    if (version.syllabus !== id) return notFound();

    const [answers, exportSyllabus, approvals] = await Promise.all([
      listForm17Answers(pb, version.id),
      loadExportSyllabus(pb, id),
      listApprovals(pb, id),
    ]);
    return NextResponse.json(
      buildForm17Export({
        definition: getForm17(answers[0]?.form_revision ?? "") ?? CURRENT_FORM17,
        syllabus: exportSyllabus,
        versionNo: version.version_no,
        answers,
        suggestions: version.form17_suggestions ?? "",
        approvals,
      }),
    );
  } catch (error) {
    return handlePbError(error);
  }
}
