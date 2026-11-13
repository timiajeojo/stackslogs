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
