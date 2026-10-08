import express from "express";
import authRoutes from "./routes/auth.routes";
import { requireAuth, AuthRequest } from "./middleware/auth.middleware";
import cors from "cors";
import listingsRoutes from "./routes/listings.routes";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import "dotenv/config";
import { db } from "./db";
import { users, transactions } from "./db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getDatamollClient } from "./services/datamoll.service";
import { createCheckoutSession, verifyBachsSignature } from "./services/bachs.service";

const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors());

app.post(
  "/webhooks/bachs",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.get("X-Bachs-Signature-V2");
    if (!signature || !verifyBachsSignature(signature, req.body, process.env.BACHS_WEBHOOK_SECRET!)) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const event = JSON.parse(req.body.toString("utf8"));
    console.log("Bachs webhook event:", JSON.stringify(event, null, 2));

    if (event.type === "checkout.completed" || event.type === "collection.succeeded") {
      const reference =
        event.data?.reference ??
        event.data?.checkout_session?.reference ??
        event.data?.metadata?.reference;

      const externalId = event.data?.checkout_id ?? event.data?.id;

      let txnId: string | undefined = reference;

      if (!txnId && externalId) {
        const [match] = await db
          .select()
          .from(transactions)
          .where(eq(transactions.externalId, externalId));
        txnId = match?.id;
      }

      if (txnId) {
        const [updated] = await db
          .update(transactions)
          .set({ status: "completed" })
          .where(and(eq(transactions.id, txnId), eq(transactions.status, "pending")))
          .returning();

        if (updated) {
          await db
            .update(users)
            .set({ balance: sql`${users.balance} + ${updated.amount}` })
            .where(eq(users.id, updated.userId));
        }
      }
    }

    if (event.type === "checkout.expired" || event.type === "collection.failed") {
      const reference = event.data?.reference ?? event.data?.checkout_session?.reference;
      if (reference) {
        await db
          .update(transactions)
          .set({ status: "failed" })
          .where(and(eq(transactions.id, reference), eq(transactions.status, "pending")));
      }
    }

    res.status(200).json({ received: true });
  }
);

app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

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

app.post("/api/wallet/fund", requireAuth, async (req: AuthRequest, res) => {
  try {
    const amountNaira = Number(req.body.amount);
    if (!amountNaira || amountNaira <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
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

    const session = await createCheckoutSession({
      amountNaira,
      email: user.email,
      reference: txn.id,
    });

    await db
      .update(transactions)
      .set({ externalId: session.checkout_id })
      .where(eq(transactions.id, txn.id));

    res.json({ checkout_url: session.checkout_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start payment" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


app.get("/api/categories", async (req, res) => {
  try {
    const datamoll = await getDatamollClient();
    const { data } = await datamoll.listCategories({ language: "en" });
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch categories",
      detail: err?.message || String(err),
      data: err?.response?.data || null,
    });
  }
});


app.get("/api/catalog", async (req, res) => {
  try {
    const datamoll = await getDatamollClient();
    const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;

    const { data } = await datamoll.listCatalog({
      language: "en",
      only_in_stock: true,
      ...(categoryId ? { category_id: categoryId } : {}),
    });

    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch catalog",
      detail: err?.message || String(err),
      data: err?.response?.data || null,
    });
  }
});