import { authorize, requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { listReferenceSources } from "@/lib/syllabus-reference";
import type { Term } from "@/types/term";
import { NextResponse, type NextRequest } from "next/server";

const PB_ID = /^[a-z0-9]{15}$/;

// GET /api/syllabus-reference/sources?program=<id>&term=<id>&search=foo&page=1&perPage=30
// Chair of `program`: other programs' syllabi for courses in the program's
// published prospectus for the term. Metadata only, no PDFs.
export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;
  const program = searchParams.get("program")?.trim() ?? "";
  const termId = searchParams.get("term")?.trim() ?? "";
  if (!PB_ID.test(program) || !PB_ID.test(termId)) {
    return NextResponse.json(
      { error: "`program` and `term` must be valid ids" },
      { status: 400 },
    );
  }

  const denied = await authorize(auth.user, "syllabusReference.request", {
    program,
  });
  if (denied) return denied;

  try {
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const perPage = Math.min(
      100,
      Math.max(1, Number(searchParams.get("perPage")) || 30),
    );
    const search = searchParams.get("search")?.trim() || undefined;

    const pb = await createAdminPb();
    // 404 if the term doesn't exist.
    const term = await pb
      .collection("terms")
      .getOne<Term>(termId, { fields: "id,school_year,semester" });

    const result = await listReferenceSources(pb, {
      program,
      term,
      search,
      page,
      perPage,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handlePbError(error);
  }
}
