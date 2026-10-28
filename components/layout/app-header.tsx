import { getCurrentUser, toSessionUser } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";
import { countUnread } from "@/lib/notification";
import { createAdminPb } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import Link from "next/link";
import { HeaderAuth } from "./header-auth";
import { NotificationBell } from "./notification-bell";

/** The badge must never break the header; the bell refetches anyway. */
async function unreadFor(userId: string): Promise<number> {
  try {
    return await countUnread(await createAdminPb(), userId);
  } catch (error) {
    console.error("Failed to count unread notifications", error);
    return 0;
  }
}

export async function AppHeader() {
  const user = await getCurrentUser();
  const [sessionUser, unread] = user
    ? await Promise.all([
        getUserRoles(user.id).then((roles) => toSessionUser(user, roles)),
        unreadFor(user.id),
      ])
    : [null, 0];

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-lg font-semibold text-gray-900 hover:text-indigo-600"
        >
          {APP_NAME}
        </Link>

        <div className="flex items-center gap-2">
          {sessionUser && <NotificationBell initialUnread={unread} />}
          <HeaderAuth user={sessionUser} />
        </div>
      </div>
    </header>
  );
}
