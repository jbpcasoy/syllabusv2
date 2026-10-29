import { ProgramJoinRequestManager } from "@/components/program-join-request/program-join-request-manager";
import { getCurrentUser } from "@/lib/auth";
import { can, canSomewhere } from "@/lib/capabilities";
import { getUserRoles } from "@/lib/roles";
import { redirect } from "next/navigation";

export const metadata = { title: "Join requests" };

export default async function ProgramJoinRequestPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/program-join-request");

  // Programs where the user may approve their own request: ones they chair
  // and whose department they head. Admin may approve their own anywhere.
  const roles = await getUserRoles(user.id);
  const approveOwn: true | string[] = roles.isAdmin
    ? true
    : (
        await Promise.all(
          roles.chairOfPrograms.map(async (program) =>
            (await can(user, "programJoinRequest.approveOwn", { program }))
              ? program
              : null,
          ),
        )
      ).filter((program): program is string => program !== null);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ProgramJoinRequestManager
        canReview={await canSomewhere(user, "programJoinRequest.review")}
        approveOwn={approveOwn}
        currentUserId={user.id}
      />
    </main>
  );
}
