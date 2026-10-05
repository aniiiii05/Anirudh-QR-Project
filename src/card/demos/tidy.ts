/**
 * The useful workflow — deterministic note tidying.
 * No AI provider, no network, no storage: the same input always produces the
 * same checklist. Output is plain strings; the UI renders them as text only.
 */

export const TIDY_INPUT_LIMIT = 4000;
export const TIDY_ITEM_LIMIT = 50;

export type TidyResult = {
  items: string[];
  /** Number of raw lines considered (after the input limit). */
  lineCount: number;
  removedEmpty: number;
  removedDuplicates: number;
  /** True when the input was longer than the limit and only its start was used. */
  inputTruncated: boolean;
  /** True when more unique items existed than the output limit allows. */
  itemsTruncated: boolean;
};

/** Leading list markers: bullets, dashes, numbering and checkbox brackets. */
const MARKERS: RegExp[] = [
  /^[•·▪◦‣○●■□☐☑✓✔]\s*/u,
  /^[-*+–—>]+\s+/u,
  /^\(?\d{1,3}[.)]\s+/u,
  /^\[[ xX✓]?\]\s*/u,
];

export function stripMarkers(line: string): string {
  let current = line.trim();
  for (let guard = 0; guard < 4; guard += 1) {
    const match = MARKERS.find((re) => re.test(current));
    if (!match) break;
    current = current.replace(match, "").trim();
  }
  return current;
}

export function tidyNotes(
  raw: string,
  {
    inputLimit = TIDY_INPUT_LIMIT,
    itemLimit = TIDY_ITEM_LIMIT,
  }: { inputLimit?: number; itemLimit?: number } = {},
): TidyResult {
  const inputTruncated = raw.length > inputLimit;
  const text = inputTruncated ? raw.slice(0, inputLimit) : raw;
  if (text.trim() === "") {
    return {
      items: [],
      lineCount: 0,
      removedEmpty: 0,
      removedDuplicates: 0,
      inputTruncated,
      itemsTruncated: false,
    };
  }
  const lines = text.split(/\r\n|\r|\n/);
  const seen = new Set<string>();
  const unique: string[] = [];
  let removedEmpty = 0;
  let removedDuplicates = 0;
  for (const line of lines) {
    const cleaned = stripMarkers(line).replace(/\s+/g, " ");
    if (!cleaned) {
      removedEmpty += 1;
      continue;
    }
    const key = cleaned.toLocaleLowerCase();
    if (seen.has(key)) {
      removedDuplicates += 1;
      continue;
    }
    seen.add(key);
    unique.push(cleaned);
  }
  return {
    items: unique.slice(0, itemLimit),
    lineCount: lines.length,
    removedEmpty,
    removedDuplicates,
    inputTruncated,
    itemsTruncated: unique.length > itemLimit,
  };
}

export const SAMPLE_NOTES = [
  "- call the supplier about Tuesday",
  "  * update the tracker   ",
  "",
  "• Call the supplier about Tuesday",
  "1. draft the weekly summary",
  "[ ] check the open invoices",
  "",
  "- update the tracker",
].join("\n");
