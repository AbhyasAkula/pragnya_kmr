/**
 * `{token}` placeholders in editable copy. They are filled when a page is
 * rendered, so numbers in sentences always match Project details and the
 * published villas. Unknown tokens are left as typed.
 */
export type TokenValues = Record<string, string>;

export const TOKEN_HELP: { token: string; meaning: string }[] = [
  { token: "{projectName}", meaning: "Project name" },
  { token: "{shortName}", meaning: "Short project name" },
  { token: "{city}", meaning: "City from Contact details" },
  { token: "{villaCount}", meaning: "Total homes across published villas" },
  { token: "{villaModelCount}", meaning: "Number of published villa models" },
  { token: "{landAcres}", meaning: "Land area in acres" },
  { token: "{openSpacePercent}", meaning: "Open space percentage" },
  { token: "{clubhouseSqFt}", meaning: "Clubhouse area in sq ft" },
  { token: "{amenityCount}", meaning: "Number of amenities" },
  { token: "{possession}", meaning: "Possession date" },
  { token: "{configurations}", meaning: "Configurations, e.g. 3 & 4 BHK" },
  { token: "{phaseLabel}", meaning: "Phase label" },
  { token: "{reraStatus}", meaning: "RERA status label" },
  { token: "{startingPrice}", meaning: "Lowest starting price of published villas" },
];

const TOKEN = /\{([a-zA-Z]+)\}/g;

export function fillString(text: string, tokens: TokenValues): string {
  return text.replace(TOKEN, (match, key: string) => tokens[key] ?? match);
}

/** Recursively fills tokens in every string of a JSON-like value. */
export function fillTokens<T>(value: T, tokens: TokenValues): T {
  if (typeof value === "string") return fillString(value, tokens) as T;
  if (Array.isArray(value)) return value.map((v) => fillTokens(v, tokens)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fillTokens(v, tokens)])) as T;
  }
  return value;
}
