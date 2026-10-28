"use client";

import { listPrograms } from "@/lib/program-client";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { useEffect, useState } from "react";

/** The slice of a program the filter needs. */
export type ProgramOption = { id: string; code: string; name: string };

type ProgramFilterComboboxProps = {
  value: ProgramOption | null;
  onChange: (program: ProgramOption | null) => void;
};

const RESULTS = 20;

const programLabel = (program: ProgramOption | null) =>
  program ? `${program.code} — ${program.name}` : "";

/**
 * Picks one program to filter by, searching on the server as you type.
 * Copied from CourseCombobox; clearing the text clears the filter.
 */
export function ProgramFilterCombobox({ value, onChange }: ProgramFilterComboboxProps) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<ProgramOption[]>([]);
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

    listPrograms({ page: 1, perPage: RESULTS, search }, controller.signal)
      .then((result) => {
        setOptions(result.items.map(({ id, code, name }) => ({ id, code, name })));
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
    <Combobox value={value} onChange={onChange} onClose={() => setQuery("")} by="id">
      <div className="relative">
        <ComboboxInput
          aria-label="Filter by program"
          displayValue={programLabel}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value === "") onChange(null);
          }}
          placeholder="All programs"
          autoComplete="off"
          className="block w-full rounded-md border-0 py-2 pl-3 pr-9 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
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
            {loading ? "Searching…" : "No programs found."}
          </div>
        ) : (
          <>
            {options.map((program) => (
              <ComboboxOption
                key={program.id}
                value={program}
                className="cursor-default px-3 py-2 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white"
              >
                <span className="font-medium">{program.code}</span>
                <span className="ml-2">{program.name}</span>
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
