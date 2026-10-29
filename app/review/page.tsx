import { NeedsProxyPanel } from "@/components/review-queue/needs-proxy-panel";
import { ReviewQueueManager } from "@/components/review-queue/review-queue-manager";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Review queue" };

// Open to any signed-in user: the API returns only the stages they hold or
// stand in for, and the manager explains when there are none. Drafts
// waiting on a proxy the user may name are listed below it.
export default async function ReviewQueuePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/review");

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <ReviewQueueManager />
      <NeedsProxyPanel />
    </main>
  );
}
