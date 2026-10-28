"use client";

import { formatDate } from "@/lib/format-date";
import {
  listStandInCandidates,
  listStandIns,
  setStandIn,
  type StandInCandidate,
  type StandInResponse,
} from "@/lib/syllabus-client";
import { CHAIN_ROLES } from "@/lib/syllabus-workflow";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Field,
  Label,
} from "@headlessui/react";
import { useEffect, useState } from "react";

type StandInsPanelProps = {
  syllabusId: string;
  /** Stages whose stand-in the viewer may set or clear now. */
  designatableStages: readonly number[];
  /** Called after a change so the page can refresh who may decide. */
  onChanged: () => void;
};

/**
 * Who acts at each stage in place of a holder who wrote the syllabus.
 * The stage-1 stand-in is the proxy.
 */
export function StandInsPanel({
  syllabusId,
  designatableStages,
  onChanged,
}: StandInsPanelProps) {
  const [items, setItems] = useState<StandInResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listStandIns(syllabusId, controller.signal)
      .then((result) => {
        setItems(result.items);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      });

    return () => controller.abort();
  }, [syllabusId, reloadKey]);

  async function save(stage: number, user: string | null) {
    setSaving(true);
    setError(null);
    try {
      setItems((await setStandIn(syllabusId, { stage, user })).items);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg bg-white p-4 shadow ring-1 ring-black/5">
      <h2 className="text-base font-semibold text-gray-900">
        Proxy and stand-ins
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        When a reviewer leads or co-authors this syllabus, someone else acts
        at their stage. At stage 1 this is the proxy, who must be active
        faculty of the program.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-3 flex items-center justify-between rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      <ul
        className={`mt-3 divide-y divide-gray-100 ${loading ? "opacity-50" : ""}`}
      >
        {CHAIN_ROLES.map(({ stage, label }) => {
          const current = items.find((item) => item.stage === stage);
          const editable = designatableStages.includes(stage);
          return (
            <li key={stage} className="py-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-gray-900">
                    Stage {stage}: {label}
                    {stage === 1 && " (proxy)"}
                  </div>
                  {current ? (
                    <div className="text-gray-600">
                      {current.user.name || current.user.email}
                      <span className="text-gray-500">
                        {" "}
                        · set by {current.assigned_by.name || "—"},{" "}
                        {formatDate(current.updated)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-gray-500">None. The {label} reviews.</div>
                  )}
                </div>
                {editable && current && (
                  <button
                    type="button"
                    onClick={() => save(stage, null)}
                    disabled={saving}
                    className="font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                  >
                    Clear
                  </button>
                )}
              </div>
              {editable && (
                <StandInPicker
                  syllabusId={syllabusId}
                  stage={stage}
                  label={current ? "Replace" : "Designate"}
                  disabled={saving}
                  onPick={(user) => save(stage, user.id)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type StandInPickerProps = {
  syllabusId: string;
  stage: number;
  label: string;
  disabled: boolean;
  onPick: (user: StandInCandidate) => void;
};

/** Server-side search; stage 1 offers program faculty, later stages users. */
function StandInPicker({
  syllabusId,
  stage,
  label,
  disabled,
  onPick,
}: StandInPickerProps) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<StandInCandidate[]>([]);
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

    listStandInCandidates(syllabusId, stage, search, controller.signal)
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
  }, [syllabusId, stage, search]);

  return (
    <Field className="mt-2">
      <Label className="sr-only">
        {label} stand-in for stage {stage}
      </Label>
      <Combobox
        value={null}
        onChange={(user: StandInCandidate | null) => {
          if (user) onPick(user);
        }}
        onClose={() => setQuery("")}
        disabled={disabled}
      >
        <ComboboxInput
          displayValue={() => ""}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`${label}: search by name or email…`}
          autoComplete="off"
          className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 data-disabled:bg-gray-50"
        />
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
              {loading ? "Searching…" : "No one found."}
            </div>
          ) : (
            options.map((user) => (
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
