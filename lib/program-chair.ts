import { createAdminPb } from "@/lib/pocketbase";
import type { Program } from "@/types/program";
import type { ProgramChair, ProgramChairResponse } from "@/types/program-chair";
import "server-only";

export function toProgramChairResponse(
  record: ProgramChair,
): ProgramChairResponse {
  const user = record.expand?.user;
  const program = record.expand?.program;
  return {
    id: record.id,
    user: record.user,
    program: record.program,
    active: record.active,
    created: record.created,
    updated: record.updated,
    expand: {
      ...(user && {
        user: { id: user.id, name: user.name, email: user.email },
      }),
      ...(program && {
        program: { id: program.id, name: program.name, code: program.code },
      }),
    },
  };
}

/** True if the program already has an active chair (optionally ignoring one record). */
export async function programHasActiveChair(
  programId: string,
  exceptId?: string,
): Promise<boolean> {
  const pb = await createAdminPb();
  const result = await pb.collection("program_chairs").getList(1, 1, {
    skipTotal: true,
    filter: exceptId
      ? pb.filter(
          "program = {:programId} && active = true && id != {:exceptId}",
          {
            programId,
            exceptId,
          },
        )
      : pb.filter("program = {:programId} && active = true", { programId }),
  });
  return result.items.length > 0;
}

/** Only active assignments count. Handy for future permission checks. */
export async function isChairOfProgram(
  userId: string,
  programId: string,
): Promise<boolean> {
  const pb = await createAdminPb();
  const result = await pb.collection("program_chairs").getList(1, 1, {
    skipTotal: true,
    filter: pb.filter(
      "user = {:userId} && program = {:programId} && active = true",
      { userId, programId },
    ),
  });
  return result.items.length > 0;
}

/** Programs a user currently chairs. */
export async function listProgramsChairedBy(
  userId: string,
): Promise<Program[]> {
  const pb = await createAdminPb();
  const rows = await pb.collection("program_chairs").getFullList<ProgramChair>({
    expand: "program",
    filter: pb.filter("user = {:userId} && active = true", { userId }),
  });
  return rows
    .map((row) => row.expand?.program)
    .filter((p): p is Program => !!p)
    .sort((a, b) => a.name.localeCompare(b.name));
}
