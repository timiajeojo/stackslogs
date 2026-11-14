import { Response } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { AuthRequest } from "../middleware/auth.middleware";
import { getBalance, ngnToKobo } from "../services/youngpg.service";
import { dayKeys, fillSeries, rangeStart, sumDepositFees } from "../utils/adminMath";

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

// Things nothing can tell us automatically: what you send to YPG Media, its fee, and other expenses.
// The table is created on first use, so there is no migration to run. A top-up is one 'funding' row plus an
// optional 'funding_fee' row that share a group_id.
let ledgerReady: Promise<unknown> | null = null;
function ensureLedger() {
  if (!ledgerReady) {
    ledgerReady = (async () => {
      await db.execute(
        sql`CREATE TABLE IF NOT EXISTS admin_ledger (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          kind varchar(20) NOT NULL CHECK (kind IN ('funding', 'funding_fee', 'expense')),
          amount_kobo bigint NOT NULL CHECK (amount_kobo > 0),
          note text,
          created_at timestamptz NOT NULL DEFAULT now()
        )`
      );
      await db.execute(sql`ALTER TABLE admin_ledger ADD COLUMN IF NOT EXISTS group_id uuid`);
    })().catch((err) => {
      ledgerReady = null; // try again next request
      throw err;
    });
  }
  return ledgerReady;
}

const num = (v: unknown) => Number(v ?? 0) || 0;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RANGES = [7, 30, 90, 365];

/** GET /api/admin/stats?days=30  (days: 7, 30, 90 or 365) */
export async function getStats(req: AuthRequest, res: Response) {
  try {
    await ensureLedger();

    const asked = parseInt(String(req.query.days ?? "30"), 10);
    const days = RANGES.includes(asked) ? asked : 30;
    const keys = dayKeys(days);
    const since = rangeStart(keys[0]).toISOString();

    // Timestamps in transactions / supplier_orders are stored as UTC wall-clock time; admin_ledger uses timestamptz.
    const lagosDay = (col: any) => sql`to_char((${col} AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Lagos', 'YYYY-MM-DD')`;

    const [deposits, balances, orders, review, ledger, supplier, reportedFees, dayDeposits, dayOrders, quick, activity] =
      await Promise.all([
        db.execute(sql`
          SELECT id, amount::float8 AS amount FROM transactions
          WHERE type = 'deposit' AND status = 'completed' AND created_at >= ${since}::timestamp`),
        db.execute(sql`SELECT COALESCE(SUM(balance), 0)::float8 AS total FROM users`),
        db.execute(sql`
          SELECT
            COALESCE(SUM(price_paid), 0)::float8 AS revenue,
            COALESCE(SUM(cost_kobo), 0)::float8 AS cost,
            COUNT(*)::int AS completed
          FROM supplier_orders WHERE status = 'completed' AND created_at >= ${since}::timestamp`),
        db.execute(sql`
          SELECT COUNT(*)::int AS count, COALESCE(SUM(price_paid), 0)::float8 AS amount
          FROM supplier_orders WHERE status = 'needs_review'`),
        db.execute(sql`
          SELECT kind, COALESCE(SUM(amount_kobo), 0)::float8 AS total FROM admin_ledger
          WHERE created_at >= ${since}::timestamptz GROUP BY kind`),
        getBalance().then(
          (b) => ({ kobo: ngnToKobo(b.balance_ngn), error: null as string | null }),
          (err: any) => ({ kobo: null as number | null, error: String(err?.message || "Could not reach YPG Media") })
        ),
        paystackFeesByReference().catch((err) => {
          console.error("Could not read Paystack fees, estimating instead:", err?.message || err);
          return new Map<string, number>();
        }),
        db.execute(sql`
          SELECT ${lagosDay(sql.raw("created_at"))} AS date, SUM(amount)::float8 AS deposits FROM transactions
          WHERE type = 'deposit' AND status = 'completed' AND created_at >= ${since}::timestamp GROUP BY 1`),
        db.execute(sql`
          SELECT ${lagosDay(sql.raw("created_at"))} AS date,
                 SUM(price_paid)::float8 AS purchases, SUM(price_paid - cost_kobo)::float8 AS profit
          FROM supplier_orders WHERE status = 'completed' AND created_at >= ${since}::timestamp GROUP BY 1`),
        db.execute(sql`
          SELECT (SELECT COUNT(*) FROM users)::int AS users,
                 (SELECT COUNT(*) FROM supplier_orders WHERE status = 'completed')::int AS purchases,
                 (SELECT COUNT(*) FROM transactions WHERE status = 'completed')::int AS transactions`),
        db.execute(sql`
          SELECT kind, amount, title, who, at FROM (
            SELECT 'deposit' AS kind, t.amount::float8 AS amount, NULL::text AS title,
                   COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.email) AS who,
                   t.created_at AS created, to_char(t.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS at
            FROM transactions t JOIN users u ON u.id = t.user_id
            WHERE t.type = 'deposit' AND t.status = 'completed'
            UNION ALL
            SELECT 'purchase', o.price_paid::float8, o.title,
                   COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.email),
                   o.created_at, to_char(o.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
            FROM supplier_orders o JOIN users u ON u.id = o.buyer_id
            WHERE o.status = 'completed'
          ) a ORDER BY created DESC LIMIT 8`),
      ]);

    const depositRows = (deposits.rows as any[]).map((r) => ({ id: String(r.id), amount: num(r.amount) }));
    const o = orders.rows[0] as any;
    const ledgerBy: Record<string, number> = {};
    for (const r of ledger.rows as any[]) ledgerBy[r.kind] = num(r.total);

    const totalDeposits = depositRows.reduce((sum, d) => sum + d.amount, 0);
    const usedDeposits = num(o.revenue);
    const ypgReserve = num(o.cost);
    const grossProfit = usedDeposits - ypgReserve;

    const fees = sumDepositFees(depositRows, reportedFees);
    const fundingFees = ledgerBy.funding_fee ?? 0;
    const otherExpenses = ledgerBy.expense ?? 0;
    const netProfit = grossProfit - fees.total - fundingFees - otherExpenses;

    const q = quick.rows[0] as any;
    const r0 = review.rows[0] as any;

    res.json({
      days,
      totalDeposits,
      unusedDeposits: num((balances.rows[0] as any).total), // right now, whatever the date range
      usedDeposits,
      ypgReserve,
      totalYpgFunding: ledgerBy.funding ?? 0,
      grossProfit,
      netProfit,
      ypgBalance: supplier.kobo, // right now, whatever the date range
      ypgBalanceError: supplier.error,
      breakdown: {
        depositCount: depositRows.length,
        completedOrders: num(o.completed),
        paystackFees: fees.total,
        paystackFeesEstimatedCount: depositRows.length - fees.fromPaystack,
        fundingFees,
        otherExpenses,
        ordersNeedingReview: num(r0.count),
        needsReviewAmount: num(r0.amount),
      },
      series: fillSeries(keys, [
        ...(dayDeposits.rows as any[]),
        ...(dayOrders.rows as any[]),
      ].reduce((acc: any[], row: any) => {
        const hit = acc.find((a) => a.date === row.date);
        if (hit) Object.assign(hit, row);
        else acc.push({ ...row });
        return acc;
      }, [])),
      quick: { users: num(q.users), purchases: num(q.purchases), transactions: num(q.transactions) },
      activity: (activity.rows as any[]).map((a) => ({
        kind: a.kind,
        amount: num(a.amount),
        title: a.title ?? null,
        who: a.who,
        at: a.at,
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("GET /api/admin/stats failed:", err);
    res.status(500).json({ error: "Failed to load stats" });
  }
}

/** GET /api/admin/topups : latest top-ups, each with its fee */
export async function listTopups(_req: AuthRequest, res: Response) {
  try {
    await ensureLedger();
    const r = await db.execute(
      sql`SELECT id, kind, amount_kobo::float8 AS amount, note, group_id AS "groupId",
                 to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt"
          FROM admin_ledger WHERE kind IN ('funding', 'funding_fee')
          ORDER BY created_at DESC, kind LIMIT 200`
    );
    const groups = new Map<string, { id: string; amount: number; fee: number; note: string | null; createdAt: string }>();
    for (const row of r.rows as any[]) {
      const key = String(row.groupId ?? row.id);
      const g = groups.get(key) ?? { id: key, amount: 0, fee: 0, note: null, createdAt: row.createdAt };
      if (row.kind === "funding") g.amount += num(row.amount);
      else g.fee += num(row.amount);
      g.note = g.note ?? row.note ?? null;
      groups.set(key, g);
    }
    res.json({ topups: [...groups.values()].slice(0, 20) });
  } catch (err) {
    console.error("GET /api/admin/topups failed:", err);
    res.status(500).json({ error: "Failed to load top-ups" });
  }
}

/** POST /api/admin/topups  { amount: naira, fee?: naira, note? } */
export async function addTopup(req: AuthRequest, res: Response) {
  try {
    const amount = Number(req.body?.amount);
    const fee = req.body?.fee === undefined || req.body?.fee === "" ? 0 : Number(req.body.fee);
    const note = String(req.body?.note ?? "").trim().slice(0, 300) || null;

    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
      return res.status(400).json({ error: "Enter the amount you sent" });
    }
    if (!Number.isFinite(fee) || fee < 0 || fee > 1_000_000_000) {
      return res.status(400).json({ error: "Enter a valid fee (or leave it empty)" });
    }

    await ensureLedger();
    const amountKobo = Math.round(amount * 100);
    const feeKobo = Math.round(fee * 100);
    // One statement, so the top-up and its fee are saved together or not at all.
    await db.execute(sql`
      WITH g AS (SELECT gen_random_uuid() AS id)
      INSERT INTO admin_ledger (kind, amount_kobo, note, group_id)
      SELECT 'funding'::varchar, ${amountKobo}::bigint, ${note}::text, g.id FROM g
      UNION ALL
      SELECT 'funding_fee'::varchar, ${feeKobo}::bigint, ${note}::text, g.id FROM g WHERE ${feeKobo}::bigint > 0`);
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("POST /api/admin/topups failed:", err);
    res.status(500).json({ error: "Failed to save the top-up" });
  }
}

/** DELETE /api/admin/topups/:id  (the top-up's id as returned by the list) */
export async function deleteTopup(req: AuthRequest, res: Response) {
  try {
    const id = String(req.params.id ?? "");
    if (!UUID_RE.test(id)) return res.status(400).json({ error: "Bad id" });
    await ensureLedger();
    await db.execute(sql`DELETE FROM admin_ledger WHERE group_id = ${id}::uuid OR id = ${id}::uuid`);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/topups failed:", err);
    res.status(500).json({ error: "Failed to delete the top-up" });
  }
}
