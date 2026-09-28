import { describe, expect, it } from "vitest";
import { contactSchema, qrDestination, tidyLines } from "./logic";
describe("QR entry", () => {
  it("discards arbitrary destinations and personal query strings", () => {
    expect(
      qrDestination(
        "https://example.com/q?next=https://evil.test&email=private&ut m=a&utm_medium=print",
      ),
    ).toBe("/card?utm_medium=print&utm_source=card");
  });
  it("rejects unsafe campaign values", () => {
    expect(qrDestination("/q?utm_source=%3Cscript%3E")).toBe(
      "/card?utm_source=card",
    );
  });
});
describe("contact validation", () => {
  const message = {
    name: "Sample Person",
    email: "sample@example.com",
    message: "A thoughtful idea to discuss together.",
    consent: true,
    contextUrl: "",
  };
  it("accepts expected content", () =>
    expect(contactSchema.safeParse(message).success).toBe(true));
  it("requires reply consent", () =>
    expect(
      contactSchema.safeParse({ ...message, consent: false }).success,
    ).toBe(false));
  it("rejects unsafe context links", () =>
    expect(
      contactSchema.safeParse({ ...message, contextUrl: "javascript:alert(1)" })
        .success,
    ).toBe(false));
  it("rejects oversized messages", () =>
    expect(
      contactSchema.safeParse({ ...message, message: "a".repeat(1201) })
        .success,
    ).toBe(false));
});
it("makes a stable unique checklist without interpreting HTML", () => {
  expect(tidyLines("  - Do a thing\nDo a thing\n\n<script>")).toEqual([
    "Do a thing",
    "<script>",
  ]);
});
