"use client";

import {
  listReferenceSources,
  type ReferenceSourceRow,
} from "@/lib/syllabus-reference-client";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { useEffect, useState } from "react";
import { STATUS_LABELS } from "../syllabus/syllabus-status";

type ReferenceSourceComboboxProps = {
  program: string;
  term: string;
  value: ReferenceSourceRow | null;
  onChange: (row: ReferenceSourceRow | null) => void;
  disabled?: boolean;
};

const RESULTS = 20;

function sourceLabel(row: ReferenceSourceRow | null) {
  return row ? `${row.course.code} — ${row.program.code}` : "";
}

/**
 * Searches, on the server, other programs' syllabi for courses in this
 * program's published prospectus for the term.
 */
export function ReferenceSourceCombobox({
  program,
  term,
  value,
  onChange,
  disabled,
}: ReferenceSourceComboboxProps) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<ReferenceSourceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce typing before hitting the server.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!program || !term) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listReferenceSources(
      { program, term, page: 1, perPage: RESULTS, search },
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
  }, [search, program, term]);

  const ready = !!program && !!term;

  return (
    <Combobox
      value={value}
      onChange={onChange}
      onClose={() => setQuery("")}
      by="id"
      disabled={disabled || !ready}
    >
      <div className="relative mt-1">
        <ComboboxInput
          displayValue={sourceLabel}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            ready
              ? "Search by course or program…"
              : "Choose a program and term first"
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
              : "No other program has a syllabus for your courses in this term yet."}
          </div>
        ) : (
          <>
            {options.map((row) => (
              <ComboboxOption
                key={row.id}
                value={row}
                className="cursor-default px-3 py-2 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white"
              >
                <span className="font-medium">{row.course.code}</span>
                <span className="ml-2">{row.course.title}</span>
                <span className="block text-xs opacity-75">
                  {row.program.code} · led by {row.lead_name || "—"} ·{" "}
                  {STATUS_LABELS[row.status]}
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
