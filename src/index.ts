import express from "express";
import catalogRoutes from "./routes/catalog.routes";
import { warmStorefront } from "./controllers/catalog.controller";
import authRoutes from "./routes/auth.routes";
import { requireAuth, AuthRequest } from "./middleware/auth.middleware";
import cors from "cors";
import listingsRoutes from "./routes/listings.routes";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import "dotenv/config";
import { z } from "zod";
import { db } from "./db";
import { users, transactions } from "./db/schema";
import { eq, and, ne, sql } from "drizzle-orm";
import { initializeTransaction, verifyTransaction, verifyPaystackSignature } from "./services/paystack.service";
import walletRoutes from "./routes/wallet.routes";
import accountRoutes from "./routes/account.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors());
app.use("/api/wallet", walletRoutes);

/**
 * Marks a deposit as paid and adds it to the user's balance, exactly once.
 * Used by both the Paystack webhook and the "verify" check after the user returns from checkout.
 */
async function creditDeposit(
  reference: string,
  paidKobo: number,
  currency?: string
): Promise<"completed" | "ignored" | "mismatch"> {
  if (!z.string().uuid().safeParse(reference).success) return "ignored";
  if (currency && currency !== "NGN") return "ignored";

  const [txn] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, reference), eq(transactions.type, "deposit")));
  if (!txn) return "ignored";
  if (txn.status === "completed") return "completed"; // already credited

  if (paidKobo !== txn.amount) {
    console.error(`Paystack amount mismatch for ${reference}: paid ${paidKobo}, expected ${txn.amount}`);
    return "mismatch";
  }

  // The status check makes this safe if the webhook and the verify check arrive at the same time.
  const [updated] = await db
    .update(transactions)
    .set({ status: "completed" })
    .where(and(eq(transactions.id, reference), ne(transactions.status, "completed")))
    .returning();

  if (updated) {
    await db
      .update(users)
      .set({ balance: sql`${users.balance} + ${updated.amount}` })
      .where(eq(users.id, updated.userId));
  }
  return "completed";
}

// Paystack webhook. Needs the raw body to check the signature, so it comes before express.json().
app.post("/webhooks/paystack", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const signature = req.get("x-paystack-signature");
    if (!signature || !verifyPaystackSignature(signature, req.body)) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const event = JSON.parse(req.body.toString("utf8"));
    console.log("Paystack webhook event:", event.event, event.data?.reference);

    if (event.event === "charge.success") {
      await creditDeposit(String(event.data?.reference ?? ""), Number(event.data?.amount), event.data?.currency);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Paystack webhook failed:", err);
    res.status(500).json({ error: "Webhook failed" }); // Paystack will retry
  }
});

app.use(express.json());
app.use("/api/catalog", catalogRoutes);
app.use("/api/account", accountRoutes);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use("/api/admin", adminRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingsRoutes);
app.get("/api/me", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user.id, email: user.email, firstName: user.firstName, balance: user.balance });
});

// Start a deposit: record it as pending, then send the user to Paystack's checkout page.
app.post("/api/wallet/fund", requireAuth, async (req: AuthRequest, res) => {
  try {
    const amountNaira = Number(req.body.amount);
    if (!amountNaira || amountNaira < 100) {
      return res.status(400).json({ error: "Minimum deposit is ₦100" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
    if (!user) return res.status(404).json({ error: "User not found" });

    const amountKobo = Math.round(amountNaira * 100);

    const [txn] = await db
      .insert(transactions)
      .values({
        userId: req.userId!,
        type: "deposit",
        amount: amountKobo,
        status: "pending",
      })
      .returning();

    try {
      const frontend = process.env.FRONTEND_URL?.replace(/\/$/, "");
      const session = await initializeTransaction({
        email: user.email,
        amountKobo,
        reference: txn.id,
        callbackUrl: frontend ? `${frontend}/wallet` : undefined,
      });

      await db.update(transactions).set({ externalId: session.access_code }).where(eq(transactions.id, txn.id));

      res.json({ checkout_url: session.authorization_url });
    } catch (err) {
      await db.update(transactions).set({ status: "failed" }).where(eq(transactions.id, txn.id));
      throw err;
    }
  } catch (err: any) {
    console.error("Failed to start payment:", err);
    res.status(500).json({
      error: "Failed to start payment",
      detail: err?.message || String(err),
    });
  }
});

// Called when the user comes back from Paystack: confirms the payment with Paystack and credits it.
app.get("/api/wallet/verify", requireAuth, async (req: AuthRequest, res) => {
  const ref = z.string().uuid().safeParse(req.query.reference);
  if (!ref.success) return res.status(400).json({ error: "Invalid reference" });

  try {
    const [txn] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, ref.data), eq(transactions.userId, req.userId!), eq(transactions.type, "deposit")));
    if (!txn) return res.status(404).json({ error: "Payment not found" });
    if (txn.status === "completed") return res.json({ status: "completed" });

    const data = await verifyTransaction(ref.data);

    if (data.status === "success") {
      const result = await creditDeposit(ref.data, data.amount, data.currency);
      return res.json({ status: result === "completed" ? "completed" : "pending" });
    }

    if (data.status === "failed") {
      await db
        .update(transactions)
        .set({ status: "failed" })
        .where(and(eq(transactions.id, ref.data), eq(transactions.status, "pending")));
      return res.json({ status: "failed" });
    }

    res.json({ status: "pending" });
  } catch (err) {
    console.error("Payment verify failed:", err);
    res.status(502).json({ error: "Could not confirm the payment right now" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  warmStorefront(); // build the catalog now, not when the first visitor arrives
});
