import { ProgramJoinRequestManager } from "@/components/program-join-request/program-join-request-manager";
import { getCurrentUser } from "@/lib/auth";
import { canSomewhere } from "@/lib/capabilities";
import { redirect } from "next/navigation";

export const metadata = { title: "Join requests" };

export default async function ProgramJoinRequestPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/program-join-request");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ProgramJoinRequestManager
        canReview={await canSomewhere(user, "programJoinRequest.review")}
        currentUserId={user.id}
      />
    </main>
  );
}
