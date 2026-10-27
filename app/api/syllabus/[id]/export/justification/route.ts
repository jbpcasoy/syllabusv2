import { requireUser } from "@/lib/auth";
import { buildJustificationLetter } from "@/lib/forms/justification";
import {
  activeHolderName,
  findJustification,
  userNames,
} from "@/lib/justification";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { getSyllabusAccess } from "@/lib/syllabus";
import type { Syllabus } from "@/types/syllabus";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/syllabus/:id/export/justification
// Lead only. JustificationLetterData (lib/forms/justification.ts) for the
// document export: addressed to the active CITL director, one row per
// entry, the lead and the program's chair printed under blank signatures.
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb
        .collection("syllabi")
        .getOne<Syllabus>(id, { expand: "course,term.school_year,lead" }),
      getUserRoles(auth.user.id),
    ]);
    const access = getSyllabusAccess(auth.user.id, roles, syllabus);
    if (access !== "lead") {
      return access
        ? NextResponse.json(
            { error: "Only the lead can generate the justification letter." },
            { status: 403 },
          )
        : NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const record = await findJustification(pb, id);
    const entries = record?.entries ?? [];
    if (entries.length === 0) {
      return NextResponse.json(
        { error: "Add at least one author and reason first." },
        { status: 409 },
      );
    }

    const [names, recipientName, programChairName] = await Promise.all([
      userNames(pb, entries.map((e) => e.author)),
      activeHolderName(pb, "citl_directors"),
      activeHolderName(pb, "program_chairs", syllabus.program),
    ]);
    const e = syllabus.expand;
    return NextResponse.json(
      buildJustificationLetter({
        at: new Date(),
        semester: e?.term?.semester ?? "",
        schoolYearLabel: e?.term?.expand?.school_year?.label ?? "",
        courseCode: e?.course?.code ?? "",
        courseTitle: e?.course?.title ?? "",
        entries: entries.map((entry) => ({
          authorName: names.get(entry.author) ?? "",
          reason: entry.reason,
        })),
        recipientName,
        facultyName: e?.lead?.name ?? "",
        programChairName,
      }),
    );
  } catch (error) {
    return handlePbError(error);
  }
}
