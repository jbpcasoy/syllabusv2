"use client";

import type { NavItem } from "@/lib/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarProps = {
  items: NavItem[];
};

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-40 shrink-0 border-r border-gray-200 bg-white sm:w-56">
      <nav aria-label="Main navigation" className="sticky top-0 p-3 sm:p-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
