import { createAdminPb } from "@/lib/pocketbase";
import type { ProgramReviewer, ProgramReviewerResponse } from "@/types/program-reviewer";
import "server-only";

export function toProgramReviewerResponse(
  record: ProgramReviewer,
): ProgramReviewerResponse {
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

/** True if the program already has an active reviewer (optionally ignoring one record). */
export async function programHasActiveReviewer(
  programId: string,
  exceptId?: string,
): Promise<boolean> {
  const pb = await createAdminPb();
  const result = await pb.collection("program_reviewers").getList(1, 1, {
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
