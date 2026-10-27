"use client";

import {
  listLeadCandidates,
  transferLead,
  type CoAuthorCandidate,
  type SyllabusResponse,
} from "@/lib/syllabus-client";
import {
  Checkbox,
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Field,
  Label,
} from "@headlessui/react";
import { useEffect, useState } from "react";

type TransferLeadDialogProps = {
  open: boolean;
  syllabus: SyllabusResponse;
  onClose: () => void;
  onTransferred: () => void;
};

/** The program chair (or admin) hands the syllabus to another faculty member. */
export function TransferLeadDialog({
  open,
  syllabus,
  onClose,
  onTransferred,
}: TransferLeadDialogProps) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<CoAuthorCandidate[]>([]);
  const [selected, setSelected] = useState<CoAuthorCandidate | null>(null);
  const [keepPrevious, setKeepPrevious] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce typing before hitting the server.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    listLeadCandidates(syllabus.id, search, controller.signal)
      .then((result) => setOptions(result.items))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
      });
    return () => controller.abort();
  }, [open, syllabus.id, search]);

  async function handleTransfer() {
    if (!selected) return setError("Choose the new lead.");
    setSaving(true);
    setError(null);
    try {
      await transferLead(syllabus.id, {
        lead: selected.id,
        keep_previous: keepPrevious,
      });
      onTransferred();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  const currentLead = syllabus.expand?.lead?.name || "the current lead";

  return (
    <Dialog
      open={open}
      onClose={saving ? () => {} : onClose}
      className="relative z-50"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-900/50 transition-opacity duration-200 data-closed:opacity-0"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl transition duration-200 data-closed:scale-95 data-closed:opacity-0"
        >
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Transfer lead
          </DialogTitle>
          <Description className="mt-2 text-sm text-gray-600">
            Hand {syllabus.expand?.course?.code || "this syllabus"} from{" "}
            {currentLead} to another active faculty member of the program.
            Only the lead can edit and submit it.
          </Description>

          <Field className="mt-4">
            <Label className="block text-sm font-medium text-gray-900">
              New lead
            </Label>
            <Combobox
              value={selected}
              onChange={setSelected}
              onClose={() => setQuery("")}
              disabled={saving}
            >
              <ComboboxInput
                displayValue={(user: CoAuthorCandidate | null) => user?.name ?? ""}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search faculty by name or email…"
                autoComplete="off"
                className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
              />
              <ComboboxOptions
                anchor="bottom start"
                className="z-60 max-h-64 w-(--input-width) overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 [--anchor-gap:4px]"
              >
                {options.length === 0 ? (
                  <div className="px-3 py-2 text-gray-500">No faculty found.</div>
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

          <Field className="mt-4 flex items-center gap-2">
            <Checkbox
              checked={keepPrevious}
              onChange={setKeepPrevious}
              disabled={saving}
              className="group size-4 rounded border border-gray-300 bg-white data-checked:border-indigo-600 data-checked:bg-indigo-600"
            >
              <svg
                className="hidden size-3.5 text-white group-data-checked:block"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path d="M3 8l3 3 5-6" stroke="currentColor" strokeWidth={2} />
              </svg>
            </Checkbox>
            <Label className="text-sm text-gray-700">
              Keep {currentLead} as a co-author
            </Label>
          </Field>

          {error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTransfer}
              disabled={saving || !selected}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? "Transferring…" : "Transfer"}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
