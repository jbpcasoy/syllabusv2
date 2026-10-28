import { NotificationsManager } from "@/components/notification/notifications-manager";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Notifications" };

// Any signed-in user; the API returns only their own notifications.
export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/notifications");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <NotificationsManager />
    </main>
  );
}
