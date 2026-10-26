import { authorize, requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { anyOf, isListedForProgram, isNotUniqueError } from "@/lib/syllabus";
import {
  findLiveReference,
  REFERENCE_EXPAND,
  toSyllabusReferenceResponse,
} from "@/lib/syllabus-reference";
import {
  isReferenceStatus,
  parseSyllabusReferenceInput,
} from "@/lib/validators/syllabus-reference";
import type { Syllabus } from "@/types/syllabus";
import type { SyllabusReference } from "@/types/syllabus-reference";
import type { Term } from "@/types/term";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/syllabus-reference?page=1&perPage=30&search=foo&program=<id>&syllabus=<id>&status=pending|approved|rejected|withdrawn|revoked
// Admin sees all. Others see references made by programs they chair and
// references to syllabi they lead.
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
    const search = searchParams.get("search")?.trim();
    const program = searchParams.get("program")?.trim();
    const syllabus = searchParams.get("syllabus")?.trim();
    const status = searchParams.get("status")?.trim();

    const me = auth.user.id;
    const roles = await getUserRoles(me);
    const pb = await createAdminPb();

    // pb.filter() safely binds params to prevent filter injection
    const filters: string[] = [];
    if (!roles.isAdmin) {
      const asLead = pb.filter("syllabus.lead = {:me}", { me });
      filters.push(
        roles.chairOfPrograms.length > 0
          ? `(${asLead} || ${anyOf(pb, "program", roles.chairOfPrograms, "p")})`
          : asLead,
      );
    }
    if (search) {
      filters.push(
        pb.filter(
          "(course.code ~ {:search} || course.title ~ {:search} || program.code ~ {:search} || syllabus.program.code ~ {:search})",
          { search },
        ),
      );
    }
    if (program) filters.push(pb.filter("program = {:program}", { program }));
    if (syllabus) {
      filters.push(pb.filter("syllabus = {:syllabus}", { syllabus }));
    }
    if (isReferenceStatus(status)) {
      filters.push(pb.filter("status = {:status}", { status }));
    }

    const result = await pb
      .collection("syllabus_references")
      .getList<SyllabusReference>(page, perPage, {
        sort: "-created",
        expand: REFERENCE_EXPAND,
        ...(filters.length > 0 && { filter: filters.join(" && ") }),
      });

    return NextResponse.json({
      ...result,
      items: result.items.map(toSyllabusReferenceResponse),
    });
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/syllabus-reference  { "syllabus": "<source id>", "program": "<referencing program id>", "note"?: "..." }
// Chair of `program`. The source must belong to another program, the course
// must be in this program's published prospectus for the term, and the
// program must have neither its own syllabus nor a live reference for it.
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseSyllabusReferenceInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { syllabus: sourceId, program, note } = parsed.data;

    const denied = await authorize(auth.user, "syllabusReference.request", {
      program,
    });
    if (denied) return denied;

    const pb = await createAdminPb();
    // 404 if the source doesn't exist.
    const source = await pb
      .collection("syllabi")
      .getOne<Syllabus>(sourceId, { fields: "id,course,term,program" });
    if (source.program === program) {
      return NextResponse.json(
        { error: "That syllabus already belongs to this program." },
        { status: 409 },
      );
    }

    const slot = { program, course: source.course, term: source.term };
    const term = await pb
      .collection("terms")
      .getOne<Term>(source.term, { fields: "id,school_year,semester" });
    const [listed, own, live] = await Promise.all([
      isListedForProgram(pb, source.course, term, program),
      pb.collection("syllabi").getList(1, 1, {
        skipTotal: true,
        fields: "id",
        filter: pb.filter(
          "course = {:course} && term = {:term} && program = {:program}",
          slot,
        ),
      }),
      findLiveReference(pb, slot),
    ]);
    if (!listed) {
      return NextResponse.json(
        {
          error:
            "This course isn't in the program's published prospectus for this term.",
        },
        { status: 409 },
      );
    }
    if (own.items.length > 0) {
      return NextResponse.json(
        {
          error:
            "This program already has its own syllabus for this course and term.",
        },
        { status: 409 },
      );
    }
    if (live) {
      return NextResponse.json(
        {
          error: `This program already has a ${live.status} reference for this course and term.`,
        },
        { status: 409 },
      );
    }

    // The partial unique index (program, course, term WHERE live) guards races.
    try {
      const created = await pb
        .collection("syllabus_references")
        .create<SyllabusReference>(
          {
            syllabus: sourceId,
            ...slot,
            requested_by: auth.user.id,
            note,
            status: "pending",
          },
          { expand: REFERENCE_EXPAND },
        );
      return NextResponse.json(toSyllabusReferenceResponse(created), {
        status: 201,
      });
    } catch (error) {
      if (isNotUniqueError(error, "program")) {
        return NextResponse.json(
          {
            error:
              "This program already has a live reference for this course and term.",
          },
          { status: 409 },
        );
      }
      throw error;
    }
  } catch (error) {
    return handlePbError(error);
  }
}
