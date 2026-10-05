/**
 * The operations lens — pure OTIF (on time, in full) logic.
 *
 * Every record below is fictional sample data written for this page. Nothing
 * here comes from an employer, a client or a real delivery system, and the
 * percentages are calculated from these records rather than typed in.
 */

export type Order = {
  id: string;
  /** Day the order was promised (day number within the sample period). */
  promisedDay: number;
  /** Day the order actually arrived. */
  deliveredDay: number;
  orderedQty: number;
  deliveredQty: number;
};

export type SampleId = "A" | "B";

export type Sample = {
  id: SampleId;
  label: string;
  orders: Order[];
};

const order = (
  id: string,
  promisedDay: number,
  deliveredDay: number,
  orderedQty: number,
  deliveredQty: number,
): Order => ({ id, promisedDay, deliveredDay, orderedQty, deliveredQty });

/** Sample A: ten fictional orders, seven of them both on time and in full. */
const sampleA: Order[] = [
  order("A01", 3, 3, 20, 20),
  order("A02", 5, 4, 12, 12),
  order("A03", 4, 6, 8, 8), // late, complete
  order("A04", 2, 2, 30, 28), // on time, short
  order("A05", 6, 6, 15, 15),
  order("A06", 3, 3, 10, 10),
  order("A07", 5, 7, 24, 20), // late and short
  order("A08", 4, 4, 6, 6),
  order("A09", 1, 1, 40, 40),
  order("A10", 2, 2, 18, 18),
];

/** Sample B: ten fictional orders, eight of them both on time and in full. */
const sampleB: Order[] = [
  order("B01", 2, 2, 14, 14),
  order("B02", 3, 3, 22, 22),
  order("B03", 5, 5, 9, 9),
  order("B04", 4, 5, 16, 16), // late, complete
  order("B05", 1, 1, 30, 30),
  order("B06", 6, 5, 12, 12),
  order("B07", 3, 3, 25, 21), // on time, short
  order("B08", 2, 2, 8, 8),
  order("B09", 4, 4, 18, 18),
  order("B10", 5, 5, 11, 11),
];

export const samples: Record<SampleId, Sample> = {
  A: { id: "A", label: "Sample A", orders: sampleA },
  B: { id: "B", label: "Sample B", orders: sampleB },
};

export const sampleIds = Object.keys(samples) as SampleId[];

export const OTIF_DEFINITION =
  "OTIF = orders delivered on time and in full ÷ all orders";

export type OrderStatus = {
  onTime: boolean;
  inFull: boolean;
  both: boolean;
  daysLate: number;
  unitsShort: number;
};

export function classifyOrder(o: Order): OrderStatus {
  const onTime = o.deliveredDay <= o.promisedDay;
  const inFull = o.deliveredQty >= o.orderedQty;
  return {
    onTime,
    inFull,
    both: onTime && inFull,
    daysLate: Math.max(0, o.deliveredDay - o.promisedDay),
    unitsShort: Math.max(0, o.orderedQty - o.deliveredQty),
  };
}

export type OtifSummary = {
  total: number;
  onTime: number;
  inFull: number;
  both: number;
  /** Whole-number percentage of orders that were both on time and in full. */
  percent: number;
};

export function computeOtif(orders: readonly Order[]): OtifSummary {
  let onTime = 0;
  let inFull = 0;
  let both = 0;
  for (const o of orders) {
    const s = classifyOrder(o);
    if (s.onTime) onTime += 1;
    if (s.inFull) inFull += 1;
    if (s.both) both += 1;
  }
  const total = orders.length;
  return {
    total,
    onTime,
    inFull,
    both,
    percent: total === 0 ? 0 : Math.round((both / total) * 100),
  };
}

/** Plain-language description of one order, used for assistive text. */
export function describeOrder(o: Order): string {
  const s = classifyOrder(o);
  const time = s.onTime
    ? "on time"
    : `late by ${s.daysLate} day${s.daysLate === 1 ? "" : "s"}`;
  const full = s.inFull
    ? "in full"
    : `short by ${s.unitsShort} unit${s.unitsShort === 1 ? "" : "s"}`;
  return `Order ${o.id}: ${time}, ${full}`;
}
