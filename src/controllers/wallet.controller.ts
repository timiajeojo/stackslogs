import { Response } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { users, transactions } from "../db/schema";
import { AuthRequest } from "../middleware/auth.middleware";

/**
 * GET /api/wallet?page=1&limit=10
 * Returns the user's balance, lifetime totals (deposits and purchases) and one page of transactions.
 * All amounts are in kobo.
 */
export async function getWallet(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "10"), 10) || 10, 1), 50);

    const [user] = await db.select({ balance: users.balance }).from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ error: "User not found" });

    // Totals are calculated in the database so they cover every transaction, not just this page.
    const [agg] = await db
      .select({
        total: sql<number>`count(*)::int`,
        deposits: sql<number>`coalesce(sum(case when ${transactions.type} = 'deposit' and ${transactions.status} = 'completed' then ${transactions.amount} else 0 end), 0)::float8`,
        spent: sql<number>`coalesce(sum(case when ${transactions.status} = 'completed' and ${transactions.amount} < 0 then -${transactions.amount} else 0 end), 0)::float8`,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId));

    const rows = await db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        status: transactions.status,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const total = Number(agg?.total ?? 0);

    res.json({
      balance: Number(user.balance),
      totalDeposits: Number(agg?.deposits ?? 0),
      totalSpent: Number(agg?.spent ?? 0),
      transactions: rows,
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (err) {
    console.error("getWallet failed:", err);
    res.status(500).json({ error: "Failed to load wallet" });
  }
}
