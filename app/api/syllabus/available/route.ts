import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { listAvailable } from "@/lib/syllabus";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/syllabus/available?page=1&perPage=30&search=foo&term=<id>&program=<id>
// Courses the caller may author: listed in published prospectuses of their
// programs for open terms. Rows say whether the program already has one.
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
    const search = searchParams.get("search")?.trim() || undefined;
    const term = searchParams.get("term")?.trim() || undefined;
    const program = searchParams.get("program")?.trim() || undefined;

    const pb = await createAdminPb();
    const result = await listAvailable(pb, auth.user.id, {
      page,
      perPage,
      search,
      term,
      program,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handlePbError(error);
  }
}
