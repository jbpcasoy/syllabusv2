"use client";

import {
  listCoAuthorCandidates,
  updateSyllabusCoAuthors,
  type CoAuthorCandidate,
  type SyllabusResponse,
} from "@/lib/syllabus-client";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Field,
  Label,
} from "@headlessui/react";
import { useEffect, useState } from "react";

type CoAuthorsPanelProps = {
  syllabus: SyllabusResponse;
  /** Lead of a draft or returned syllabus: may add and remove. */
  editable: boolean;
  onChanged: (syllabus: SyllabusResponse) => void;
};

export function CoAuthorsPanel({
  syllabus,
  editable,
  onChanged,
}: CoAuthorsPanelProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coAuthors = syllabus.expand?.co_authors ?? [];

  async function save(ids: string[]) {
    setSaving(true);
    setError(null);
    try {
      onChanged(await updateSyllabusCoAuthors(syllabus.id, { co_authors: ids }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg bg-white p-4 shadow ring-1 ring-black/5">
      <h2 className="text-base font-semibold text-gray-900">Co-authors</h2>
      <p className="mt-1 text-sm text-gray-600">
        Co-authors can view this syllabus and its PDFs but can&apos;t change
        it. They must be active faculty of the program.
      </p>

      <ul className="mt-3 divide-y divide-gray-100">
        {coAuthors.map((user) => (
          <li
            key={user.id}
            className="flex items-center justify-between py-2 text-sm"
          >
            <div>
              <div className="font-medium text-gray-900">{user.name || "Unnamed"}</div>
              <div className="text-gray-500">{user.email}</div>
            </div>
            {editable && (
              <button
                type="button"
                onClick={() =>
                  save(syllabus.co_authors.filter((id) => id !== user.id))
                }
                disabled={saving}
                className="font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </li>
        ))}
        {coAuthors.length === 0 && (
          <li className="py-2 text-sm text-gray-500">No co-authors.</li>
        )}
      </ul>

      {editable && (
        <CoAuthorPicker
          syllabusId={syllabus.id}
          excludeIds={syllabus.co_authors}
          disabled={saving}
          onPick={(user) => save([...syllabus.co_authors, user.id])}
        />
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}

type CoAuthorPickerProps = {
  syllabusId: string;
  excludeIds: readonly string[];
  disabled: boolean;
  onPick: (user: CoAuthorCandidate) => void;
};

/** Server-side search over the program's active faculty. */
function CoAuthorPicker({
  syllabusId,
  excludeIds,
  disabled,
  onPick,
}: CoAuthorPickerProps) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<CoAuthorCandidate[]>([]);
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

    listCoAuthorCandidates(syllabusId, search, controller.signal)
      .then((result) => {
        setOptions(result.items);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      });

    return () => controller.abort();
  }, [syllabusId, search]);

  const visible = options.filter((o) => !excludeIds.includes(o.id));

  return (
    <Field className="mt-3">
      <Label className="block text-sm font-medium text-gray-900">
        Add a co-author
      </Label>
      <Combobox
        value={null}
        onChange={(user: CoAuthorCandidate | null) => {
          if (user) onPick(user);
        }}
        onClose={() => setQuery("")}
        disabled={disabled}
      >
        <ComboboxInput
          displayValue={() => ""}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search faculty by name or email…"
          autoComplete="off"
          className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 data-disabled:bg-gray-50"
        />
        <ComboboxOptions
          anchor="bottom start"
          className="z-60 max-h-64 w-(--input-width) overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 [--anchor-gap:4px]"
        >
          {error ? (
            <div role="alert" className="px-3 py-2 text-red-600">
              {error}
            </div>
          ) : visible.length === 0 ? (
            <div className="px-3 py-2 text-gray-500">
              {loading ? "Searching…" : "No other faculty found."}
            </div>
          ) : (
            visible.map((user) => (
              <ComboboxOption
                key={user.id}
                value={user}
                className="cursor-default px-3 py-2 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white"
              >
                <span className="font-medium">{user.name || "Unnamed"}</span>
                <span className="ml-2 opacity-75">{user.email}</span>
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </Combobox>
    </Field>
  );
}
