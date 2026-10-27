import { checklistCriteria, CURRENT_FORM17 } from "@/lib/forms";
import {
  FORM17_ANSWERS,
  MAX_FORM17_REMARKS,
  MAX_FORM17_SUGGESTIONS,
  type Form17AnswerInput,
  type Form17Input,
} from "@/types/form17";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const CRITERIA = new Set(checklistCriteria(CURRENT_FORM17).map((c) => c.key));

/** Validates against the current Form 17 revision. */
export function parseForm17Input(body: unknown): ParseResult<Form17Input> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { answers, suggestions } = body as Record<string, unknown>;

  if (!Array.isArray(answers) || answers.length > CRITERIA.size) {
    return { ok: false, error: "`answers` must be a list of criterion answers" };
  }

  const parsed: Form17AnswerInput[] = [];
  const seen = new Set<string>();
  for (const item of answers) {
    if (typeof item !== "object" || item === null) {
      return { ok: false, error: "Each answer must be an object" };
    }
    const { criterion, answer, remarks } = item as Record<string, unknown>;
    if (typeof criterion !== "string" || !CRITERIA.has(criterion)) {
      return { ok: false, error: `Unknown criterion: ${String(criterion)}` };
    }
    if (seen.has(criterion)) {
      return { ok: false, error: `Criterion ${criterion} is listed twice` };
    }
    seen.add(criterion);
    if (!(FORM17_ANSWERS as readonly unknown[]).includes(answer)) {
      return {
        ok: false,
        error: `Criterion ${criterion} must be answered \`yes\` or \`no\``,
      };
    }
    if (remarks !== undefined && remarks !== null && typeof remarks !== "string") {
      return { ok: false, error: `Remarks for ${criterion} must be text` };
    }
    const trimmed = (remarks ?? "").trim();
    if (trimmed.length > MAX_FORM17_REMARKS) {
      return {
        ok: false,
        error: `Remarks for ${criterion} must be at most ${MAX_FORM17_REMARKS} characters`,
      };
    }
    if (answer === "no" && !trimmed) {
      return { ok: false, error: `A "No" on ${criterion} needs remarks` };
    }
    parsed.push({ criterion, answer: answer as Form17AnswerInput["answer"], remarks: trimmed });
  }

  let cleanSuggestions: string | undefined;
  if (suggestions !== undefined) {
    if (typeof suggestions !== "string") {
      return { ok: false, error: "`suggestions` must be text" };
    }
    cleanSuggestions = suggestions.trim();
    if (cleanSuggestions.length > MAX_FORM17_SUGGESTIONS) {
      return {
        ok: false,
        error: `\`suggestions\` must be at most ${MAX_FORM17_SUGGESTIONS} characters`,
      };
    }
  }

  if (parsed.length === 0 && cleanSuggestions === undefined) {
    return { ok: false, error: "Nothing to save" };
  }

  return {
    ok: true,
    data: {
      answers: parsed,
      ...(cleanSuggestions !== undefined && { suggestions: cleanSuggestions }),
    },
  };
}
