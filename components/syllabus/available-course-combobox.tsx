"use client";

import {
  listAvailableSyllabi,
  type AvailableSyllabusRow,
} from "@/lib/syllabus-client";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { useEffect, useState } from "react";

type AvailableCourseComboboxProps = {
  term: string;
  program: string;
  value: AvailableSyllabusRow | null;
  onChange: (row: AvailableSyllabusRow | null) => void;
  disabled?: boolean;
};

const RESULTS = 20;

function rowLabel(row: AvailableSyllabusRow | null) {
  return row ? `${row.course.code} — ${row.course.title}` : "";
}

/**
 * Searches, on the server, the courses the caller may author for one term
 * and program. Courses the program already covers (its own syllabus or a
 * live reference) are shown but can't be picked.
 */
export function AvailableCourseCombobox({
  term,
  program,
  value,
  onChange,
  disabled,
}: AvailableCourseComboboxProps) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<AvailableSyllabusRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce typing before hitting the server.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!term || !program) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listAvailableSyllabi(
      { page: 1, perPage: RESULTS, search, term, program },
      controller.signal,
    )
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
  }, [search, term, program]);

  const ready = !!term && !!program;

  return (
    <Combobox
      value={value}
      onChange={onChange}
      onClose={() => setQuery("")}
      by={(a, b) => a?.course.id === b?.course.id}
      disabled={disabled || !ready}
    >
      <div className="relative mt-1">
        <ComboboxInput
          displayValue={rowLabel}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            ready ? "Search by code or title…" : "Choose a term and program first"
          }
          autoComplete="off"
          className="block w-full rounded-md border-0 py-2 pl-3 pr-9 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 data-disabled:bg-gray-50"
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400">
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
            {loading
              ? "Searching…"
              : "No courses found in this program's published prospectus for this term."}
          </div>
        ) : (
          <>
            {options.map((row) => (
              <ComboboxOption
                key={row.course.id}
                value={row}
                disabled={!!row.syllabus || !!row.reference}
                className="cursor-default px-3 py-2 text-gray-900 select-none data-disabled:text-gray-400 data-focus:bg-indigo-600 data-focus:text-white"
              >
                <span className="font-medium">{row.course.code}</span>
                <span className="ml-2">{row.course.title}</span>
                <span className="block text-xs opacity-75">
                  {row.syllabus
                    ? `Already started, led by ${row.syllabus.lead_name || "another faculty member"}`
                    : row.reference
                      ? `${row.reference.status === "pending" ? "Reference requested" : "Referenced"} from ${row.reference.source_program_code || "another program"}`
                      : row.year_level}
                </span>
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
