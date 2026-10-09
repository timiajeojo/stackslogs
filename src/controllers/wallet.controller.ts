import { desc, eq, sql } from "drizzle-orm";
import { db } from "./db";                       // your existing db instance
import { users, transactions } from "./db/schema"; // your existing schema file

app.get("/api/wallet", requireAuth, async (req, res) => {
  const userId = req.user.id;

  try {
    const [user] = await db
      .select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, userId));

    const [totals] = await db
      .select({
        totalDeposit: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'deposit' and ${transactions.status} = 'success'), 0)`,
        totalSpent: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'purchase' and ${transactions.status} = 'success'), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId));

    const history = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(50);

    res.json({
      balance: user?.balance ?? 0,
      total_deposit: Number(totals.totalDeposit),
      total_spent: Number(totals.totalSpent),
      transactions: history.map((t) => ({
        id: t.id,
        type: t.type,
        status: t.status,
        amount: t.amount,
        description: t.description,
        created_at: t.createdAt,
      })),
    });
  } catch {
    res.status(500).json({ error: "Failed to load wallet" });
  }
});