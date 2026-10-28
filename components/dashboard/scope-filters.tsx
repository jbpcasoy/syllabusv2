"use client";

import type { DashboardFilters, ProgramOrg } from "@/lib/dashboard-client";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Field,
  Label,
  Select,
} from "@headlessui/react";
import { useMemo, useState } from "react";

const selectClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600";

const MAX_OPTIONS = 50;

type Option = { id: string; name: string };

function uniqueBy(programs: readonly ProgramOrg[], id: keyof ProgramOrg, name: keyof ProgramOrg) {
  const seen = new Map<string, Option>();
  for (const p of programs) {
    const key = p[id];
    if (key && !seen.has(key)) seen.set(key, { id: key, name: p[name] || key });
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * College, department and program pickers built only from the programs in
 * the caller's scope, so nothing on offer answers 403. Narrowing a level
 * clears the levels below it when they no longer fit.
 */
export function ScopeFilters({
  programs,
  value,
  onChange,
}: {
  programs: readonly ProgramOrg[];
  value: DashboardFilters;
  onChange: (next: DashboardFilters) => void;
}) {
  const colleges = useMemo(() => uniqueBy(programs, "collegeId", "collegeName"), [programs]);
  const inCollege = useMemo(
    () => programs.filter((p) => !value.college || p.collegeId === value.college),
    [programs, value.college],
  );
  const departments = useMemo(
    () => uniqueBy(inCollege, "departmentId", "departmentName"),
    [inCollege],
  );
  const inDepartment = useMemo(
    () => inCollege.filter((p) => !value.department || p.departmentId === value.department),
    [inCollege, value.department],
  );
  const selectedProgram = programs.find((p) => p.id === value.program) ?? null;

  return (
    <>
      {colleges.length > 1 && (
        <Field className="lg:w-56">
          <Label className="text-sm font-medium text-gray-900">College</Label>
          <Select
            value={value.college ?? ""}
            onChange={(e) => onChange({ college: e.target.value || undefined })}
            className={selectClass}
          >
            <option value="">All colleges</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {departments.length > 1 && (
        <Field className="lg:w-56">
          <Label className="text-sm font-medium text-gray-900">Department</Label>
          <Select
            value={value.department ?? ""}
            onChange={(e) =>
              onChange({ college: value.college, department: e.target.value || undefined })
            }
            className={selectClass}
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {programs.length > 1 && (
        <ProgramCombobox
          options={inDepartment}
          value={selectedProgram}
          onChange={(program) =>
            onChange({ ...value, program: program?.id ?? undefined })
          }
        />
      )}
    </>
  );
}

/**
 * Searches the scoped programs already loaded (no request per keystroke):
 * the scope list is the whole universe of valid choices.
 */
function ProgramCombobox({
  options,
  value,
  onChange,
}: {
  options: readonly ProgramOrg[];
  value: ProgramOrg | null;
  onChange: (program: ProgramOrg | null) => void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const matches = options.filter(
    (p) =>
      !needle ||
      p.code.toLowerCase().includes(needle) ||
      p.name.toLowerCase().includes(needle),
  );

  return (
    <Field className="lg:w-72">
      <Label className="text-sm font-medium text-gray-900">Program</Label>
      <Combobox
        value={value}
        onChange={onChange}
        onClose={() => setQuery("")}
        by={(a, b) => a?.id === b?.id}
      >
        <div className="relative mt-1">
          <ComboboxInput
            displayValue={(p: ProgramOrg | null) => (p ? `${p.code} — ${p.name}` : "")}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value === "") onChange(null);
            }}
            placeholder="All programs"
            autoComplete="off"
            className="block w-full rounded-md border-0 py-2 pl-3 pr-9 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          />
          <ComboboxButton
            aria-label="Show programs"
            className="absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400"
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
          className="z-40 max-h-64 w-(--input-width) overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 [--anchor-gap:4px] empty:invisible"
        >
          {matches.slice(0, MAX_OPTIONS).map((p) => (
            <ComboboxOption
              key={p.id}
              value={p}
              className="cursor-default px-3 py-2 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white"
            >
              <span className="font-medium">{p.code}</span>
              <span className="ml-2">{p.name}</span>
            </ComboboxOption>
          ))}
          {matches.length === 0 && (
            <div className="px-3 py-2 text-gray-500">No programs match.</div>
          )}
          {matches.length > MAX_OPTIONS && (
            <div className="px-3 py-2 text-xs text-gray-500">
              Showing {MAX_OPTIONS} of {matches.length}. Keep typing to narrow it down.
            </div>
          )}
        </ComboboxOptions>
      </Combobox>
    </Field>
  );
}
