import "server-only";

/**
 * PII-safe server logging. Records only an event name and the error's
 * class/code — never messages, query parameters or request bodies, which can
 * contain names and phone numbers (e.g. Postgres "Failing row contains …").
 */
export function logServerEvent(event: string, error?: unknown) {
  const entry: Record<string, string> = { event };
  if (error && typeof error === "object") {
    const e = error as { name?: unknown; code?: unknown };
    if (typeof e.name === "string") entry.error = e.name;
    if (typeof e.code === "string") entry.code = e.code;
  }
  (error ? console.error : console.info)(JSON.stringify(entry));
}
