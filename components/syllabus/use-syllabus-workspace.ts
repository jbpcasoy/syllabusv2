"use client";

import {
  getSyllabus,
  listSyllabusVersions,
  type SyllabusResponse,
  type SyllabusVersionResponse,
} from "@/lib/syllabus-client";
import { useEffect, useState } from "react";

/** The syllabus and its versions (newest first), for the workspaces. */
export function useSyllabusWorkspace(id: string, reloadKey: number) {
  const [syllabus, setSyllabus] = useState<SyllabusResponse | null>(null);
  const [versions, setVersions] = useState<SyllabusVersionResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);

    // 100 is the API's cap; a syllabus never gets near it in practice.
    Promise.all([
      getSyllabus(id, controller.signal),
      listSyllabusVersions(id, { page: 1, perPage: 100 }, controller.signal),
    ])
      .then(([loaded, list]) => {
        setSyllabus(loaded);
        setVersions(list.items);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
      });

    return () => controller.abort();
  }, [id, reloadKey]);

  return { syllabus, versions, error };
}
