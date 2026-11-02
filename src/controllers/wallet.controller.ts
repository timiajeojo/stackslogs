import { Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { users, transactions } from "../db/schema";
import { AuthRequest } from "../middleware/auth.middleware";

export async function getWallet(req: AuthRequest, res: Response) {
  try {
    const [user] = await db
      .select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, req.userId!));

    if (!user) return res.status(404).json({ error: "User not found" });

    const rows = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, req.userId!))
      .orderBy(desc(transactions.createdAt));

    const completed = rows.filter((t) => t.status === "completed");

    const totalDeposits = completed
      .filter((t) => t.type === "deposit")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSpent = completed
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    res.json({
      balance: user.balance,
      totalDeposits,
      totalSpent,
      transactions: rows.slice(0, 50),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load wallet" });
  }
}