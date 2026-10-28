"use client";

import { listUserOptions, type UserOption } from "@/lib/user-client";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { useEffect, useState } from "react";

type UserComboboxProps = {
  value: UserOption | null;
  onChange: (user: UserOption | null) => void;
  disabled?: boolean;
  placeholder?: string;
};

const RESULTS = 20;

export function userLabel(user: UserOption | null) {
  if (!user) return "";
  return user.name ? `${user.name} (${user.email})` : user.email;
}

/**
 * Searches users on the server as you type, for assigning a role. The user
 * directory is university-wide, so it is never loaded into the browser in full.
 */
export function UserCombobox({
  value,
  onChange,
  disabled,
  placeholder = "Search by name or email…",
}: UserComboboxProps) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<UserOption[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce typing before hitting the server.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listUserOptions({ perPage: RESULTS, search }, controller.signal)
      .then((result) => {
        setOptions(result.items);
        setTotal(result.totalItems);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      });

    return () => controller.abort();
  }, [search]);

  return (
    <Combobox
      value={value}
      onChange={onChange}
      onClose={() => setQuery("")}
      by="id"
      disabled={disabled}
    >
      <div className="relative mt-1">
        <ComboboxInput
          displayValue={userLabel}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="block w-full rounded-md border-0 py-2 pl-3 pr-9 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 data-disabled:bg-gray-50"
        />
        <ComboboxButton
          aria-label="Show options"
          className="absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-500"
        >
          <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="size-4">
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </ComboboxButton>
      </div>

      <ComboboxOptions
        anchor="bottom start"
        className="z-60 max-h-64 w-(--input-width) overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 [--anchor-gap:4px]"
      >
        {error ? (
          <div role="alert" className="px-3 py-2 text-red-600">
            {error}
          </div>
        ) : options.length === 0 ? (
          <div className="px-3 py-2 text-gray-500">
            {loading ? "Searching…" : "No users found."}
          </div>
        ) : (
          <>
            {options.map((user) => (
              <ComboboxOption
                key={user.id}
                value={user}
                className="cursor-default px-3 py-2 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white"
              >
                <span className="font-medium">{user.name || user.email}</span>
                {user.name && <span className="ml-2">{user.email}</span>}
              </ComboboxOption>
            ))}
            {total > options.length && (
              <div className="px-3 py-2 text-xs text-gray-500">
                Showing the first {options.length} of {total}. Keep typing to
                narrow it down.
              </div>
            )}
          </>
        )}
      </ComboboxOptions>
    </Combobox>
  );
}
