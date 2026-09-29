import { createAdminPb, createPb, handlePbError } from "@/lib/pocketbase";
import { parseCampusInput } from "@/lib/validators/campus";
import { Campus } from "@/types/campus";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/campuses?page=1&perPage=30&search=foo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const perPage = Math.min(
      100,
      Math.max(1, Number(searchParams.get("perPage")) || 30),
    );
    const search = searchParams.get("search")?.trim();

    const pb = createPb();
    const result = await pb
      .collection("campuses")
      .getList<Campus>(page, perPage, {
        sort: "name",
        // pb.filter() safely binds params to prevent filter injection
        ...(search && { filter: pb.filter("name ~ {:search}", { search }) }),
      });

    return NextResponse.json(result);
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/campuses  { "name": "Main Campus" }
export async function POST(request: NextRequest) {
  // TODO: verify the caller is allowed to write (session, API key, etc.)
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseCampusInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();
    const created = await pb.collection("campuses").create<Campus>(parsed.data);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handlePbError(error);
  }
}
