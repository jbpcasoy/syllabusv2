import { ProgramReviewerManager } from "@/components/program-reviewer/program-reviewer-manager";
import { getCurrentUser } from "@/lib/auth";
import { canSomewhere } from "@/lib/capabilities";
import { redirect } from "next/navigation";

export const metadata = { title: "Program reviewers" };

export default async function ProgramReviewerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/program-reviewer");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ProgramReviewerManager
        canManage={await canSomewhere(user, "programReviewer.write")}
      />
    </main>
  );
}
