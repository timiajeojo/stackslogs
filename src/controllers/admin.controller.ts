import { Response } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { AuthRequest } from "../middleware/auth.middleware";
import { getBalance, ngnToKobo } from "../services/youngpg.service";
import { sumDepositFees } from "../utils/adminMath";

// All money below is in kobo, like everywhere else in the backend.

// Real fees come from Paystack itself (fetched and cached for a few minutes). Paystack's list of successful
// payments is matched to our deposits by reference, because the deposit id is used as the Paystack reference.
let feeCache: { at: number; map: Map<string, number> } | null = null;
async function paystackFeesByReference(): Promise<Map<string, number>> {
  if (feeCache && Date.now() - feeCache.at < 5 * 60_000) return feeCache.map;
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");

  const map = new Map<string, number>();
  for (let page = 1; page <= 50; page++) {
    const res = await fetch(`https://api.paystack.co/transaction?status=success&perPage=100&page=${page}`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15_000),
    });
    const json: any = await res.json().catch(() => null);
    if (!res.ok || !json?.status) throw new Error(json?.message || `Paystack error ${res.status}`);
    for (const t of json.data ?? []) {
      const fee = t?.fees === null || t?.fees === undefined ? NaN : Number(t.fees);
      if (typeof t?.reference === "string" && Number.isFinite(fee)) map.set(t.reference, fee);
    }
    if (page >= Number(json.meta?.pageCount ?? 1)) break;
  }
  feeCache = { at: Date.now(), map };
  return map;
}

// Things nothing can tell us automatically: YPG Media funding fees and your other business expenses.
// Created on first use, so there is no migration to run.
let ledgerReady: Promise<unknown> | null = null;
function ensureLedger() {
  if (!ledgerReady) {
    ledgerReady = db
      .execute(
        sql`CREATE TABLE IF NOT EXISTS admin_ledger (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          kind varchar(20) NOT NULL CHECK (kind IN ('funding', 'funding_fee', 'expense')),
          amount_kobo bigint NOT NULL CHECK (amount_kobo > 0),
          note text,
          created_at timestamptz NOT NULL DEFAULT now()
        )`
      )
      .catch((err) => {
        ledgerReady = null; // try again next request
        throw err;
      });
  }
  return ledgerReady;
}

const num = (v: unknown) => Number(v ?? 0) || 0;

/** GET /api/admin/stats */
export async function getStats(_req: AuthRequest, res: Response) {
  try {
    await ensureLedger();

    const [deposits, balances, orders, ledger, supplier, reportedFees] = await Promise.all([
      db.execute(sql`SELECT id, amount::float8 AS amount FROM transactions WHERE type = 'deposit' AND status = 'completed'`),
      db.execute(sql`SELECT COALESCE(SUM(balance), 0)::float8 AS total FROM users`),
      db.execute(sql`
        SELECT
          COALESCE(SUM(price_paid) FILTER (WHERE status = 'completed'), 0)::float8 AS revenue,
          COALESCE(SUM(cost_kobo) FILTER (WHERE status = 'completed'), 0)::float8 AS cost,
          COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
          COUNT(*) FILTER (WHERE status = 'needs_review')::int AS review_count,
          COALESCE(SUM(price_paid) FILTER (WHERE status = 'needs_review'), 0)::float8 AS review_amount
        FROM supplier_orders`),
      db.execute(sql`SELECT kind, COALESCE(SUM(amount_kobo), 0)::float8 AS total FROM admin_ledger GROUP BY kind`),
      getBalance().then(
        (b) => ({ kobo: ngnToKobo(b.balance_ngn), error: null as string | null }),
        (err: any) => ({ kobo: null as number | null, error: String(err?.message || "Could not reach YPG Media") })
      ),
      paystackFeesByReference().catch((err) => {
        console.error("Could not read Paystack fees, estimating instead:", err?.message || err);
        return new Map<string, number>();
      }),
    ]);

    const depositRows = (deposits.rows as any[]).map((r) => ({ id: String(r.id), amount: num(r.amount) }));
    const o = orders.rows[0] as any;
    const ledgerBy: Record<string, number> = {};
    for (const r of ledger.rows as any[]) ledgerBy[r.kind] = num(r.total);

    const totalDeposits = depositRows.reduce((sum, d) => sum + d.amount, 0);
    const unusedDeposits = num((balances.rows[0] as any).total);
    const usedDeposits = num(o.revenue);
    const ypgReserve = num(o.cost);
    const grossProfit = usedDeposits - ypgReserve;

    const fees = sumDepositFees(depositRows, reportedFees);
    const fundingFees = ledgerBy.funding_fee ?? 0;
    const otherExpenses = ledgerBy.expense ?? 0;
    const netProfit = grossProfit - fees.total - fundingFees - otherExpenses;

    // Money you've put into YPG Media = what's left there now + what the site has spent there.
    // If YPG Media can't be reached, fall back to any funding records you entered by hand.
    const fundingFromBalance = supplier.kobo !== null;
    const totalYpgFunding = fundingFromBalance ? supplier.kobo! + ypgReserve : ledgerBy.funding ?? 0;

    res.json({
      totalDeposits,
      unusedDeposits,
      usedDeposits,
      ypgReserve,
      totalYpgFunding,
      totalYpgFundingSource: fundingFromBalance ? "calculated" : "records",
      grossProfit,
      netProfit,
      ypgBalance: supplier.kobo,
      ypgBalanceError: supplier.error,
      breakdown: {
        depositCount: depositRows.length,
        completedOrders: num(o.completed),
        paystackFees: fees.total,
        paystackFeesSource: fees.source,
        fundingFees,
        otherExpenses,
        ordersNeedingReview: num(o.review_count),
        needsReviewAmount: num(o.review_amount),
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("GET /api/admin/stats failed:", err);
    res.status(500).json({ error: "Failed to load stats" });
  }
}

/** GET /api/admin/ledger : latest 50 records */
export async function listLedger(_req: AuthRequest, res: Response) {
  try {
    await ensureLedger();
    const r = await db.execute(
      sql`SELECT id, kind, amount_kobo::float8 AS amount, note, created_at AS "createdAt"
          FROM admin_ledger ORDER BY created_at DESC LIMIT 50`
    );
    res.json({ records: r.rows });
  } catch (err) {
    console.error("GET /api/admin/ledger failed:", err);
    res.status(500).json({ error: "Failed to load records" });
  }
}

/** POST /api/admin/ledger  { kind: "funding" | "funding_fee" | "expense", amount: naira, note? } */
export async function addLedger(req: AuthRequest, res: Response) {
  try {
    const kind = String(req.body?.kind ?? "");
    const amountNaira = Number(req.body?.amount);
    const note = String(req.body?.note ?? "").trim().slice(0, 300) || null;

    if (!["funding", "funding_fee", "expense"].includes(kind)) {
      return res.status(400).json({ error: "Choose a record type" });
    }
    if (!Number.isFinite(amountNaira) || amountNaira <= 0 || amountNaira > 1_000_000_000) {
      return res.status(400).json({ error: "Enter a valid amount" });
    }

    await ensureLedger();
    await db.execute(
      sql`INSERT INTO admin_ledger (kind, amount_kobo, note) VALUES (${kind}, ${Math.round(amountNaira * 100)}, ${note})`
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("POST /api/admin/ledger failed:", err);
    res.status(500).json({ error: "Failed to save the record" });
  }
}

/** DELETE /api/admin/ledger/:id */
export async function deleteLedger(req: AuthRequest, res: Response) {
  try {
    const id = String(req.params.id ?? "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({ error: "Bad id" });
    }
    await ensureLedger();
    await db.execute(sql`DELETE FROM admin_ledger WHERE id = ${id}`);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/ledger failed:", err);
    res.status(500).json({ error: "Failed to delete the record" });
  }
}
