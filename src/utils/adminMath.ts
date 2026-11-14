// Pure money helpers for the admin dashboard (no imports, so they are easy to test). All amounts are kobo.

// Paystack's local card fee: 1.5% + N100 (the N100 is waived under N2,500), capped at N2,000.
// Only used for a deposit when Paystack itself doesn't report the fee. Edit if Paystack changes its pricing.
const PERCENT = 0.015;
const FLAT_KOBO = 10_000;
const FLAT_WAIVED_BELOW_KOBO = 250_000;
const CAP_KOBO = 200_000;

export function estimatePaystackFee(amountKobo: number): number {
  return Math.min(CAP_KOBO, Math.round(amountKobo * PERCENT) + (amountKobo >= FLAT_WAIVED_BELOW_KOBO ? FLAT_KOBO : 0));
}

export type Deposit = { id: string; amount: number };

/**
 * Total Paystack fees for the given completed deposits. A deposit uses the fee Paystack reported for it
 * (matched by reference = deposit id); any deposit Paystack didn't report falls back to the estimate.
 */
export function sumDepositFees(deposits: Deposit[], reported: Map<string, number>) {
  let total = 0;
  let fromPaystack = 0;
  for (const d of deposits) {
    const fee = reported.get(d.id);
    if (fee !== undefined) {
      total += fee;
      fromPaystack++;
    } else {
      total += estimatePaystackFee(d.amount);
    }
  }
  const source: "paystack" | "mixed" | "estimated" =
    deposits.length === 0 || fromPaystack === deposits.length ? "paystack" : fromPaystack === 0 ? "estimated" : "mixed";
  return { total, fromPaystack, source };
}

// ---- Dashboard date range and chart series ----

const TZ = "Africa/Lagos"; // UTC+1, no daylight saving
const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** The last `days` calendar days (oldest first, ending today) as YYYY-MM-DD in Lagos time. */
export function dayKeys(days: number, now: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) keys.push(dayFmt.format(new Date(now.getTime() - i * 86_400_000)));
  return keys;
}

/** When the first of those days starts, as a UTC instant (Lagos is a fixed UTC+1). */
export function rangeStart(firstDay: string): Date {
  return new Date(`${firstDay}T00:00:00+01:00`);
}

export type SeriesPoint = { date: string; deposits: number; purchases: number; profit: number };

/** One point per day, with zeros for days that had nothing. `rows` are the sums the database found per day. */
export function fillSeries(keys: string[], rows: Partial<SeriesPoint>[]): SeriesPoint[] {
  const byDay = new Map(rows.map((r) => [String(r.date), r]));
  return keys.map((date) => {
    const r = byDay.get(date);
    return { date, deposits: Number(r?.deposits ?? 0), purchases: Number(r?.purchases ?? 0), profit: Number(r?.profit ?? 0) };
  });
}
