import express from "express";
import catalogRoutes from "./routes/catalog.routes";
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
import { createCheckoutSession, verifyBachsSignature } from "./services/bachs.service";
import walletRoutes from "./routes/wallet.routes";
// ASSUMPTION: passwords are hashed with bcrypt. If auth.routes.ts uses "bcrypt" or argon2, match it here.
import bcrypt from "bcryptjs";

const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors());
app.use("/api/wallet", walletRoutes);

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
app.use("/api/catalog", catalogRoutes);
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

// ---- Account settings (used by the /settings page) ----
const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : "";

const accountPayload = (u: typeof users.$inferSelect) => ({
  email: u.email,
  firstName: u.firstName ?? "",
  lastName: (u as any).lastName ?? "",
  phone: (u as any).phone ?? "",
});

app.get("/api/account", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(accountPayload(user));
  } catch (err) {
    console.error("GET /api/account failed:", err);
    res.status(500).json({ error: "Couldn't load your details." });
  }
});

app.patch("/api/account", requireAuth, async (req: AuthRequest, res) => {
  try {
    const firstName = clean(req.body?.firstName, 100);
    const lastName = clean(req.body?.lastName, 100);
    const phone = clean(req.body?.phone, 30);

    if (!firstName) return res.status(400).json({ error: "First name is required." });
    if (phone && !/^[0-9+()\-\s]{7,30}$/.test(phone)) {
      return res.status(400).json({ error: "Enter a valid phone number." });
    }

    const [updated] = await db
      .update(users)
      .set({ firstName, lastName, phone } as any)
      .where(eq(users.id, req.userId!))
      .returning();

    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json(accountPayload(updated));
  } catch (err) {
    console.error("PATCH /api/account failed:", err);
    res.status(500).json({ error: "Couldn't save your changes." });
  }
});

app.put("/api/account/password", requireAuth, async (req: AuthRequest, res) => {
  try {
    const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Fill in all password fields." });
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      return res.status(400).json({ error: "New password must be 8 to 128 characters." });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ error: "New password must be different from the current one." });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
    if (!user) return res.status(404).json({ error: "User not found" });

    // ASSUMPTION: the hash column is `passwordHash`. Rename if your schema differs.
    const ok = await bcrypt.compare(currentPassword, (user as any).passwordHash);
    if (!ok) {
      // 400 (not 401) so the frontend doesn't treat it as an expired session.
      return res.status(400).json({ error: "Current password is incorrect." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash } as any).where(eq(users.id, req.userId!));
    res.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/account/password failed:", err);
    res.status(500).json({ error: "Couldn't change your password." });
  }
});

app.delete("/api/account", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
    if (!user) return res.status(404).json({ error: "User not found" });

    // Block deletion while there is still money in the account (balance is in kobo).
    if (Number(user.balance) > 0) {
      return res.status(400).json({
        error: "You still have funds in your account. Use up your balance before deleting your account.",
      });
    }

    try {
      // Sequential deletes: db.transaction() isn't supported by every driver (e.g. neon-http),
      // which is a likely reason deletion was failing before.
      await db.delete(transactions).where(eq(transactions.userId, req.userId!));
      await db.delete(users).where(eq(users.id, req.userId!));
    } catch (delErr: any) {
      const code = delErr?.code ?? delErr?.cause?.code;
      console.error("Hard delete failed:", code, delErr?.message ?? delErr);
      if (code !== "23503") throw delErr; // 23503 = foreign key violation (e.g. orders table)
      // Other tables still reference this user: anonymise so the account is closed and can't log in.
      await db
        .update(users)
        .set({
          email: `deleted+${req.userId}@deleted.invalid`,
          firstName: "",
          lastName: "",
          phone: "",
          balance: 0,
        } as any)
        .where(eq(users.id, req.userId!));
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/account failed:", err);
    res.status(500).json({ error: "Couldn't delete your account." });
  }
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
      } catch (err: any) {
    console.error(err);
    res.status(500).json({
      error: "Failed to start payment",
      detail: err?.cause?.message || err?.message || String(err),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});