import { describe, expect, it } from "vitest";
import { classifyOrder, computeOtif, describeOrder, samples } from "./otif";

describe("OTIF sample data", () => {
  it("has ten fictional orders in each sample period", () => {
    expect(samples.A.orders).toHaveLength(10);
    expect(samples.B.orders).toHaveLength(10);
    const ids = [...samples.A.orders, ...samples.B.orders].map((o) => o.id);
    expect(new Set(ids).size).toBe(20);
  });

  it("calculates 70% for Sample A from the records (7 of 10 on time and in full)", () => {
    const summary = computeOtif(samples.A.orders);
    expect(summary.both).toBe(7);
    expect(summary.total).toBe(10);
    expect(summary.percent).toBe(70);
  });

  it("calculates 80% for Sample B from the records (8 of 10 on time and in full)", () => {
    const summary = computeOtif(samples.B.orders);
    expect(summary.both).toBe(8);
    expect(summary.percent).toBe(80);
  });

  it("counts on-time and in-full separately from 'both'", () => {
    const a = computeOtif(samples.A.orders);
    expect(a.onTime).toBe(8);
    expect(a.inFull).toBe(8);
    expect(a.onTime).toBeGreaterThanOrEqual(a.both);
    expect(a.inFull).toBeGreaterThanOrEqual(a.both);
  });

  it("treats early delivery as on time and over-delivery as in full", () => {
    expect(
      classifyOrder({ id: "X", promisedDay: 5, deliveredDay: 4, orderedQty: 3, deliveredQty: 4 }),
    ).toMatchObject({ onTime: true, inFull: true, both: true });
  });

  it("describes misses in plain language", () => {
    const late = samples.A.orders.find((o) => o.id === "A07")!;
    expect(describeOrder(late)).toBe("Order A07: late by 2 days, short by 4 units");
  });

  it("returns 0% rather than NaN for an empty set", () => {
    expect(computeOtif([]).percent).toBe(0);
  });
});
