import { describe, expect, it } from "vitest";
import { SAMPLE_NOTES, TIDY_INPUT_LIMIT, TIDY_ITEM_LIMIT, stripMarkers, tidyNotes } from "./tidy";

describe("tidyNotes", () => {
  it("returns an empty, untruncated result for empty or blank input", () => {
    for (const input of ["", "   ", "\n\n  \n"]) {
      const result = tidyNotes(input);
      expect(result.items).toEqual([]);
      expect(result.inputTruncated).toBe(false);
      expect(result.itemsTruncated).toBe(false);
    }
  });

  it("splits lines, trims whitespace and drops empty lines", () => {
    const result = tidyNotes("  first  \r\n\r\nsecond\n   \nthird");
    expect(result.items).toEqual(["first", "second", "third"]);
    expect(result.removedEmpty).toBe(2);
  });

  it("strips bullet, numbering and checkbox marks", () => {
    expect(stripMarkers("- dash")).toBe("dash");
    expect(stripMarkers("* star")).toBe("star");
    expect(stripMarkers("•bullet")).toBe("bullet");
    expect(stripMarkers("1. numbered")).toBe("numbered");
    expect(stripMarkers("2) numbered")).toBe("numbered");
    expect(stripMarkers("[ ] box")).toBe("box");
    expect(stripMarkers("- [x] nested")).toBe("nested");
  });

  it("keeps text that only looks like a marker", () => {
    expect(stripMarkers("3.5 kg of flour")).toBe("3.5 kg of flour");
    expect(stripMarkers("-5 degrees")).toBe("-5 degrees");
    expect(stripMarkers("2026 plan")).toBe("2026 plan");
  });

  it("drops duplicates case-insensitively and keeps the first spelling", () => {
    const result = tidyNotes("Call Sam\n- call sam\nCALL SAM\nEmail Jo");
    expect(result.items).toEqual(["Call Sam", "Email Jo"]);
    expect(result.removedDuplicates).toBe(2);
  });

  it("tidies the built-in sample into four steps", () => {
    expect(tidyNotes(SAMPLE_NOTES).items).toEqual([
      "call the supplier about Tuesday",
      "update the tracker",
      "draft the weekly summary",
      "check the open invoices",
    ]);
  });

  it("only reads the first 4,000 characters and says so", () => {
    const long = "a".repeat(TIDY_INPUT_LIMIT - 1) + "\nbeyond the limit";
    const result = tidyNotes(long);
    expect(result.inputTruncated).toBe(true);
    expect(result.items).toEqual(["a".repeat(TIDY_INPUT_LIMIT - 1)]);
  });

  it("caps the checklist at 50 items and says so", () => {
    const many = Array.from({ length: 80 }, (_, i) => `task ${i + 1}`).join("\n");
    const result = tidyNotes(many);
    expect(result.items).toHaveLength(TIDY_ITEM_LIMIT);
    expect(result.items[0]).toBe("task 1");
    expect(result.itemsTruncated).toBe(true);
  });

  it("returns markup as plain strings (rendering stays text-only)", () => {
    expect(tidyNotes("<img src=x onerror=alert(1)>").items).toEqual([
      "<img src=x onerror=alert(1)>",
    ]);
  });
});
