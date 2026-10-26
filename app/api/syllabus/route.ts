import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import {
  activeFacultyAmong,
  anyOf,
  getSyllabusAccess,
  isListedForProgram,
  isNotUniqueError,
  listReferencedSyllabusIds,
  SYLLABUS_EXPAND,
  toSyllabusResponse,
} from "@/lib/syllabus";
import { findLiveReference } from "@/lib/syllabus-reference";
import { INITIAL_STATE } from "@/lib/syllabus-workflow";
import { isSyllabusStatus, parseSyllabusInput } from "@/lib/validators/syllabus";
import type { Syllabus } from "@/types/syllabus";
import type { Term } from "@/types/term";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/syllabus?page=1&perPage=30&search=foo&term=<id>&program=<id>&status=draft|submitted
// Syllabi the caller leads, co-authors, or their programs reference
// (approved). Admin sees all.
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
    const term = searchParams.get("term")?.trim();
    const program = searchParams.get("program")?.trim();
    const status = searchParams.get("status")?.trim();

    const me = auth.user.id;
    const roles = await getUserRoles(me);
    const pb = await createAdminPb();
    const referenced = roles.isAdmin
      ? []
      : await listReferencedSyllabusIds(pb, roles.facultyOfPrograms);

    // pb.filter() safely binds params to prevent filter injection
    const filters: string[] = [];
    if (!roles.isAdmin) {
      const own = pb.filter("lead = {:me} || co_authors ?= {:me}", { me });
      filters.push(
        referenced.length > 0
          ? `(${own} || ${anyOf(pb, "id", referenced, "r")})`
          : `(${own})`,
      );
    }
    if (search) {
      filters.push(
        pb.filter(
          "(course.code ~ {:search} || course.title ~ {:search} || program.code ~ {:search})",
          { search },
        ),
      );
    }
    if (term) filters.push(pb.filter("term = {:term}", { term }));
    if (program) filters.push(pb.filter("program = {:program}", { program }));
    if (isSyllabusStatus(status)) {
      filters.push(pb.filter("status = {:status}", { status }));
    }

    const result = await pb
      .collection("syllabi")
      .getList<Syllabus>(page, perPage, {
        sort: "-updated",
        expand: SYLLABUS_EXPAND,
        ...(filters.length > 0 && { filter: filters.join(" && ") }),
      });

    return NextResponse.json({
      ...result,
      items: result.items.map((record) =>
        toSyllabusResponse(
          record,
          getSyllabusAccess(me, roles, record) ??
            (referenced.includes(record.id) ? "referencer" : undefined),
        ),
      ),
    });
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/syllabus  { "course": "<id>", "term": "<id>", "program": "<target program id>" }
// The caller becomes the lead. They must be active faculty of the target
// program, whose published prospectus lists the course for the open term.
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseSyllabusInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();
    const me = auth.user.id;
    const { course, term: termId, program } = parsed.data;

    // 404 if any of them doesn't exist.
    const [term] = await Promise.all([
      pb.collection("terms").getOne<Term>(termId),
      pb.collection("courses").getOne(course, { fields: "id" }),
      pb.collection("programs").getOne(program, { fields: "id" }),
    ]);

    if (!term.open) {
      return NextResponse.json(
        { error: "This term is closed for submissions." },
        { status: 409 },
      );
    }

    const [faculty, listed, existing, reference] = await Promise.all([
      activeFacultyAmong(pb, program, [me]),
      isListedForProgram(pb, course, term, program),
      pb.collection("syllabi").getList<Syllabus>(1, 1, {
        skipTotal: true,
        expand: "lead",
        filter: pb.filter(
          "course = {:course} && term = {:term} && program = {:program}",
          { course, term: termId, program },
        ),
      }),
      findLiveReference(pb, { program, course, term: termId }),
    ]);

    // Applies to admins too: only faculty of the program can lead its syllabus.
    if (!faculty.has(me)) {
      return NextResponse.json(
        { error: "You must be active faculty of this program." },
        { status: 403 },
      );
    }
    if (!listed) {
      return NextResponse.json(
        {
          error:
            "This course isn't in the program's published prospectus for this term.",
        },
        { status: 409 },
      );
    }
    const duplicate = existing.items[0];
    if (duplicate) {
      const lead = duplicate.expand?.lead?.name ?? "another faculty member";
      return NextResponse.json(
        {
          error: `This program already has a syllabus for this course and term, led by ${lead}. Ask them to add you as a co-author.`,
        },
        { status: 409 },
      );
    }
    if (reference) {
      const source =
        reference.expand?.syllabus?.expand?.program?.code ?? "another program";
      return NextResponse.json(
        {
          error: `This program ${reference.status === "pending" ? "has a pending request to reference" : "references"} ${source}'s syllabus for this course and term. Its chair must withdraw the reference first.`,
        },
        { status: 409 },
      );
    }

    // The unique index (course, term, program) still guards races.
    try {
      const created = await pb.collection("syllabi").create<Syllabus>(
        {
          course,
          term: termId,
          program,
          lead: me,
          co_authors: [],
          ...INITIAL_STATE,
        },
        { expand: SYLLABUS_EXPAND },
      );
      return NextResponse.json(toSyllabusResponse(created, "lead"), {
        status: 201,
      });
    } catch (error) {
      if (isNotUniqueError(error, "course")) {
        return NextResponse.json(
          {
            error:
              "This program already has a syllabus for this course and term. Ask its lead to add you as a co-author.",
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
