import { getCurrentUser, toSessionUser } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";
import { HeaderAuth } from "./header-auth";

export async function AppHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-lg font-semibold text-gray-900 hover:text-indigo-600"
        >
          {APP_NAME}
        </Link>

        <HeaderAuth user={user ? toSessionUser(user) : null} />
      </div>
    </header>
  );
}
