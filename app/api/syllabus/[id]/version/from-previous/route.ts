import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import {
  activeFacultyAmong,
  getSyllabusAccess,
  isNotUniqueError,
} from "@/lib/syllabus";
import {
  fetchVersionFile,
  latestVersion,
  latestVersionNo,
  SYLLABUS_VERSION_EXPAND,
  toSyllabusVersionResponse,
} from "@/lib/syllabus-version";
import type { Syllabus } from "@/types/syllabus";
import type { SyllabusVersion } from "@/types/syllabus-version";
import type { Term } from "@/types/term";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const conflict = (error: string) =>
  NextResponse.json({ error }, { status: 409 });

// POST /api/syllabus/:id/version/from-previous  (no body)
// Lead only, on a draft with no versions yet, in an open term. Copies the
// latest PDF of based_on (last school year's syllabus) in as version 1.
export async function POST(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const me = auth.user.id;
    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id),
      getUserRoles(me),
    ]);
    const access = getSyllabusAccess(me, roles, syllabus);
    if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (access !== "lead") {
      return NextResponse.json(
        { error: "Only the lead can upload versions." },
        { status: 403 },
      );
    }
    if (syllabus.status !== "draft") {
      return conflict("Only a draft can start from last year's syllabus.");
    }
    if (!syllabus.based_on) {
      return conflict("There is no syllabus from last school year to start from.");
    }

    const [term, faculty, existing, source] = await Promise.all([
      pb.collection("terms").getOne<Term>(syllabus.term, { fields: "id,open" }),
      activeFacultyAmong(pb, syllabus.program, [me]),
      latestVersionNo(pb, id),
      latestVersion(pb, syllabus.based_on),
    ]);
    if (!term.open) return conflict("This term is closed for submissions.");
    if (!faculty.has(me)) {
      return NextResponse.json(
        { error: "You are no longer active faculty of this program." },
        { status: 403 },
      );
    }
    if (existing > 0) {
      return conflict("This syllabus already has a version.");
    }
    if (!source) return conflict("Last year's syllabus has no PDF to copy.");

    const sourceVersion = await pb
      .collection("syllabus_versions")
      .getOne<SyllabusVersion>(source.id);
    const upstream = await fetchVersionFile(pb, sourceVersion);
    if (!upstream.ok) {
      console.error("Previous PDF fetch failed", source.id, upstream.status);
      return NextResponse.json(
        { error: "Last year's PDF could not be loaded" },
        { status: 502 },
      );
    }
    const file = new File([await upstream.arrayBuffer()], "previous.pdf", {
      type: "application/pdf",
    });

    try {
      const created = await pb
        .collection("syllabus_versions")
        .create<SyllabusVersion>(
          {
            syllabus: id,
            version_no: 1,
            file,
            uploaded_by: me,
            notes: `Started from last school year's syllabus (version ${source.version_no}).`,
          },
          { expand: SYLLABUS_VERSION_EXPAND },
        );
      return NextResponse.json(toSyllabusVersionResponse(created), {
        status: 201,
      });
    } catch (error) {
      // The unique index (syllabus, version_no) rejects a concurrent upload.
      if (isNotUniqueError(error, "version_no")) {
        return conflict("Another upload finished first.");
      }
      throw error;
    }
  } catch (error) {
    return handlePbError(error);
  }
}
