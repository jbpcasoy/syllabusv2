"use client";

import { logout } from "@/lib/auth-client";
import { ROLE_LABELS, type SessionUser } from "@/types/user";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type HeaderAuthProps = {
  user: SessionUser | null;
};

function getInitials(user: SessionUser) {
  const source = user.name?.trim() || user.email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function HeaderAuth({ user }: HeaderAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
      router.refresh(); // re-run server components without the cookie
    } catch {
      setLoggingOut(false);
    }
  }

  if (!user) {
    // The login page already is the sign-in form, so don't show a link to it.
    if (pathname === "/login") return null;
    return (
      <Link
        href="/login"
        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Sign in
      </Link>
    );
  }

  return (
    <Menu as="div" className="relative">
      <MenuButton className="flex items-center gap-3 rounded-full py-1 pr-2 pl-1 hover:bg-gray-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:pr-3">
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white"
        >
          {getInitials(user)}
        </span>
        <span className="hidden text-sm font-medium text-gray-900 sm:block">
          {user.name || user.email}
        </span>
      </MenuButton>

      <MenuItems
        transition
        anchor="bottom end"
        className="z-40 mt-2 w-60 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 transition duration-100 focus:outline-none data-closed:scale-95 data-closed:opacity-0"
      >
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="truncate text-sm font-medium text-gray-900">
            {user.name || "Signed in"}
          </p>
          <p className="truncate text-xs text-gray-500">{user.email}</p>
          <p className="mt-1 text-xs text-gray-500">
            {user.role ? ROLE_LABELS[user.role] : "No role assigned"}
          </p>
        </div>

        <MenuItem>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 data-focus:bg-gray-50 disabled:opacity-50"
          >
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
